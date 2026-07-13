import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set in environment variables.");
  }
  const genAI = new GoogleGenAI({ apiKey: apiKey || "" });

  // API routes
  app.post("/api/gemini/categorize", async (req, res) => {
    try {
      const { base64Image } = req.body;
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING, enum: ["top", "bottom", "shoes", "outerwear", "accessory"] },
              color: { type: Type.STRING },
              season: { type: Type.STRING, enum: ["spring", "summer", "fall", "winter", "all"] }
            },
            required: ["name", "category", "color", "season"]
          }
        }
      });

      const parts = [
        { text: "Analyze this clothing item and categorize it. Provide a descriptive name, its primary category, color, and which season it is best suited for." },
        { inlineData: { data: base64Image.split(',')[1], mimeType: "image/jpeg" } }
      ];

      const result = await model.generateContent({ contents: [{ role: "user", parts }] });
      const response = await result.response;
      res.json(JSON.parse(response.text()));
    } catch (error: any) {
      console.error("Gemini Categorize Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/suggest", async (req, res) => {
    try {
      const { closetItems, events, weather } = req.body;
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          responseMimeType: "application/json"
        }
      });

      const prompt = `
        Based on the following closet items and events for the week, suggest the best outfits for each event.
        Consider the weather: ${weather}.
        
        Closet Items: ${JSON.stringify(closetItems)}
        Events: ${JSON.stringify(events)}
        
        Return a JSON array of objects where each object has:
        - eventId: string
        - itemIds: string[]
        - reasoning: string
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      res.json(JSON.parse(response.text()));
    } catch (error: any) {
      console.error("Gemini Suggest Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/rate", async (req, res) => {
    try {
      const { items, event } = req.body;
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          responseMimeType: "application/json"
        }
      });

      const prompt = `
        Rate the following outfit for the specific event.
        Event: ${JSON.stringify(event)}
        Outfit Items: ${JSON.stringify(items)}
        
        Return a JSON object with:
        - rating: number (1-10)
        - feedback: string
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      res.json(JSON.parse(response.text()));
    } catch (error: any) {
      console.error("Gemini Rate Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

