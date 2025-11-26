"use client";

import { ReactNode } from "react";

interface TheoremProps {
  type: "theorem" | "lemma" | "definition" | "corollary" | "proposition" | "proof";
  number?: string | number;
  title?: string;
  children: ReactNode;
}

const theoremConfig = {
  theorem: {
    label: "Theorem",
    bgClass: "bg-purple-50 dark:bg-purple-900/20",
    borderClass: "border-purple-500",
    labelClass: "text-purple-700 dark:text-purple-300",
  },
  lemma: {
    label: "Lemma",
    bgClass: "bg-green-50 dark:bg-green-900/20",
    borderClass: "border-green-500",
    labelClass: "text-green-700 dark:text-green-300",
  },
  definition: {
    label: "Definition",
    bgClass: "bg-blue-50 dark:bg-blue-900/20",
    borderClass: "border-blue-500",
    labelClass: "text-blue-700 dark:text-blue-300",
  },
  corollary: {
    label: "Corollary",
    bgClass: "bg-indigo-50 dark:bg-indigo-900/20",
    borderClass: "border-indigo-500",
    labelClass: "text-indigo-700 dark:text-indigo-300",
  },
  proposition: {
    label: "Proposition",
    bgClass: "bg-cyan-50 dark:bg-cyan-900/20",
    borderClass: "border-cyan-500",
    labelClass: "text-cyan-700 dark:text-cyan-300",
  },
  proof: {
    label: "Proof",
    bgClass: "bg-gray-50 dark:bg-gray-800/50",
    borderClass: "border-gray-400",
    labelClass: "text-gray-700 dark:text-gray-300",
  },
};

export function Theorem({ type, number, title, children }: TheoremProps) {
  const config = theoremConfig[type];

  const displayLabel = number
    ? `${config.label} ${number}`
    : config.label;

  const fullTitle = title
    ? `${displayLabel} (${title})`
    : displayLabel;

  return (
    <div
      className={`${config.bgClass} border-l-4 ${config.borderClass} p-6 my-6 rounded-r-lg`}
    >
      <h4 className={`font-bold mb-3 ${config.labelClass}`}>
        {fullTitle}
      </h4>
      <div className={`text-gray-700 dark:text-gray-300 ${type === "proof" ? "italic" : ""}`}>
        {children}
        {type === "proof" && (
          <span className="float-right text-gray-500">□</span>
        )}
      </div>
    </div>
  );
}

