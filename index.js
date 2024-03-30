const express = require('express')
const path = require('path')
const morgan = require('morgan')
const cors = require('cors')

const db = require("./src/config/db")
const Task = require('./src/app/task')
const User = require('./src/app/user')
const Note = require('./src/app/note')
const nodeMail = require('./mailer.js');

const ical = require('node-ical');
const moment = require('moment');
const { JSDOM } = require('jsdom');
const { URL } = require('url');
const jwt = require('jsonwebtoken');

const app = express()
const port = 8080
// const web = "http://localhost:3000/"
const SECRET_KEY = 'your-secret-key';
const web = "https://todo-reactjs-flax.vercel.app/"

app.use(express.static(path.join(__dirname,"src/public")))
app.use(morgan('combined'))
app.use(express.urlencoded({
    extended :true
}))
app.use(express.json())

app.use(cors([{
    origin: ["http://localhost:3000", "https://todo-reactjs-flax.vercel.app"]
}
]))

db.connect()

app.get('/', async (req, res) => {
    res.send('NODEJS')
})

//-----------------------------------------------Task

app.get('/api/tasks', async (req, res) => {
    try {
        const user_id = req.query.user_id;
        const taskDocuments = await Task.find({ user_id: user_id })
        res.json(taskDocuments)
    } catch (error){
        res.status(500).json({error})
    }
  
})

