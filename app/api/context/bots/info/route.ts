import { NextRequest, NextResponse } from "next/server";
import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HUGGINGFACE_API_TOKEN || "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");

interface FactCheckMessage {
  role: "user" | "assistant" | "system";
  content: string;
  images ? : string[]; // Base64 or URLs
}

interface FactCheckRequest {
  messages: FactCheckMessage[];
  images ? : string[];
}

interface FactCheckResponse {
  FactCheckInfo: string;
  IsHarmful: boolean;
  Is18Plus: boolean;
  headlineOfFactCheckInfo: boolean;
  NeedVerifyWithSearch: boolean;
  ContentTypeOrContextType: string;
  AboutThisContentOneLine: string;
  isFalseInfo: boolean;
}

// Helper: validate image format
function isValidImageFormat(imageData: string): boolean {
  const validFormats = ['data:image/jpeg;base64,', 'data:image/png;base64,', 'data:image/webp;base64,'];
  return validFormats.some(format => imageData.startsWith(format)) ||
    imageData.startsWith('http') ||
    imageData.startsWith('blob:');
}

// Helper: convert raw/base64 image or file to proper format
async function processImageData(imageInput: string | File): Promise < string > {
  if (imageInput instanceof File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(imageInput);
    });
  }
  
  if (typeof imageInput === 'string') {
    if (imageInput.startsWith('data:image/')) return imageInput;
    if (imageInput.startsWith('http') || imageInput.startsWith('blob:')) return imageInput;
    return `data:image/jpeg;base64,${imageInput}`;
  }
  
  throw new Error("Unsupported image input type");
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    let body: FactCheckRequest = { messages: [] };
    let uploadedImages: (string | File)[] = [];
    
    const contentType = req.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      const formData = await req.formData();
      const messagesData = formData.get('messages') as string;
      
      if (!messagesData) {
        return NextResponse.json({ error: "Missing 'messages' field in form data." }, { status: 400 });
      }
      
      try {
        body = { messages: JSON.parse(messagesData) };
      } catch {
        return NextResponse.json({ error: "Invalid JSON in 'messages' field." }, { status: 400 });
      }
      
      const imageFiles = formData.getAll('images');
      uploadedImages.push(...imageFiles);
    } else {
      // JSON request
      try {
        body = await req.json();
        if (body.images) uploadedImages.push(...body.images);
      } catch {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
      }
    }
    
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: "Missing or invalid 'messages' array." }, { status: 400 });
    }
    
    // Convert all images to base64/URLs
    uploadedImages = await Promise.all(uploadedImages.map(img => processImageData(img)));
    
    // Attach images to the last user message or create new one
    const processedMessages = [...body.messages];
    if (uploadedImages.length > 0) {
      const lastUserIndex = processedMessages.map((m, i) => m.role === 'user' ? i : -1).filter(i => i !== -1).pop();
      
      if (lastUserIndex !== undefined) {
        processedMessages[lastUserIndex] = {
          ...processedMessages[lastUserIndex],
          images: [...(processedMessages[lastUserIndex].images || []), ...uploadedImages]
        };
      } else {
        processedMessages.push({
          role: "user",
          content: "Please analyze these images for fact-checking.",
          images: uploadedImages
        });
      }
    }
    
    const systemPrompt: FactCheckMessage = {
      role: "system",
      content: `You are a comprehensive fact-checking assistant that analyzes both text and images. 
For TEXT: check misinformation, harmful content, adult content.
For IMAGES: check deepfakes, manipulated content, NSFW, violence.
Respond as JSON with:
FactCheckInfo, IsHarmful, Is18Plus, headlineOfFactCheckInfo, NeedVerifyWithSearch, ContentTypeOrContextType, AboutThisContentOneLine, isFalseInfo.`
    };
    
    const fullMessages = [systemPrompt, ...processedMessages];
    
    const modelRequest: any = {
      provider: "fireworks-ai",
      model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
      messages: fullMessages,
      temperature: 0.2,
      top_p: 0.8,
      max_tokens: 1200,
      response_format: {
        type: "json_schema",
        json_schema: {
          schema: {
            type: "object",
            properties: {
              FactCheckInfo: { type: "string" },
              IsHarmful: { type: "boolean" },
              Is18Plus: { type: "boolean" },
              headlineOfFactCheckInfo: { type: "boolean" },
              NeedVerifyWithSearch: { type: "boolean" },
              ContentTypeOrContextType: {
                type: "string",
                enum: ["text", "image", "mixed", "video", "general", "nsfw", "misinformation", "harmless"]
              },
              AboutThisContentOneLine: { type: 'string' },
              isFalseInfo: { type: "boolean" }
            },
            required: [
              "FactCheckInfo", "IsHarmful", "Is18Plus", "headlineOfFactCheckInfo",
              "NeedVerifyWithSearch", "ContentTypeOrContextType",
              "AboutThisContentOneLine", "isFalseInfo"
            ],
            additionalProperties: false,
          },
          strict: true,
        }
      }
    };
    
    const stream = await client.chatCompletionStream(modelRequest);
    let responseContent = "";
    let chunkCount = 0;
    
    const timeoutPromise = new Promise < never > ((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 30000)
    );
    
    try {
      await Promise.race([
        (async () => {
          for await (const chunk of stream) {
            chunkCount++;
            if (chunk.choices?.length) {
              const delta = chunk.choices[0].delta?.content;
              if (delta) responseContent += delta;
            }
            if (chunkCount > 1000) throw new Error("Too many chunks");
          }
        })(),
        timeoutPromise
      ]);
    } catch (streamError) {
      console.error("Streaming error:", streamError);
      throw streamError;
    }
    
    let parsedResponse: FactCheckResponse;
    try {
      parsedResponse = JSON.parse(responseContent.trim());
    } catch (parseError) {
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsedResponse = JSON.parse(jsonMatch[0]);
      else {
        return NextResponse.json({ error: "Invalid JSON from AI model", raw: responseContent }, { status: 502 });
      }
    }
    
    // Validate required fields
    const requiredFields = [
      "FactCheckInfo", "IsHarmful", "Is18Plus", "headlineOfFactCheckInfo",
      "NeedVerifyWithSearch", "ContentTypeOrContextType", "AboutThisContentOneLine", "isFalseInfo"
    ];
    const missingFields = requiredFields.filter(f => !(f in parsedResponse));
    if (missingFields.length) {
      return NextResponse.json({ error: `Missing fields: ${missingFields.join(", ")}`, response: parsedResponse }, { status: 502 });
    }
    
    const sanitizedResponse = {
      FactCheckInfo: String(parsedResponse.FactCheckInfo).substring(0, 2000),
      AboutThisContentOneLine: String(parsedResponse.AboutThisContentOneLine),
      IsHarmful: Boolean(parsedResponse.IsHarmful),
      isFalseInfo: Boolean(parsedResponse.isFalseInfo),
      Is18Plus: Boolean(parsedResponse.Is18Plus),
      headlineOfFactCheckInfo: Boolean(parsedResponse.headlineOfFactCheckInfo),
      NeedVerifyWithSearch: Boolean(parsedResponse.NeedVerifyWithSearch),
      ContentTypeOrContextType: String(parsedResponse.ContentTypeOrContextType || "general"),
      timestamp: new Date().toISOString(),
      model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
      hasImages: uploadedImages.length > 0,
      imageCount: uploadedImages.length,
      processingTime: Date.now() - startTime,
    };
    
    return NextResponse.json(sanitizedResponse);
    
  } catch (error) {
    console.error("Fact-check API error:", error);
    let statusCode = 500;
    let errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    if (errorMessage.includes("timeout")) statusCode = 408;
    if (errorMessage.includes("rate limit")) statusCode = 429;
    if (errorMessage.includes("authentication")) statusCode = 401;
    
    return NextResponse.json({
      error: "Fact-check processing failed",
      message: errorMessage,
      timestamp: new Date().toISOString(),
      canRetry: statusCode >= 500 || statusCode === 408
    }, { status: statusCode });
  }
}