import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { serialize } from "next-mdx-remote/serialize";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filename = searchParams.get("filename");

  if (!filename) {
    return NextResponse.json({ error: "Filename required" }, { status: 400 });
  }

  const booksDir = path.join(process.cwd(), "content/books");
  const filePath = path.join(booksDir, filename);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");

    // Truncate very long books for initial render
    const truncatedContent = content.length > 100000
      ? content.slice(0, 100000) + "\n\n---\n\n*Content truncated for web display. Download the PDF for the complete book.*"
      : content;

    const mdxSource = await serialize(truncatedContent, {
      mdxOptions: {
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatex as any],
      },
    });

    return NextResponse.json({ source: mdxSource });
  } catch (error) {
    console.error("Error processing book:", error);
    return NextResponse.json({ error: "Failed to process book" }, { status: 500 });
  }
}

