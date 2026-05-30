require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

(async () => {
  try {
    console.log("Testing Gemini 1.5 Flash...");
    const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' }, { apiVersion: 'v1beta' });
    
    const response = await model.generateContent("Say hello");
    console.log("Success:", response.response.text());
  } catch (error) {
    console.error("Gemini 1.5 Error:", error.message);
  }
})();
