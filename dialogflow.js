const dialogflow = require('@google-cloud/dialogflow');
const nodemailer = require('nodemailer');
const { WebhookClient, Suggestion } = require('dialogflow-fulfillment');
const express = require("express")
const cors = require("cors");
require('dotenv').config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
const runGeminiChat = require('./services/gemini');
const app = express();
app.use(express.json()) 
app.use(cors());


// ✅ Setup email transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.APP_PASSWORD,
  },
});



const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
    res.send("Server is running");
});

app.post("/webhook", async (req, res) => {
    var id = (res.req.body.session).substr(43);
    console.log(id)
    const agent = new WebhookClient({ request: req, response: res });

    function hi(agent) {
        console.log(`intent  =>  hi`);
        agent.add("hello from server")
    }

    async function emailsender(agent) {
      const { name, email } = agent.parameters;
      const emailMessage = `Hello ${name.name}, I will send an email to ${email}`;
      agent.add(emailMessage);
    
      try {
        const info = await transporter.sendMail({
          from: '"ahmednoorani" <ahmednoorani259@gmail.com>',
          to: email,
          subject: "Hello ✔",
          text: emailMessage,
        });
        console.log("Email sent:", info.messageId);
    
        const message = await client.messages.create({
          from: 'whatsapp:+14155238886',
          body: `Hello ${name.name}, thanks for connecting. We have sent an email to ${email}.`,
          to: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`
        });
        console.log("WhatsApp sent:", message.sid);
    
      } catch (error) {
        console.error("Error in email or WhatsApp:", error);
        agent.add("There was an error sending your message. Please try again later.");
      }
    }

    async function fallback(agent) {
      try {
          const action = req.body.queryResult.action;
          const queryText = req.body.queryResult.queryText;

          if (action === 'input.unknown') {
              const response = await runGeminiChat(queryText);
              agent.add(response);
              console.log("Gemini:", response);
          } else {
              agent.add("Sorry, I couldn't understand. Please rephrase.");
          }
      } catch (err) {
          console.error("Fallback error:", err);
          agent.add("There was a problem getting a response. Please try again.");
      }
    }

    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', hi); 
    intentMap.set('email test', emailsender);
    intentMap.set('Default Fallback Intent', fallback);
    agent.handleRequest(intentMap);
})
app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
});