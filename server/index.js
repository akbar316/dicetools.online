import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenAI, Modality } from '@google/genai';

// Load .env
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.SERVER_PORT || 5000;

// Server-side env names
const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GENAI_API_KEY;

if (!API_KEY) {
  // eslint-disable-next-line no-console
  console.error('GEMINI_API_KEY (or GENAI_API_KEY) is not set in the environment. The proxy will not work.');
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Endpoint: text-to-image (Imagen)
app.post('/api/ai/text-to-image', async (req, res) => {
  const { prompt, aspectRatio = '1:1', numberOfImages = 1 } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt,
      config: {
        numberOfImages,
        outputMimeType: 'image/jpeg',
        aspectRatio,
      },
    });

    return res.json(response);
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
});

// Endpoint: image edit (Gemini Flash Image)
app.post('/api/ai/image-edit', async (req, res) => {
  const { prompt, inlineImage } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });
  if (!inlineImage || !inlineImage.data) return res.status(400).json({ error: 'inlineImage (base64 data & mimeType) is required' });

  try {
    const imagePart = { inlineData: { data: inlineImage.data, mimeType: inlineImage.mimeType } };
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
      config: { responseModalities: [Modality.IMAGE] },
    });

    return res.json(response);
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`AI proxy server listening on http://localhost:${PORT}`);
});
