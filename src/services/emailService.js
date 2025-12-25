const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
 host: "smtp.gmail.com",
 port: 587,
 secure: false,
 auth:{
   user: process.env.EMAIL_USER,
   pass: process.env.EMAIL_PASS
 }
});

exports.sendMail = async(to,subject,text)=>{
 await transporter.sendMail({
   from: "auth@vidyarthi.com",
   to,
   subject,
   text
 });
};
