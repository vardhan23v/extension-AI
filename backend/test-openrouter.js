require('dotenv').config();

(async () => {
  const models = ['google/gemma-4-31b-it:free', 'nvidia/nemotron-3-super-120b-a12b:free', 'meta-llama/llama-3.2-3b-instruct:free', 'openrouter/free'];
  
  for (const model of models) {
    try {
      console.log(`\nTesting ${model}...`);
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'Say hello' }]
        })
      });
      const data = await res.json();
      if (data.error) {
        console.error("Error:", data.error.message);
      } else {
        console.log("Success! Output:", data.choices[0].message.content);
        break; // Stop when we find a working one
      }
    } catch (e) {
      console.error(e.message);
    }
  }
})();
