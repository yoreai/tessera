import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, FileText } from "lucide-react";
import { Navigation } from "../../components/Navigation";
import { getBookBySlug } from "../../../lib/publications";
import { BookContent } from "./BookContent";

// Map slugs to actual filenames
const slugToFilename: Record<string, string> = {
  "mathematical-awakening": "book_1_mathematical_awakening.md",
  "practical-ml": "book_2_practical_ml.md",
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BookPage({ params }: PageProps) {
  const { slug } = await params;
  const book = getBookBySlug(slug);

  if (!book) {
    notFound();
  }

  const filename = slugToFilename[slug];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900 transition-colors duration-300">
      <Navigation />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/books"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Books
          </Link>

          {/* Header */}
          <header className="mb-12">
            <div className="flex items-start space-x-6 mb-8">
              {/* Book Cover */}
              <div className={`w-32 h-44 bg-gradient-to-br ${book.coverGradient} rounded-lg shadow-xl flex items-center justify-center flex-shrink-0`}>
                <BookOpen className="w-12 h-12 text-white/80" />
              </div>

              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  {book.title}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                  by {book.author}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {book.date} • {book.chapters} Chapters
                </p>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              {book.description}
            </p>

            {/* Actions */}
            {book.pdfUrl && (
              <a
                href={book.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:shadow-lg transition-all duration-300"
              >
                <FileText className="w-4 h-4 mr-2" />
                Download PDF
              </a>
            )}
          </header>

          {/* Content */}
          <BookContent filename={filename} />
        </div>
      </main>
    </div>
  );
}

