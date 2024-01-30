const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Task = new Schema ({
    name : {type : String},
    desciption : {type : String},
    isComplete : {type : Boolean},
    isImportant : {type : Boolean},
    dateTime : {type : Date},
    user_id : {type : Object}
})

module.exports = mongoose.model('tasks', Task)
