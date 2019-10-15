const mongoose = require('mongoose');
const { Schema } = mongoose;

const likeSchema = new Schema({
  ip: {
    type: String,
    required: true,
  },
});

module.exports = likeSchema;
