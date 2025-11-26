"use client";

import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { Callout } from "./Callout";
import { Theorem } from "./Theorem";
import { CodeBlock } from "./CodeBlock";

// Custom components for MDX
const components = {
  // Callouts
  Callout,

  // Theorems
  Theorem,

  // Code blocks
  CodeBlock,

  // Custom table styling
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

  // Headings with anchors
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
    <ul className="list-disc list-inside space-y-2 mb-4 text-gray-600 dark:text-gray-400" {...props} />
  ),

  ol: (props: any) => (
    <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-600 dark:text-gray-400" {...props} />
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
    // Check if this is inline code (no className) vs code block
    if (!props.className) {
      return (
        <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-purple-600 dark:text-purple-400" {...props} />
      );
    }
    return <code {...props} />;
  },

  // Block quotes
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-purple-500 pl-4 py-2 my-4 text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 rounded-r" {...props} />
  ),

  // Horizontal rule
  hr: () => (
    <hr className="my-8 border-gray-200 dark:border-gray-700" />
  ),

  // Strong/bold
  strong: (props: any) => (
    <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props} />
  ),

  // Emphasis
  em: (props: any) => (
    <em className="italic" {...props} />
  ),

  // Images
  img: (props: any) => (
    <img className="rounded-lg shadow-lg my-6 max-w-full mx-auto" {...props} />
  ),
};

interface MarkdownRendererProps {
  source: MDXRemoteSerializeResult;
}

export function MarkdownRenderer({ source }: MarkdownRendererProps) {
  return (
    <div className="publication-content">
      <MDXRemote {...source} components={components} />
    </div>
  );
}

