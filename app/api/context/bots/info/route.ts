import { NextRequest, NextResponse } from "next/server";
import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HUGGINGFACE_API_TOKEN || "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");

interface FactCheckMessage {
  role: "user" | "assistant" | "system";
  content: string;
  images?: string[]; // Base64 encoded images or URLs
}

interface FactCheckRequest {
  messages: FactCheckMessage[];
  images?: string[]; // Additional images as base64 or URLs
}

interface FactCheckResponse {
  FactCheckInfo: string;
  IsHarmful: boolean;
  Is18Plus: boolean;
  headlineOfFactCheckInfo: boolean;
  NeedVerifyWithSearch: boolean;
  ContentTypeOrContextType: string;
}

// Helper function to validate image format
function isValidImageFormat(imageData: string): boolean {
  const validFormats = ['data:image/jpeg;base64,', 'data:image/png;base64,', 'data:image/webp;base64,'];
  return validFormats.some(format => imageData.startsWith(format)) || 
         imageData.startsWith('http') || // URL
         imageData.startsWith('blob:'); // Blob URL
}

// Helper function to convert image to base64 if needed
async function processImageData(imageInput: string): Promise<string> {
  // If it's already base64, return as is
  if (imageInput.startsWith('data:image/')) {
    return imageInput;
  }
  
  // If it's a URL, we'll pass it through (the model should handle it)
  if (imageInput.startsWith('http') || imageInput.startsWith('blob:')) {
    return imageInput;
  }
  
  // If it's raw base64 without data URI prefix, add it (assuming JPEG)
  if (!imageInput.includes('data:image/')) {
    return `data:image/jpeg;base64,${imageInput}`;
  }
  
  return imageInput;
}

