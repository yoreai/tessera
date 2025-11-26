import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { Navigation } from "../components/Navigation";
import { books } from "@/lib/publications";

export default function BooksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900 transition-colors duration-300">
      <Navigation />

      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 mb-8 space-x-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full">
              <BookOpen className="w-4 h-4" />
              <span>Research Books</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              In-Depth Research Books
            </h1>

            <p className="max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-300">
              Comprehensive explorations of mathematics, machine learning, and AI systems—from theoretical foundations to production implementations.
            </p>
          </div>

          {/* Books Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {books.map((book) => (
              <Link
                key={book.slug}
                href={`/books/${book.slug}`}
                className="group p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
              >
                <div className="flex items-start space-x-6">
                  {/* Book Cover */}
                  <div className={`w-40 h-56 bg-gradient-to-br ${book.coverGradient} rounded-lg shadow-xl flex flex-col items-center justify-center p-4 group-hover:scale-105 transition-transform duration-300`}>
                    <BookOpen className="w-12 h-12 text-white/80 mb-3" />
                    <div className="text-white/90 text-xs text-center font-medium line-clamp-3">
                      {book.title}
                    </div>
                  </div>

                  {/* Book Info */}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {book.title}
                    </h2>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      by {book.author} • {book.date}
                    </p>

                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                      {book.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {book.chapters} Chapters
                      </span>
                      <span className="flex items-center text-purple-600 dark:text-purple-400 font-medium">
                        Read Book <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

