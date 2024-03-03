const mongoose = require('mongoose');
const { Schema } = require('mongoose');
const User = require('./user.js')

const transactionSchema = new Schema({
    amount: {
        type: Number,
        require: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    other: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    date: {
        type: Date, default: Date.now
    },
    description: String,
    splittype: {
        type: String,
        enum: ["you paid split equally", "other paid split equally", "you paid full amount", "other paid full amount"]
    }



});

module.exports = mongoose.model('Transaction', transactionSchema);