const mongoose = require('mongoose')
const Schema = mongoose.Schema

const User = new Schema ({
    userName : {type : String},
    passWord : {type : String},
    canvasUrl : {type : String},
    email : {type : String}
})

module.exports = mongoose.model('users', User)