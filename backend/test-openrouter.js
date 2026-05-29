require('dotenv').config();


(async () => {
  try {
    console.log("Testing OpenRouter API...");
    const systemPrompt = "You are an expert Chrome Extension developer. Output JSON.";
    const userPrompt = "Ad Blocker";
    
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await openRouterResponse.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Fetch failed:", error.message);
  }
})();
