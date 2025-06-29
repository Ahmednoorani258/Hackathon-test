// services/gemini.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

const MODEL_NAME = "gemini-2.0-flash";
const API_KEY = process.env.GEMINI_API_KEY; // Store in .env

async function runGeminiChat(prompt) {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
        temperature: 1,
        topK: 0,
        topP: 0.95,
        maxOutputTokens: 200,
    };

    const chat = model.startChat({
        generationConfig,
        history: [],
    });

    const result = await chat.sendMessage(prompt);
    return result.response.text();
}

module.exports = runGeminiChat;
