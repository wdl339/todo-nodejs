const mongoose = require('mongoose')

async function connect(){
    try{
        await mongoose.connect('mongodb+srv://todo:wdl339@cluster0.gm35f9i.mongodb.net/todo?retryWrites=true&w=majority',{
            useNewUrlParser : true,
            useUnifiedTopology : true
        })
        console.log('Connected to MongoDB')
    } catch (error){
        console.log(error.message)
    }
}

module.exports = {connect}