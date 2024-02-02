const express = require('express')
const moment = require('moment');
const path = require('path')
const morgan = require('morgan')
const cors = require('cors')
const db = require("./src/config/db")
const Task = require('./src/app/task')
const User = require('./src/app/user')
const app = express()
const port = 8080

app.use(express.static(path.join(__dirname,"src/public")))
app.use(morgan('combined'))
app.use(express.urlencoded({
    extended :true
}))
app.use(express.json())

app.use(cors([{
    origin : "http://localhost:3000"
}]))

db.connect()

app.get('/', async (req, res) => {
    res.send('NODEJS')
})

//-----------------------------------------------Task

app.get('/api/tasks', async (req, res) => {
    try {
        const taskDocuments = await Task.find({})
        res.json(taskDocuments)
    } catch (error){
        res.status(500).json({error})
    }
  
})

app.post('/insert-task', async (req, res) => {
    const task = new Task(req.body)
    task.dateTime = moment().toDate();

    task.save()
        .then(() => res.redirect('http://localhost:3000/'))
        .catch(error => res.status(500).json({error}))
})

app.post('/update-task', async (req, res) => {
    const task = req.body
    
    Task.updateOne({_id : req.body._id}, task)
        .then(() => res.redirect('http://localhost:3000/'))
        .catch(error => res.status(500).json({error}))
})

app.post('/update-complete', async (req, res) => {

    Task.updateOne({_id : req.body._id},  { $set: { isComplete: req.body.isComplete } })
        .then(() => res.redirect('http://localhost:3000/'))
        .catch(error => res.status(500).json({error}))
})

app.post('/update-important', async (req, res) => {

    Task.updateOne({_id : req.body._id},  { $set: { isImportant: req.body.isImportant } })
        .then(() => res.redirect('http://localhost:3000/'))
        .catch(error => res.status(500).json({error}))
})

app.post('/delete-task', async (req, res) => {
    const id = req.body._id
    
    await Task.deleteOne({_id : id})
        .then(() => res.redirect('http://localhost:3000/'))
        .catch(error => res.status(500).json({error}))
})

app.post('/deleteAll-task', async (req, res) => {
    await Task.deleteMany({})
        .then(() => res.redirect(''))
        .catch(error => res.status(500).json({error}))
})

//----------------------------------------------User

app.get('/api/users', async (req, res) => {
    try {
        const userDocuments = await User.find({})
        res.json(userDocuments)
    } catch (error){
        res.status(500).json({error})
    }
  
})

app.post('/insert-user', async (req, res) => {
    const user = new User(req.body)

    user.save()
        .then(() => res.redirect(''))
        .catch(error => res.status(500).json({error}))
})

app.post('/update-user', async (req, res) => {
    const user = req.body
    
    User.updateOne({_id : req.body._id}, user)
        .then(() => res.redirect(''))
        .catch(error => res.status(500).json({error}))
})

app.post('/delete-user', async (req, res) => {
    const id = req.body._id
    
    await User.deleteOne({_id : id})
        .then(() => res.redirect(''))
        .catch(error => res.status(500).json({error}))
})

app.post('/deleteAll-user', async (req, res) => {
    await User.deleteMany({})
        .then(() => res.redirect(''))
        .catch(error => res.status(500).json({error}))
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})