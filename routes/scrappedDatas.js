var express = require("express");
var router = express.Router();
const axios = require("axios");
const cheerio = require("cheerio");
const mongodb = require("mongodb");
const mongoclient = mongodb.MongoClient;
const dotenv = require("dotenv").config();
var cors = require("cors");
router.use(cors());

router.get("/create/:query", async function (req, res) {
  try {
    let amazon_product_website,
      amazon_product_title,
      amazon_product_price,
      amazon_product_rating,
      amazon_product_imgurl;
    let flipkart_product_website,
      flipkart_product_title,
      flipkart_product_offer_price,
      flipkart_product_actual_price,
      flipkart_product_rating,
      flipkart_product_imgurl;

    //For AMAZON
    async function f() {
      const connection = await mongoclient.connect(process.env.dburl);
      const db = connection.db("webscrap_ecommerce");
      let flipkart_url = `https://www.flipkart.com/search?q=${req.params.query}`;

      const fpage = await axios.get(flipkart_url);
      // console.log(fpage.data);
      const a = cheerio.load(fpage.data);
      a("._3pLy-c")
        .first()
        .each((index, elements) => {
          flipkart_product_title = a(elements).find("._4rR01T").text();
          flipkart_product_rating = a(elements).find("._3LWZlK").text();
          flipkart_product_offer_price = a(elements).find("._30jeq3").text();
          flipkart_product_actual_price = a(elements).find("._3I9_wc").text();
          flipkart_product_website = flipkart_url;
        });
      a(".MIXNux")
        .first()
        .each((index, elements) => {
          flipkart_product_imgurl = a(elements).find("._396cs4").attr("src");
        });

      let amazon_url = `https://www.amazon.in/s?k=${req.params.query}`;
      const azpage = await axios.get(amazon_url, {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:107.0) Gecko/20100101 Firefox/107.0",
        },
      }); //here headers are sent along with the url to lool like the request was made by the browser..
      const $ = cheerio.load(azpage.data);
      $('div[data-component-type="s-search-result"]')
        .first()
        .each((index, elements) => {
          amazon_product_title = $(elements).find(".a-size-medium").text();
          amazon_product_rating = $(elements).find(".a-icon-alt").text();
          amazon_product_price = $(elements).find(".a-offscreen").text();
          amazon_product_imgurl = $(elements).find(".s-image").attr("src");
          amazon_product_website = amazon_url;
        });

      let datas = {
        query: req.params.query,
        amazon: {
          product_website: amazon_product_website,
          product_title: amazon_product_title,
          product_offer_price: amazon_product_price.split("₹")[1],
          product_actual_price: amazon_product_price.split("₹")[2],
          product_rating: amazon_product_rating,
          product_imgurl: amazon_product_imgurl,
        },
        flipkart: {
          product_website: flipkart_product_website,
          product_title: flipkart_product_title,
          product_offer_price: flipkart_product_offer_price,
          product_actual_price: flipkart_product_actual_price,
          product_rating: flipkart_product_rating,
          product_imgurl: flipkart_product_imgurl,
        },
      };
      // Select Collection
      // Do operation (CRUD)
      const user = await db.collection("scrapedDatas").insertOne(datas);

      // Close the connection
      await connection.close();

      res.json({ message: "Data Created" });
    }

    f();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
