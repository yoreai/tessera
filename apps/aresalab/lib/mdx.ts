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

  const dirs = fs.readdirSync(PUBLICATIONS_DIR);
  return dirs
    .filter((dir) => {
      const dirPath = path.join(PUBLICATIONS_DIR, dir);
      return fs.statSync(dirPath).isDirectory() && dir !== 'pdf' && dir !== '__pycache__';
    })
    .filter((dir) => {
      // Only include if preview.mdx exists
      const previewPath = path.join(PUBLICATIONS_DIR, dir, "preview.mdx");
      return fs.existsSync(previewPath);
    });
}

export function getAllBookSlugs(): string[] {
  // Books are now also in publications/ directory
  // Just filter for books from the publications list
  return [];  // We'll use publications.ts for book slugs instead
}
