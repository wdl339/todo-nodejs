const mongoose = require('mongoose')
const Schema = mongoose.Schema

const User = new Schema ({
    name : {type : String},
    userName : {type : String},
    passWord : {type : String}
})

module.exports = mongoose.model('users', User)