import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

const PUBLICATIONS_DIR = path.join(process.cwd(), "public/publications");

export async function getPublicationContent(slug: string) {
  // Look for preview.mdx in the publication's folder
  const filePath = path.join(PUBLICATIONS_DIR, slug, "preview.mdx");

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { content, data } = matter(fileContent);

  const mdxSource = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex as any],
    },
    parseFrontmatter: true,
  });

  return {
    source: mdxSource,
    frontmatter: data,
  };
}

export async function getBookContent(slug: string) {
  // Look for preview.mdx in the book's folder
  const filePath = path.join(PUBLICATIONS_DIR, slug, "preview.mdx");

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { content, data } = matter(fileContent);

  const mdxSource = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex as any],
    },
  });

  return {
    source: mdxSource,
    frontmatter: data,
  };
}

export function getAllPublicationSlugs(): string[] {
  if (!fs.existsSync(PUBLICATIONS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(PUBLICATIONS_DIR);
  return files
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

export function getAllBookSlugs(): string[] {
  if (!fs.existsSync(BOOKS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(BOOKS_DIR);
  return files
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
}

