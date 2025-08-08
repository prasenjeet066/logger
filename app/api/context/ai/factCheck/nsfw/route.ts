import { NextRequest, NextResponse } from "next/server";
import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient("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");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { messages, imageBase64 } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Missing or invalid 'messages' array." },
        { status: 400 }
      );
    }

    const systemPrompt = {
      role: "system",
      content:
        "You are a fact-checking assistant. Respond with a JSON containing: Fact_Of_This_Post (string), IsHarmful (boolean), NeedVerifyWithSearch (boolean), TellAboutThisPost_Html_formate (string). Be neutral and factual.",
    };

    let userMessage = messages[0];

    // If imageBase64 is included, inject it into the message
    if (imageBase64) {
      userMessage = {
        ...userMessage,
        images: [imageBase64],
      };
    }

    const fullMessages = [systemPrompt, userMessage];

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
              NeedVerifyWithSearch: { type: "boolean" },
              ContentTypeOrContextType: { type: "string" },
            },
            required: [
              "FactCheckInfo",
              "IsHarmful",
              "ContentTypeOrContextType",
              "NeedVerifyWithSearch",
              "Is18Plus",
            ],
            additionalProperties: true,
          },
          strict: true,
        },
      },
    });

    
    let parsed;
    try {
      parsed = JSON.parse(out);
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid JSON response from model.", raw: out },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Error in fact check stream route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}