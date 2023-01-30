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
    async function f() {
      let amazon_product_website = [],
        amazon_product_title = [],
        amazon_product_price = [],
        amazon_product_rating = [],
        amazon_product_imgurl = [],
        flipkart_product_website = [],
        flipkart_product_title = [],
        flipkart_product_offer_price = [],
        flipkart_product_actual_price = [],
        flipkart_product_rating = [],
        flipkart_product_imgurl = [];

      //For AMAZON
      const connection = await mongoclient.connect(process.env.dburl);
      const db = connection.db("webscrap_ecommerce");
      let flipkart_url = `https://www.flipkart.com/search?q=${req.params.query}`;

      const fpage = await axios.get(flipkart_url);
      // console.log(fpage.data);
      const a = cheerio.load(fpage.data);
      a("._3pLy-c").each((index, elements) => {
        if (index < 10) {
          flipkart_product_title[index] = a(elements).find("._4rR01T").text();
          flipkart_product_rating[index] = a(elements).find("._3LWZlK").text();
          flipkart_product_offer_price[index] = a(elements)
            .find("._30jeq3")
            .text();
          flipkart_product_actual_price[index] = a(elements)
            .find("._3I9_wc")
            .text();
          flipkart_product_website[index] = flipkart_url;
        }

        console.log(flipkart_product_actual_price, "aaa");
      });
      a(".MIXNux").each((index, elements) => {
        if (index < 10) {
          flipkart_product_imgurl[index] = a(elements)
            .find("._396cs4")
            .attr("src");
        }
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
      $('div[data-component-type="s-search-result"]').each(
        (index, elements) => {
          if (index < 10) {
            amazon_product_title[index] = $(elements)
              .find(".a-size-medium")
              .text();
            amazon_product_rating[index] = $(elements)
              .find(".a-icon-alt")
              .text()
              .split(" ")[0];
            amazon_product_price[index] = $(elements)
              .find(".a-offscreen")
              .text();
            amazon_product_imgurl[index] = $(elements)
              .find(".s-image")
              .attr("src");
            amazon_product_website[index] = amazon_url;
          }
        }
      );

      let datas = {
        query: req.params.query,
        amazon: {
          product_website: amazon_product_website,
          product_title: amazon_product_title,
          product_offer_price: amazon_product_price,
          product_actual_price: amazon_product_price,
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

      res.status(200).json({ message: "Data Created" });
    }
    f();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
