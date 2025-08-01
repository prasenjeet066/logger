// app/api/classify-image/route.js (App Router)
// OR pages/api/classify-image.js (Pages Router)

import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient('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');

// For App Router (app/api/classify-image/route.js)
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    
    if (!file) {
      return Response.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const output = await client.imageClassification({
      data: buffer,
      model: "Falconsai/nsfw_image_detection",
      provider: "hf-inference",
    });

    return Response.json({ result: output });
  } catch (error) {
    console.error('Classification error:', error);
    return Response.json({ error: 'Classification failed' }, { status: 500 });
  }
}

// For Pages Router (pages/api/classify-image.js)
// Uncomment below if using Pages Router instead:

/*
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable();
    const [fields, files] = await form.parse(req);
    
    const imageFile = files.image?.[0];
    if (!imageFile) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const data = fs.readFileSync(imageFile.filepath);

    const output = await client.imageClassification({
      data,
      model: "Falconsai/nsfw_image_detection",
      provider: "hf-inference",
    });

    return res.status(200).json({ result: output });
  } catch (error) {
    console.error('Classification error:', error);
    return res.status(500).json({ error: 'Classification failed' });
  }
}
*/