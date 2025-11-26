import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, ExternalLink, Clock, Tag, Building2 } from "lucide-react";
import { Navigation } from "../../components/Navigation";
import { getPublicationContent } from "../../../lib/mdx";
import { getPublicationBySlug } from "../../../lib/publications";
import { PublicationContent } from "./PublicationContent";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicationPage({ params }: PageProps) {
  const { slug } = await params;
  const publication = getPublicationBySlug(slug);
  const content = await getPublicationContent(slug);

  if (!publication) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900 transition-colors duration-300">
      <Navigation />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Publications
          </Link>

          {/* Header */}
          <header className="mb-12">
            {publication.badge && (
              <span className="inline-block px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mb-4">
                {publication.badge}
              </span>
            )}

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {publication.title}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {publication.date}
              </div>
              <div className="flex items-center">
                <Building2 className="w-4 h-4 mr-2" />
                {publication.institution}
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              <strong>Authors:</strong> {publication.authors.join(", ")}
            </p>

            {/* Keywords */}
            <div className="flex flex-wrap gap-2 mb-6">
              {publication.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {keyword}
                </span>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-4">
              {publication.pdfUrl && (
                <a
                  href={publication.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download PDF
                </a>
              )}
              {publication.demoUrl && (
                <a
                  href={publication.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Live Demo
                </a>
              )}
            </div>
          </header>

          {/* Key Metrics */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 mb-12">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Key Metrics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {publication.metrics.map((metric) => (
                <div key={metric.label} className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                    {metric.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          {content ? (
            <PublicationContent source={content.source} />
          ) : (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Abstract</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {publication.abstract}
              </p>

              {publication.pdfUrl && (
                <div className="mt-8 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    The full paper is available as a PDF download.
                  </p>
                  <a
                    href={publication.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:shadow-lg transition-all duration-300"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Download Full Paper
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
