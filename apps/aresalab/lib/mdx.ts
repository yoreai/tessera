import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

const PUBLICATIONS_DIR = path.join(process.cwd(), "content/publications");
const BOOKS_DIR = path.join(process.cwd(), "content/books");

export async function getPublicationContent(slug: string) {
  const filePath = path.join(PUBLICATIONS_DIR, `${slug}.mdx`);

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
  // Books are plain markdown files
  const filePath = path.join(BOOKS_DIR, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    // Try alternate naming
    const files = fs.readdirSync(BOOKS_DIR);
    const matchingFile = files.find(f => f.toLowerCase().includes(slug.replace(/-/g, "_")));
    if (matchingFile) {
      const fullPath = path.join(BOOKS_DIR, matchingFile);
      const fileContent = fs.readFileSync(fullPath, "utf-8");
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
        filename: matchingFile,
      };
    }
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