export async function POST(req: NextRequest) {
  try {
    // Handle both JSON and FormData
    let body: FactCheckRequest;
    let uploadedImages: string[] = [];

    const contentType = req.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData (for file uploads)
      const formData = await req.formData();
      
      // Extract text content
      const messagesData = formData.get('messages') as string;
      if (!messagesData) {
        return NextResponse.json({ error: "Missing 'messages' field in form data." }, { status: 400 });
      }
      
      try {
        body = { messages: JSON.parse(messagesData) };
      } catch (err) {
        return NextResponse.json({ error: "Invalid JSON in 'messages' field." }, { status: 400 });
      }

      // Extract images from FormData
      const imageFiles = formData.getAll('images') as File[];
      for (const file of imageFiles) {
        if (file instanceof File) {
          // Convert file to base64
          const buffer = await file.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          const mimeType = file.type || 'image/jpeg';
          uploadedImages.push(`data:${mimeType};base64,${base64}`);
        }
      }
      
      // Also check for base64 images in form data
      const base64Images = formData.getAll('base64Images') as string[];
      for (const img of base64Images) {
        if (img && isValidImageFormat(img)) {
          uploadedImages.push(await processImageData(img));
        }
      }
      
    } else {
      // Handle JSON request
      body = await req.json();
      
      // Extract images from JSON body
      if (body.images) {
        for (const img of body.images) {
          if (img && isValidImageFormat(img)) {
            uploadedImages.push(await processImageData(img));
          }
        }
      }
    }
    
    // Validate required fields
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: "Missing or invalid 'messages' array." }, 
        { status: 400 }
      );
    }

    // Process messages and add images
    let processedMessages = [...body.messages];
    
    // If we have uploaded images, add them to the last user message or create a new one
    if (uploadedImages.length > 0) {
      const lastUserMessageIndex = processedMessages.map((m, i) => m.role === 'user' ? i : -1)
        .filter(i => i !== -1).pop();
      
      if (lastUserMessageIndex !== undefined) {
        // Add images to existing user message
        processedMessages[lastUserMessageIndex] = {
          ...processedMessages[lastUserMessageIndex],
          images: [...(processedMessages[lastUserMessageIndex].images || []), ...uploadedImages]
        };
      } else {
        // Create a new user message with images
        processedMessages.push({
          role: "user",
          content: "Please analyze these images for fact-checking.",
          images: uploadedImages
        });
      }
    }

    // Create enhanced system prompt for image and text analysis
    const systemPrompt: FactCheckMessage = {
      role: "system",
      content: `You are a comprehensive fact-checking assistant that analyzes both text and images. 

For TEXT content:
- Check for misinformation, false claims, or misleading statements
- Identify potentially harmful content (violence, self-harm, harassment)
- Detect adult content or inappropriate material

For IMAGE content:
- Analyze for deepfakes, manipulated content, or misleading visuals
- Check for NSFW content, violence, or disturbing imagery
- Identify context manipulation (images used out of context)
- Detect harmful symbols, hate speech, or extremist content

Respond with a JSON object containing:
- FactCheckInfo: Clear, factual assessment of content accuracy and safety
- IsHarmful: Whether content could cause physical, emotional, or social harm
- Is18Plus: Whether content is only suitable for adults (NSFW, mature themes)
- headlineOfFactCheckInfo: Whether this represents a significant fact-check finding
- NeedVerifyWithSearch: Whether external verification through search is recommended
- ContentTypeOrContextType: Type of content analyzed (text, image, mixed, etc.)

Prioritize user safety and provide educational, helpful responses.`
    };

    const fullMessages = [systemPrompt, ...processedMessages];

    // Configure the AI model request
    const modelRequest: any = {
      provider: "fireworks-ai",
      model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
      messages: fullMessages,
      temperature: 0.2, // Very low temperature for consistent fact-checking
      top_p: 0.8,
      max_tokens: 1200,
      response_format: {
        type: "json_schema",
        json_schema: {
          schema: {
            type: "object",
            properties: {
              FactCheckInfo: { 
                type: "string",
                description: "Detailed fact-check analysis of the content"
              },
              IsHarmful: { 
                type: "boolean",
                description: "Whether the content could cause harm"
              },
              Is18Plus: { 
                type: "boolean",
                description: "Whether content is adult-only"
              },
              headlineOfFactCheckInfo: { 
                type: "boolean",
                description: "Whether this is a significant fact-check finding"
              },
              NeedVerifyWithSearch: { 
                type: "boolean",
                description: "Whether external verification is needed"
              },
              ContentTypeOrContextType: { 
                type: "string",
                description: "Type of content being analyzed",
                enum: ["text", "image", "mixed", "video", "general", "nsfw", "misinformation", "harmless"]
              },
              AboutThisContentOneLine:{
                type: 'string',
                description: 'Say something about this content in one line'
              },
              isFalseInfo:{
                type : "boolean",
                description: "this content is fake or false information or else other ?"
              }
            },
            required: [
              "FactCheckInfo",
              "IsHarmful",
              "ContentTypeOrContextType",
              "NeedVerifyWithSearch",
              "Is18Plus",
              "headlineOfFactCheckInfo",
              "AboutThisContentOneLine",
              "isFalseInfo"
            ],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    };

    // Stream the response from the AI model
    const stream = await client.chatCompletionStream(modelRequest);

    let responseContent = "";
    let chunkCount = 0;

    // Process the streaming response with timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 second timeout
    });

    try {
      await Promise.race([
        (async () => {
          for await (const chunk of stream) {
            chunkCount++;
            if (chunk.choices && chunk.choices.length > 0) {
              const deltaContent = chunk.choices[0].delta?.content;
              if (deltaContent) {
                responseContent += deltaContent;
              }
            }
            
            // Safety check - prevent infinite loops
            if (chunkCount > 1000) {
              throw new Error('Too many chunks received');
            }
          }
        })(),
        timeoutPromise
      ]);
    } catch (streamError) {
      console.error("Streaming error:", streamError);
      throw streamError;
    }

    // Parse and validate the JSON response
    let parsedResponse: FactCheckResponse;
    try {
      parsedResponse = JSON.parse(responseContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Raw response:", responseContent);
      
      // Attempt to extract JSON from potentially malformed response
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } catch {
          return NextResponse.json({
            error: "Invalid JSON response from AI model.",
            raw: responseContent,
            details: parseError instanceof Error ? parseError.message : "Unknown parsing error"
          }, { status: 502 });
        }
      } else {
        return NextResponse.json({
          error: "No valid JSON found in AI response.",
          raw: responseContent,
        }, { status: 502 });
      }
    }

    // Validate response structure
    const requiredFields = [
      "FactCheckInfo",
      "IsHarmful", 
      "Is18Plus",
      "isFalseInfo",
      "AboutThisContentOneLine",
      "headlineOfFactCheckInfo",
      "NeedVerifyWithSearch",
      "ContentTypeOrContextType"
    ];

    const missingFields = requiredFields.filter(field => !(field in parsedResponse));
    if (missingFields.length > 0) {
      return NextResponse.json({
        error: `Missing required fields: ${missingFields.join(", ")}`,
        response: parsedResponse
      }, { status: 502 });
    }

    // Sanitize and enhance the response
    const sanitizedResponse = {
      FactCheckInfo: String(parsedResponse.FactCheckInfo || "").substring(0, 2000), // Limit length
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
      processingTime: Date.now() - Date.now(), // You might want to track this properly
    };

    return NextResponse.json(sanitizedResponse);

  } catch (error) {
    console.error("Error in fact-check API route:", error);
    
    // Provide more specific error information
    let errorMessage = "Internal Server Error";
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.name === "AbortError" || error.message.includes("timeout")) {
        statusCode = 408; // Request Timeout
      } else if (error.message.includes("rate limit")) {
        statusCode = 429; // Too Many Requests
      } else if (error.message.includes("authentication")) {
        statusCode = 401; // Unauthorized
      }
    }
    
    return NextResponse.json({
      error: "Fact-check processing failed",
      message: errorMessage,
      timestamp: new Date().toISOString(),
      canRetry: statusCode >= 500 || statusCode === 408
    }, { status: statusCode });
  }
}