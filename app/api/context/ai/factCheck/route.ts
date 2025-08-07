import { NextRequest, NextResponse } from "next/server";
import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient('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');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: "Missing or invalid 'messages' array." }, { status: 400 });
    }
    
    // Insert a system prompt to guide the model's behavior
    const systemPrompt = {
      role: "system",
      content: "You are a fact-checking assistant. Check if the information is true, harmful, or contains adult content. Keep the reply neutral, concise, and accurate."
    };
    
    const fullMessages = [systemPrompt, ...body.messages];
    
    const chatCompletion = await client.chatCompletion({
      model: "Qwen/Qwen3-Coder-30B-A3B-Instruct",
      messages: fullMessages,
      max_tokens: 500,
      temperature: 0.7,
    });
    
    const content = chatCompletion.choices[0].message.content || "";
    
    const structuredResponse = {
      factCheck: content,
      isTrueInfo: true, // Placeholder: You can add logic to parse flags from content
      isHarmful: false,
      isAdultContent: false,
      oneLineAboutThisText: content.substring(0, 100),
      writeReportWithSrc: content
    };
    
    return NextResponse.json(structuredResponse);
  } catch (error) {
    console.error("Error in fact check route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}