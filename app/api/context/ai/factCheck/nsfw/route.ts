import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Parse incoming form-data
    const formData = await req.formData();
    const image = formData.get("image");
    
    if (!image || !(image instanceof Blob)) {
      return NextResponse.json({ error: "Image file missing" }, { status: 400 });
    }
    
    // Call Hugging Face inference API
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/Falconsai/nsfw_image_detection",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer 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`,
          // Do NOT set Content-Type manually
        },
        body: image,
      }
    );
    
    if (!response.ok) {
      return NextResponse.json({ error: "Hugging Face request failed" }, { status: 500 });
    }
    
    const result = await response.json();
    
    // Find the top label by score
    const top = result.reduce((a: any, b: any) => (a.score > b.score ? a : b));
    
    // Send back
    return NextResponse.json(top);
  } catch (error) {
    console.error("NSFW detection error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}