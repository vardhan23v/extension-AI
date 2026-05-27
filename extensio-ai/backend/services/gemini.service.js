const { GoogleGenerativeAI } = require('@google/generative-ai');

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateExtensionFiles = async (userPrompt) => {
  try {
    const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `You are an expert Chrome Extension developer. 
The user will describe a Chrome extension in plain English.
Your job is to generate ALL necessary files for a working Chrome Extension (Manifest V3).

STRICT RULES:
1. Always output ONLY a valid JSON object. No explanation, no markdown, no backticks.
2. JSON format must be EXACTLY:
{
  "title": "Short extension name",
  "files": [
    { "filename": "manifest.json", "content": "..." },
    { "filename": "content.js", "content": "..." },
    { "filename": "popup.html", "content": "..." },
    { "filename": "popup.js", "content": "..." }
  ]
}
3. manifest.json must always be Manifest V3 with correct permissions.
4. All file content must be valid, complete, and functional code.
5. Do NOT include any file that is not needed.
6. Never explain anything. Output JSON only.`;

    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nUser request: ${userPrompt}` }],
        },
      ],
    });

    let jsonText = response.response.text();

    // Strip markdown code fence if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse JSON safely
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', jsonText);
      throw new Error('AI output was not valid JSON. Please try again with a clearer description.');
    }

    // Validate response structure
    if (!parsedResponse.title || !Array.isArray(parsedResponse.files)) {
      throw new Error('Invalid response structure from AI. Missing title or files array.');
    }

    if (parsedResponse.files.length === 0) {
      throw new Error('No files generated. Please try a more detailed description.');
    }

    return {
      title: parsedResponse.title,
      files: parsedResponse.files,
    };
  } catch (error) {
    console.error('Gemini Service Error:', error.message);
    throw error;
  }
};

module.exports = { generateExtensionFiles };
