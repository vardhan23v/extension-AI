const { GoogleGenerativeAI } = require('@google/generative-ai');

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const parseAIResponse = (text) => {
  // Find the first '{' and the last '}'
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');
  
  let jsonText = text;
  if (startIndex !== -1 && endIndex !== -1) {
    jsonText = text.substring(startIndex, endIndex + 1);
  }

  // Strip markdown code fence if present
  jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/gi, '').trim();

  let parsedResponse;
  try {
    parsedResponse = JSON.parse(jsonText);
  } catch (parseError) {
    console.error('Failed to parse AI response:', text);
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
    storeDescription: parsedResponse.storeDescription || 'A powerful Chrome Extension.',
    files: parsedResponse.files,
  };
};

const generateExtensionFiles = async (userPrompt, monetizationLink = null) => {
  let systemPrompt = `You are an expert Chrome Extension developer. 
The user will describe a Chrome extension in plain English.
Your job is to generate ALL necessary files for a working Chrome Extension (Manifest V3).

STRICT RULES:
1. Always output ONLY a valid JSON object. No explanation, no markdown, no backticks.
2. JSON format must be EXACTLY:
{
  "title": "Short extension name",
  "storeDescription": "A highly engaging, SEO-optimized 3-sentence description for the Chrome Web Store.",
  "files": [
    { "filename": "manifest.json", "content": "..." },
    { "filename": "content.js", "content": "..." },
    { "filename": "popup.html", "content": "..." },
    { "filename": "popup.css", "content": "..." },
    { "filename": "popup.js", "content": "..." }
  ]
}
3. manifest.json must always be Manifest V3 with correct permissions.
4. All file content must be valid, complete, and functional code.
5. Do NOT include any file that is not needed.
6. AESTHETICS ARE CRITICAL: You MUST include a popup.css file with beautiful, modern, custom styling (colors, hover states, rounded corners, shadows, animations). Make sure to link popup.css in popup.html. You can also include Tailwind CSS via CDN in popup.html (<script src="https://cdn.tailwindcss.com"></script>). Do NOT output plain unstyled HTML.
7. Never explain anything. Output JSON only.`;

  if (monetizationLink) {
    systemPrompt += `\n7. The user has enabled Monetization. You MUST add a prominent, beautiful 'Buy me a Coffee' or 'Support' button at the bottom of the popup.html that links to: ${monetizationLink}. Make it open in a new tab (target="_blank").`;
  }

  const errors = [];

  // --- PRIMARY: Groq (fast, free, reliable) ---
  if (process.env.GROQ_API_KEY) {
    try {
      console.log('Trying primary provider: Groq...');
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          max_tokens: 8000
        })
      });

      const groqData = await groqResponse.json();
      if (groqResponse.ok && groqData.choices && groqData.choices[0]) {
        const content = groqData.choices[0].message.content;
        return parseAIResponse(content);
      }
      const groqErr = groqData.error?.message || 'Unknown Groq error';
      console.error('Groq failed:', groqErr);
      errors.push(`Groq: ${groqErr}`);
    } catch (groqError) {
      console.error('Groq error:', groqError.message);
      errors.push(`Groq: ${groqError.message}`);
    }
  }

  // --- FALLBACK 1: Gemini ---
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log('Trying fallback: Gemini...');
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
    } catch (geminiError) {
      console.error('Gemini error:', geminiError.message);
      errors.push(`Gemini: ${geminiError.message.split('Please retry')[0]}`);
    }
  }

  // --- FALLBACK 2: OpenRouter ---
  if (process.env.OPENROUTER_API_KEY) {
    try {
      console.log('Trying fallback: OpenRouter...');
      const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          max_tokens: 8000
        })
      });

      const data = await openRouterResponse.json();
      if (openRouterResponse.ok && data.choices && data.choices[0]) {
        const content = data.choices[0].message.content;
        return parseAIResponse(content);
      }
      const orErr = data.error?.message || 'Unknown OpenRouter error';
      console.error('OpenRouter failed:', orErr);
      errors.push(`OpenRouter: ${orErr}`);
    } catch (orError) {
      console.error('OpenRouter error:', orError.message);
      errors.push(`OpenRouter: ${orError.message}`);
    }
  }

  // All providers failed
  throw new Error(`All AI providers failed. ${errors.join(' | ')}`);
};

module.exports = { generateExtensionFiles };