app.get('/api/eventlist', async (req, res) => {
    try {
        const user_id = req.query.user_id;
        const user = await User.findOne({ _id: user_id });
        // const url = "https://oc.sjtu.edu.cn/feeds/calendars/user_5ANNdRErwaHFWaUwCJuLqUk2kyoSNRwMGFtN933O.ics";
        const url = user.canvasUrl;
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
                    // ddlTime = ddlTime.getTime() + ddlTime.getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000;
                    ddlTime = ddlTime.getTime();
                
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
    const savedTask = await task.save()
    res.json({ id: savedTask._id })
})

app.post('/update-task', async (req, res) => {
    const task = new Task(req.body)

    if (task.deadLine === "1970-01-01T00:00:00.000Z") {
        delete task.deadLine;
    }
    
    Task.updateOne({_id : task._id}, task)
        .then(() => res.redirect(web + "note"))
        .catch(error => res.status(500).json({error}))
})

app.post('/update-complete', async (req, res) => {

    Task.updateOne({_id : req.body._id},  { $set: { isComplete: req.body.isComplete } })
        .catch(error => res.status(500).json({error}))
})

app.post('/update-important', async (req, res) => {

    Task.updateOne({_id : req.body._id},  { $set: { isImportant: req.body.isImportant } })
        .catch(error => res.status(500).json({error}))
})

app.post('/delete-task', async (req, res) => {
    const id = req.body._id
    
    await Task.deleteOne({_id : id})
        .then(() => res.redirect(web + "note"))
        .catch(error => res.status(500).json({error}))
})

//----------------------------------------------Note

app.get('/api/notes', async (req, res) => {
    try {
        const user_id = req.query.user_id;
        const taskDocuments = await Note.find({ user_id: user_id })
        res.json(taskDocuments)
    } catch (error){
        res.status(500).json({error})
    }
  
})

app.get('/api/news', async (req, res) => {
    try {
        const pageUrl = 'https://jwc.sjtu.edu.cn/xwtg/tztg.htm';
        // const pageUrl = 'https://jwc.sjtu.edu.cn/index/mxxsdtz.htm'
        const response = await fetch(pageUrl)
        const data = await response.text()
        const dom = new JSDOM(data)
        const newsElements = dom.window.document.querySelectorAll('.Newslist .clearfix')
        const newsList = []
        Array.from(newsElements).map(element => {

            const sjElement = element.querySelector('.sj')
            const [year, month] = sjElement.querySelector('p').textContent.split('.')
            const day = sjElement.querySelector('h2').textContent

            const date = year + '-' + month + '-' + day
            const dateTime = new Date(date)

            const contentElement = element.querySelector('.wz')
            const title = contentElement.querySelector('h2').textContent
            const link = new URL(contentElement.querySelector('a').href, pageUrl).href
            const detail = contentElement.querySelector('p').textContent

            let newNews = {
                title: title,
                detail: detail || '',
                link: link,
                isImportant: false,
                dateTime: dateTime,
            };

            newsList.push(newNews);
        })

        res.json(newsList);
    } catch (error) {
        res.status(500).json({error});
    }
});

app.post('/insert-note', async (req, res) => {
    const note = new Note(req.body)

    note.save()
        .catch(error => res.status(500).json({error}))
})

app.post('/update-note', async (req, res) => {
    const note = req.body
    
    Note.updateOne({_id : req.body._id}, note)
        .then(() => res.redirect(web + "note"))
        .catch(error => res.status(500).json({error}))
})

app.post('/update-important-note', async (req, res) => {
        
    Note.updateOne({_id : req.body._id},  { $set: { isImportant: req.body.isImportant } })
        .catch(error => res.status(500).json({error}))
})

app.post('/update-detail', async (req, res) => {
    try {

        const pageUrl = req.body.link
        // const pageUrl = "https://jwc.sjtu.edu.cn/info/1222/113131.htm"
        const response = await fetch(pageUrl)
        const data = await response.text()
        const dom = new JSDOM(data)
        const newDetail = dom.window.document.querySelector('.v_news_content').innerHTML
        const convertedString = newDetail.replace(/<p[^>]*>/g, '').replace(/<\/p>/g, '\n').replace(/<[^>]+>/g, '')

        // res.json(convertedString)
        Note.updateOne({_id : req.body._id},  { $set: { detail : convertedString } })
        .then(() => res.redirect(web + "note"))
        .catch(error => res.status(500).json({error}))
    } catch (error) {
        res.status(500).json({error});
    }
});

app.post('/delete-note', async (req, res) => {
    const id = req.body._id
    
    await Note.deleteOne({_id : id})
        .then(() => res.redirect(web + "note"))
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
    const email = user.email
    const name = user.userName
    const existingUser = await User.findOne({
        $or: [
            {email: email },
            {userName: name}
        ]
    })

    if (existingUser) {
        return res.status(400).json({ error: '该邮箱或用户名已被注册' });
    } else {
        user.save()
        .then(() => res.redirect(web))
        .catch(error => res.status(500).json({error}))
    }
})

app.post('/update-user', async (req, res) => {
    const user = req.body
    
    User.updateOne({_id : req.body._id}, user)
        .then(() => res.redirect(web))
        .catch(error => res.status(500).json({error}))
})

app.post('/delete-user', async (req, res) => {
    const id = req.body._id
    
    await User.deleteOne({_id : id})
        .then(() => res.redirect(web))
        .catch(error => res.status(500).json({error}))
})

app.post('/api/login', (req, res) => {
    const { userName, passWord } = req.body;

    User.findOne({ userName })
    .then((user) => {
        if (!user || passWord !== user.passWord) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
    
        const token = jwt.sign({ userId: user._id }, SECRET_KEY, {
            expiresIn: '168h',
        });
      
        res.json({ token });
    })
    .catch((error) => {
        res.status(500).json({ error: 'An error occurred' });
      });

});

function authenticateToken(req, res, next) {
    const token = req.headers.authorization;
  
    if (!token) {
      res.status(401).json({ error: 'Access denied' });
      return;
    }
  
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        res.status(403).json({ error: 'Invalid token' });
        return;
      }
      
      req.userId = decoded.userId;
  
      next();
    });
}

app.post('/api/protected', authenticateToken, async (req, res) => {
    try {
      const userId = req.userId;
      res.json({ user_id: userId });
    } catch (error) {
      res.status(500).json({ error });
    }
});

app.post('/api/email', async (req, res) => {
    const email = req.body.email
    const code = req.body.code
    // String(Math.floor(Math.random() * 1000000)).padEnd(6, '0')
    const mail = {
        from: `"wdl"<2720609228@qq.com>`,
        subject: '验证码',
        to: email,
        html: `
            <p>同学你好！</p>
            <p>你的验证码是：<strong style="color:orangered;">${code}</strong></p>
            <p>打死也不要告诉别人哦！</p>
            <p>如果不是本人操作，请无视此邮件</p>
        ` 
    };
    await nodeMail.sendMail(mail, (err, info) => {
        if (!err) {
            res.json({msg: "验证码发送成功"})
        } else {
            res.json({msg: "验证码发送失败，请稍后重试"})
        }
    })
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})