
const http = require("http");

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200);
    return res.end(JSON.stringify({
      status: "online",
      name: "RUDRA AI",
      message: "RUDRA AI Brain is running"
    }));
  }

  if (req.method !== "POST" || req.url !== "/chat") {
    res.writeHead(404);
    return res.end(JSON.stringify({
      error: "Route not found"
    }));
  }

  if (!process.env.OPENAI_API_KEY) {
    res.writeHead(500);
    return res.end(JSON.stringify({
      error: "API key is not configured"
    }));
  }

  try {
    let body = "";

    for await (const chunk of req) {
      body += chunk;

      if (body.length > 20000) {
        res.writeHead(413);
        return res.end(JSON.stringify({
          error: "Request is too large"
        }));
      }
    }

    const data = JSON.parse(body);
    const message = data.message;

    if (typeof message !== "string" || !message.trim()) {
      res.writeHead(400);
      return res.end(JSON.stringify({
        error: "Please enter a message"
      }));
    }

    if (message.length > 10000) {
      res.writeHead(400);
      return res.end(JSON.stringify({
        error: "Message is too long"
      }));
    }

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content: "You are RUDRA AI, a helpful personal AI assistant. Reply in the same language as the user. Support Telugu, English, Hindi, Tamil and Malayalam. Be friendly and accurate."
            },
            {
              role: "user",
              content: message.trim()
            }
          ],
          max_completion_tokens: 500
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      res.writeHead(502);
      return res.end(JSON.stringify({
        error: "AI service request failed",
        status: response.status
      }));
    }

    const reply = result.choices?.[0]?.message?.content;

    if (!reply) {
      res.writeHead(502);
      return res.end(JSON.stringify({
        error: "No AI response received"
      }));
    }

    res.writeHead(200);
    return res.end(JSON.stringify({
      status: "success",
      assistant: "RUDRA AI",
      reply
    }));

  } catch (error) {
    res.writeHead(500);
    return res.end(JSON.stringify({
      error: "Server error. Please try again."
    }));
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`RUDRA AI running on port ${PORT}`);
});
