"use client";

import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { Callout } from "../../components/Callout";
import { Theorem } from "../../components/Theorem";
import { CodeBlock } from "../../components/CodeBlock";

const components = {
  Callout,
  Theorem,
  CodeBlock,

  // Tables
  table: (props: any) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg" {...props} />
    </div>
  ),
  thead: (props: any) => (
    <thead className="bg-gray-100 dark:bg-gray-800" {...props} />
  ),
  tbody: (props: any) => (
    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700" {...props} />
  ),
  tr: (props: any) => (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" {...props} />
  ),
  th: (props: any) => (
    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700" {...props} />
  ),
  td: (props: any) => (
    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300" {...props} />
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
    <pre className="bg-gray-900 dark:bg-gray-950 p-4 rounded-lg overflow-x-auto my-6 text-sm" {...props} />
  ),
};

interface PublicationContentProps {
  source: MDXRemoteSerializeResult;
}

export function PublicationContent({ source }: PublicationContentProps) {
  return (
    <article className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 md:p-12">
      <div className="publication-content">
        <MDXRemote {...source} components={components} />
      </div>
    </article>
  );
}

