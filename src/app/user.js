const mongoose = require('mongoose')
const Schema = mongoose.Schema

const User = new Schema ({
    userName : {type : String},
    passWord : {type : String},
    canvasUrl : {type : String},
    email : {type : String},
    lastUpdated: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('users', User)