require('dotenv').config();
const { generateExtensionFiles } = require('./services/gemini.service');

(async () => {
  try {
    console.log("Testing generation...");
    const result = await generateExtensionFiles("Create a chrome extension that makes the background red");
    console.log("SUCCESS!", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("FAILED:", err);
  }
})();
