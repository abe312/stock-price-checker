const mongoose = require('mongoose');
const { Schema } = mongoose;

const likeSchema = require('./Like');

const StockSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  likes: [likeSchema],
  likeCount: Number,
  lastPrice: Number,
  updatedOn: {
    type: Date,
    default: Date.Now,
  },
});

// if updated less than 1 hour ago then don't use an api call to optimize the requests
// ip likes: is ip is present don't increase the like count (for one perticular stock)
//

mongoose.model('stocks', StockSchema);
