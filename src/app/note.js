const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Note = new Schema ({
    title : {type : String},
    detail : {type : String},
    link : {type : String},
    isImportant : {type : Boolean},
    dateTime : {type : Date},
    user_id : {type : Object}
})

module.exports = mongoose.model('notes', Note)
