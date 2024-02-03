const express = require('express')
const path = require('path')
const morgan = require('morgan')
const cors = require('cors')
const db = require("./src/config/db")
const Task = require('./src/app/task')
const User = require('./src/app/user')
const ical = require('node-ical');
const moment = require('moment');
const app = express()
const port = 8080

app.use(express.static(path.join(__dirname,"src/public")))
app.use(morgan('combined'))
app.use(express.urlencoded({
    extended :true
}))
app.use(express.json())

app.use(cors([{
    origin : "https://todo-reactjs-flax.vercel.app"
},
{
    origin : "https://todo-reactjs-flax.vercel.app/"
}
]))

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

app.get('/api/eventlist', async (req, res) => {
    try {
        const url = "https://oc.sjtu.edu.cn/feeds/calendars/user_5ANNdRErwaHFWaUwCJuLqUk2kyoSNRwMGFtN933O.ics";
        const data = await fetch(url);
        const textData = await data.text();
        const events = ical.parseICS(textData);

        const eventList = [];
        const now = moment();
        for (const key in events) {
            if (events.hasOwnProperty(key)) {
                const event = events[key];
                if (event.type === 'VEVENT') {
                    const endDate = moment(event.end);
                    if (endDate.isBefore(now)) {
                        continue;
                    }
                    const ddlTimeStr = endDate.format('YYYY-MM-DD HH:mm');

                    let ddlTime = new Date(ddlTimeStr);
                    ddlTime = ddlTime.getTime() + ddlTime.getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000;
                
                    let newEvent = {
                        name: event.summary,
                        description: event.description || '',
                        isComplete: false,
                        isImportant: false,
                        deadLine: new Date(ddlTime),
                    };

                    eventList.push(newEvent);
                }
            }
        }

        res.json(eventList);
    } catch (error) {
        res.status(500).json({error});
    }
});

app.post('/insert-task', async (req, res) => {
    const task = new Task(req.body)
    const currentTime = new Date();
    const currentUTCTimestamp = currentTime.getTime() + currentTime.getTimezoneOffset() * 60 * 1000;
    const chinaUTCTimezoneOffset = 8 * 60 * 60 * 1000;
    const chinaTimestamp = currentUTCTimestamp + chinaUTCTimezoneOffset;
    task.dateTime = new Date(chinaTimestamp);

    task.save()
        .then(() => res.redirect('https://todo-reactjs-flax.vercel.app/'))
        .catch(error => res.status(500).json({error}))
})

app.post('/update-task', async (req, res) => {
    const task = req.body
    
    Task.updateOne({_id : req.body._id}, task)
        .then(() => res.redirect('https://todo-reactjs-flax.vercel.app/'))
        .catch(error => res.status(500).json({error}))
})

app.post('/update-complete', async (req, res) => {

    Task.updateOne({_id : req.body._id},  { $set: { isComplete: req.body.isComplete } })
        .then(() => res.redirect('https://todo-reactjs-flax.vercel.app/'))
        .catch(error => res.status(500).json({error}))
})

app.post('/update-important', async (req, res) => {

    Task.updateOne({_id : req.body._id},  { $set: { isImportant: req.body.isImportant } })
        .then(() => res.redirect('https://todo-reactjs-flax.vercel.app/'))
        .catch(error => res.status(500).json({error}))
})

app.post('/delete-task', async (req, res) => {
    const id = req.body._id
    
    await Task.deleteOne({_id : id})
        .then(() => res.redirect('https://todo-reactjs-flax.vercel.app/'))
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