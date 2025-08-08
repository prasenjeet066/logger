import { NextRequest, NextResponse } from "next/server";
import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient("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");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let uploadedFiles = null
    if (body.image) {
      let _images = body.images.formData()
      _images = _images.getAll('images')[0]
      uploadedFiles = client.uploadImage(_images)
    }
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: "Missing or invalid 'messages' array." }, { status: 400 });
    }
    
    const systemPrompt = {
      role: "system",
      content: "You are a fact-checking assistant. Respond with a JSON containing: Fact_Of_This_Post (string), IsHarmful (boolean), NeedVerifyWithSearch (boolean), TellAboutThisPost_Html_formate (string). Be neutral and factual.",
    };
    let messages = body.messages;
    if (uploadedFiles !== null) {
      messages = [
        { role: "user", content: messages[0].content,
        images: [uploadedFiles]
          
        }
        
      ]
    }
    const fullMessages = [systemPrompt, ...body.messages];
    
    const stream = await client.chatCompletionStream({
      provider: "together",
      model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
      messages: fullMessages,
      temperature: 0.5,
      top_p: 0.5,
      response_format: {
        type: "json_schema",
        json_schema: {
          schema: {
            type: "object",
            properties: {
              FactCheckInfo: { type: "string" },
              
              IsHarmful: { type: "boolean" },
              Is18Plus: { type: "boolean" },
              headlineOfFactCheckInfo:{type:'boolean'},
              NeedVerifyWithSearch: { type: "boolean" },
              ContentTypeOrContextType: { type: "string" },
            },
            required: ["FactCheckInfo", "IsHarmful", "ContentTypeOrContextType", "NeedVerifyWithSearch", "Is18Plus",'headlineOfFactCheckInfo'],
            additionalProperties: true,
          },
          strict: true,
        },
      },
    });
    
    let out = "";
    
    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices.length > 0) {
        const newContent = chunk.choices[0].delta?.content;
        if (newContent) {
          out += newContent;
        }
      }
    }
    
    let parsed;
    try {
      parsed = JSON.parse(out);
    } catch (err) {
      return NextResponse.json({ error: "Invalid JSON response from model.", raw: out }, { status: 502 });
    }
    
    return NextResponse.json({
      ...parsed,
      raw: out,
    });
  } catch (error) {
    console.error("Error in fact check stream route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}