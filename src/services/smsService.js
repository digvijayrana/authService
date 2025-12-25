const twilio = require("twilio");

const client = twilio(process.env.TWILIO_SID,process.env.TWILIO_TOKEN);

exports.sendSms = async (mobile,message)=>{
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_FROM,
    to: mobile
  });
};
    