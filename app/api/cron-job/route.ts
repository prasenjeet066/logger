import { type NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connection";
import { Post } from "@/lib/mongodb/models/Post";
import Bot from "@/lib/mongodb/models/Bot";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const bots = await Bot.find(); // fetch all bots once
    const posts = await Post.find({ processed: false });
    
    for (const post of posts) {
      if (post.mentions.length > 0) {
        for (const mention of post.mentions) {
          const bot = bots.find((b) => b.username === mention);
          if (bot) {
            let commentContent: string = "";
            
            // Safe alternative to eval: new Function
            try {
              //const fn = new Function("data", bot.shell);
              commentContent = "reply...."//fn({ post }); // pass data if your script needs it
            } catch (e) {
              console.error("Bot script error:", e);
              continue;
            }
            
            const comment = new Post({
              authorId: bot._id.toString(),
              content: commentContent,
              mediaType: null,
              mediaUrls: [],
              processed: true
            });
            await comment.save();
          }
        }
      }
      
      // mark original post as processed
      post.processed = true;
      await post.save();
    }
    
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: e });
  }
}