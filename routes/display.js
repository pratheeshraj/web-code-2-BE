var express = require("express");
var router = express.Router();
const mongodb = require("mongodb");
const mongoclient = mongodb.MongoClient;
const dotenv = require("dotenv").config();
var cors = require("cors");
router.use(cors());

/* GET users listing. */
router.get("/display/:query", async function (req, res, next) {
  try {
    //create
    const connection = await mongoclient.connect(process.env.dburl);
    const db = connection.db("webscrap_ecommerce");
    console.log(db);
    // Select Collection
    // Do operation (CRUD)
    const user = await db
      .collection("scrapedDatas")
      .findOne({ query: req.params.query });

    // Close the connection
    console.log(user);
    await connection.close();
    res.send(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
