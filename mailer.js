import nodemailer from 'nodemailer';

let nodeMail = nodemailer.createTransport({
    service: 'qq', 
    port: 465,
    secure: true,
    auth: {
        user: '2720609228@qq.com', 
        pass: 'itlthgqsxtgbddee' 
    }
});

// itlthgqsxtgbddee

module.exports = nodeMail;
