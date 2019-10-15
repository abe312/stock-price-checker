/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

'use strict';

var expect = require('chai').expect;
require('dotenv').config();
const fetch = require('node-fetch');

const mongoose = require('mongoose');
const Stock = mongoose.model('stocks');

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

async function parse(stock) {
  console.log(stock);
  try {
    const response = await fetch(
      `https://cloud-sse.iexapis.com/stable/stock/${stock}/quote/latestPrice?token=${process.env.iex}`,
    );
    const data = await response.json();

    console.log(data);
    return data;
    // return Object.values(data['Time Series (Daily)'])[0]['4. close'];
  } catch (e) {
    console.error(e);
  }
}

async function stockParser(stock, price, like, ip) {
  try {
    let stockDb = await Stock.findOne({ name: stock });

    if (!stockDb) {
      stockDb = new Stock({
        name: stock,
        lastPrice: price,
        updatedOn: Date.now(),
      });
      if (like) {
        console.log(stockDb.likes);
        stockDb.likes.unshift({ ip });
        stockDb.likeCount = 1;
        console.log(stockDb.likes);
      }
      stockDb = await stockDb.save();
    } else {
      // stock is there
      if (like && !stockDb.likes.find(item => item.ip === ip)) {
        stockDb.likes.unshift({ ip });
        if (stockDb.likeCount) stockDb.likeCount++;
        else stockDb.likeCount = 1;
        stockDb = await stockDb.save();
      } else {
        // like = false || ip is already there
        stockDb = await stockDb.save();
      }
    }
    return stockDb.likeCount;
  } catch (e) {
    console.log(e);
  }
}

module.exports = function(app) {
  app.route('/api/stock-prices').get(async function(req, res) {
    let { stock, like } = req.query;
    let stockData = {};
    let ip = req.ip || req.ips;

    if (Array.isArray(stock)) {
      let [stock1, stock2] = stock;
      let price1 = await parse(stock1);
      let likeCount1 = (await stockParser(stock1, price1, like, ip)) || 0;

      let price2 = await parse(stock2);
      let likeCount2 = (await stockParser(stock2, price2, like, ip)) || 0;

      stockData = [
        {
          stock: stock1,
          price1,
          rel_likes: likeCount1 - likeCount2,
        },
        {
          stock: stock2,
          price2,
          rel_likes: likeCount2 - likeCount1,
        },
      ];
    } else {
      try {
        let price = await parse(stock);
        let likeCount = (await stockParser(stock, price, like, ip)) || 0;

        stockData = {
          stock,
          price,
          likes: likeCount,
        };
      } catch (e) {
        console.log(e);
      }
    }
    res.json({
      stockData,
    });
  });
};
