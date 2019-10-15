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

module.exports = function(app) {
  app.route('/api/stock-prices').get(async function(req, res) {
    let { stock, like } = req.query;
    let stockData = {};
    let ip = req.ip || req.ips;

    if (Array.isArray(stock)) {
      let [stock1, stock2] = stock;
      let price1 = await parse(stock1);
      let price2 = await parse(stock2);

      stockData = [
        {
          stock: stock1,
          price1,
        },
        {
          stock: stock2,
          price2,
        },
      ];
    } else {
      try {
        let price = await parse(stock);
        // let likeCount = like ? 1 : 0;
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
            stockDb.likeCount++;
            stockDb = await stockDb.save();
          } else {
            // like = false || ip is already there
            stockDb = await stockDb.save();
          }
        }
        stockData = {
          stock,
          price,
          likes: stockDb.likeCount,
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
