import { NextRequest, NextResponse } from "next/server";
import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient("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");

export async function POST(req: NextRequest) {
  try {
    // Parse request body (expecting: { messages: [...] })
    const body = await req.json();
    
    // Validate messages format
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: "Missing or invalid 'messages' array." }, { status: 400 });
    }
    
    // Call Hugging Face Inference
    const chatCompletion = await client.chatCompletion({
      provider: "fireworks-ai",
      model: "Qwen/Qwen3-Coder-480B-A35B-Instruct",
      messages: body.messages,
      top_p: 0.6,
      response_format: {
        type: "json_schema",
        json_schema: {
          schema: {
            type: "object",
            properties: {
              factCheck: { type: "string" },
              isTrueInfo: { type: "boolean" },
              "isharmful ": { type: "boolean" },
              isAdultContent: { type: "boolean" },
              oneLineAboutThisText: { type: "string" },
              writeReportWithSrc: { type: "string" }
            },
            required: [
              "factCheck",
              "isTrueInfo",
              "isharmful ",
              "isAdultContent",
              "oneLineAboutThisText",
              "writeReportWithSrc"
            ],
            additionalProperties: true
          },
          strict: true
        }
      }
    });
    
    // Return the response
    return NextResponse.json(chatCompletion.choices[0].message);
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}