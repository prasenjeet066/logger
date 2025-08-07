import { NextRequest, NextResponse } from "next/server";
import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

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
      model: "microsoft/DialoGPT-medium", // Use a more reliable model
      messages: body.messages,
      max_tokens: 500,
      temperature: 0.7,
    });
    
    // Parse the response and structure it according to your schema
    const content = chatCompletion.choices[0].message.content || "";
    
    // Create a structured response (you may want to use a more sophisticated parsing method)
    const structuredResponse = {
      factCheck: content,
      isTrueInfo: true, // You'd need AI to determine this
      isHarmful: false, // You'd need AI to determine this
      isAdultContent: false, // You'd need AI to determine this
      oneLineAboutThisText: content.substring(0, 100),
      writeReportWithSrc: content
    };
    
    return NextResponse.json(structuredResponse);
  } catch (error) {
    console.error("Error in fact check route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}