const { GoogleGenerativeAI } = require('@google/generative-ai');

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const parseAIResponse = (text) => {
  // Strip markdown code fence if present
  let jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  let parsedResponse;
  try {
    parsedResponse = JSON.parse(jsonText);
  } catch (parseError) {
    console.error('Failed to parse AI response:', jsonText);
    throw new Error('AI output was not valid JSON. Please try again.');
  }

  if (!parsedResponse.title || !Array.isArray(parsedResponse.files)) {
    throw new Error('Invalid response structure from AI.');
  }

  if (parsedResponse.files.length === 0) {
    throw new Error('No files generated. Please try a more detailed description.');
  }

  return {
    title: parsedResponse.title,
    files: parsedResponse.files,
  };
};

const generateExtensionFiles = async (userPrompt) => {
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

  try {
    const model = gemini.getGenerativeModel(
      { model: 'gemini-2.0-flash' },
      { apiVersion: 'v1beta' }
    );

    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nUser request: ${userPrompt}` }],
        },
      ],
    });

    return parseAIResponse(response.response.text());
  } catch (error) {
    console.error('Gemini Service Error:', error.message);
    console.log('Attempting fallback to OpenRouter...');

    try {
      const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'qwen/qwen3-coder:free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: "json_object" }
        })
      });

      const data = await openRouterResponse.json();
      console.log('OpenRouter Response Data:', JSON.stringify(data, null, 2));
      
      if (!openRouterResponse.ok) {
        throw new Error(data.error?.message || 'OpenRouter API failed');
      }

      const content = data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenRouter');
      }

      return parseAIResponse(content);
    } catch (fallbackError) {
      console.error('Fallback OpenRouter Error:', fallbackError.message);
      
      // Clean up the error message for the frontend
      const originalError = error.message.toLowerCase();
      if (originalError.includes('429') || originalError.includes('quota') || originalError.includes('rate-limit')) {
        throw new Error('API Rate Limit Exceeded. Both Gemini and OpenRouter free tiers are currently overloaded. Please wait a minute and try again, or add your own API key in the backend.');
      }
      
      // Throw original error so frontend sees the original Gemini issue if fallback fails
      throw new Error('AI Generation Failed: ' + (error.message.split('Please retry')[0] || 'Unknown error occurred.'));
    }
  }
};

module.exports = { generateExtensionFiles };