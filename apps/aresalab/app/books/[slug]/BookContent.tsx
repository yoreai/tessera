"use client";

import { useEffect, useState } from "react";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Callout } from "../../components/Callout";
import { Theorem } from "../../components/Theorem";

// Components for MDX
const components = {
  Callout,
  Theorem,

  // Tables
  table: (props: any) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props} />
    </div>
  ),
  thead: (props: any) => (
    <thead className="bg-gray-50 dark:bg-gray-800" {...props} />
  ),
  th: (props: any) => (
    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100" {...props} />
  ),
  td: (props: any) => (
    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700" {...props} />
  ),

  // Headings
  h1: (props: any) => (
    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-12 mb-6 pb-3 border-b border-gray-200 dark:border-gray-700" {...props} />
  ),
  h2: (props: any) => (
    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-10 mb-4" {...props} />
  ),
  h3: (props: any) => (
    <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mt-8 mb-3" {...props} />
  ),
  h4: (props: any) => (
    <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mt-6 mb-2" {...props} />
  ),

  // Paragraphs
  p: (props: any) => (
    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4" {...props} />
  ),

  // Lists
  ul: (props: any) => (
    <ul className="list-disc list-outside ml-6 space-y-2 mb-4 text-gray-600 dark:text-gray-400" {...props} />
  ),
  ol: (props: any) => (
    <ol className="list-decimal list-outside ml-6 space-y-2 mb-4 text-gray-600 dark:text-gray-400" {...props} />
  ),
  li: (props: any) => (
    <li className="leading-relaxed" {...props} />
  ),

  // Links
  a: (props: any) => (
    <a className="text-purple-600 dark:text-purple-400 hover:underline" {...props} />
  ),

  // Inline code
  code: (props: any) => {
    if (!props.className) {
      return (
        <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-purple-600 dark:text-purple-400" {...props} />
      );
    }
    return <code {...props} />;
  },

  // Block quotes
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-purple-500 pl-4 py-2 my-6 text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 rounded-r" {...props} />
  ),

  // Horizontal rule
  hr: () => (
    <hr className="my-8 border-gray-200 dark:border-gray-700" />
  ),

  // Strong
  strong: (props: any) => (
    <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props} />
  ),

  // Pre (code blocks)
  pre: (props: any) => (
    <pre className="bg-gray-900 dark:bg-gray-950 p-4 rounded-lg overflow-x-auto my-6 text-sm text-gray-100" {...props} />
  ),

  // Images
  img: (props: any) => (
    <img className="rounded-lg shadow-lg my-6 max-w-full mx-auto" {...props} />
  ),
};

interface BookContentProps {
  filename: string;
}

export function BookContent({ filename }: BookContentProps) {
  const [content, setContent] = useState<MDXRemoteSerializeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContent() {
      try {
        // Fetch the markdown file from the content folder
        const response = await fetch(`/api/book-content?filename=${encodeURIComponent(filename)}`);
        if (!response.ok) {
          throw new Error("Failed to load book content");
        }

        const data = await response.json();
        setContent(data.source);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [filename]);

  if (loading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-12 text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-12 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Book content is being prepared. Please check back soon.
        </p>
      </div>
    );
  }

  return (
    <article className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 md:p-12">
      <div className="publication-content">
        <MDXRemote {...content} components={components} />
      </div>
    </article>
  );
}

