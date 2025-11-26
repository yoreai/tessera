import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, FileText } from "lucide-react";
import { Navigation } from "../../components/Navigation";
import { getBookBySlug } from "../../../lib/publications";
import { getBookContent } from "../../../lib/mdx";
import { PublicationContent } from "../../publications/[slug]/PublicationContent";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BookPage({ params }: PageProps) {
  const { slug } = await params;
  const book = getBookBySlug(slug);
  const content = await getBookContent(slug);

  if (!book) {
    notFound();
  }

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
          {content ? (
            <PublicationContent source={content.source} />
          ) : (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Preview</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {book.description}
              </p>
              <div className="mt-8 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Download the PDF to read the full book.
                </p>
                {book.pdfUrl && (
                  <a
                    href={book.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:shadow-lg transition-all duration-300"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Download Full Book
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
