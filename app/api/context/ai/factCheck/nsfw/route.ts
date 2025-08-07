import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Parse incoming form-data
    const formData = await req.formData();
    const image = formData.get("image");
    
    if (!image || !(image instanceof File)) {
      return NextResponse.json({ error: "Image file missing" }, { status: 400 });
    }
    
    // Convert File to Buffer/Blob for API
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Call Hugging Face inference API
    const response = await fetch(
      "https://api-inference.huggingface.co/models/Falconsai/nsfw_image_detection",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer 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`,
          "Content-Type": "application/octet-stream",
        },
        body: buffer,
      }
    );
    
    if (!response.ok) {
      console.error("Hugging Face API error:", await response.text());
      return NextResponse.json({ error: "NSFW detection service unavailable" }, { status: 500 });
    }
    
    const result = await response.json();
    
    // Ensure result is an array
    if (!Array.isArray(result)) {
      return NextResponse.json({ error: "Invalid API response" }, { status: 500 });
    }
    
    // Find the top label by score
    const top = result.reduce((a: any, b: any) => (a.score > b.score ? a : b));
    
    // Send back
    return NextResponse.json(top);
  } catch (error) {
    console.error("NSFW detection error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}