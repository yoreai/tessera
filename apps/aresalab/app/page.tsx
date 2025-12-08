"use client";

import Link from "next/link";
import {
  Brain,
  Network,
  Users,
  Flame,
  BarChart3,
  Clock,
  ExternalLink,
  BookOpen,
  FileText,
  Beaker,
  ArrowRight,
  Database,
  Terminal,
  Stethoscope,
  GitBranch,
} from "lucide-react";
import { Navigation } from "./components/Navigation";
import { publications, books } from "../lib/publications";

const iconMap: Record<string, any> = {
  "geoai-agentic-flow": Brain,
  "coordinate-embedding": Network,
  "multi-agent-coordination": Users,
  "fire-safety-dashboard": Flame,
  "aresadb-studio": Database,
  "aresa-studio": Terminal,
  "clinical-documentation-intelligence": Stethoscope,
  "healthcare-knowledge-graphs": GitBranch,
};

const gradientMap: Record<string, string> = {
  "geoai-agentic-flow": "from-purple-600 to-indigo-600",
  "coordinate-embedding": "from-blue-500 to-cyan-500",
  "multi-agent-coordination": "from-emerald-500 to-teal-500",
  "fire-safety-dashboard": "from-orange-500 to-red-500",
  "aresadb-studio": "from-violet-500 to-purple-600",
  "aresa-studio": "from-cyan-500 to-blue-600",
  "clinical-documentation-intelligence": "from-rose-500 to-pink-600",
  "healthcare-knowledge-graphs": "from-amber-500 to-orange-600",
};

export default function HomePage() {
  const featuredPubs = publications.filter((p) => p.featured);
  const otherPubs = publications.filter((p) => !p.featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900 transition-colors duration-300">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 mb-8 space-x-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full">
              <Beaker className="w-4 h-4" />
              <span>Autonomous Research Systems</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-8">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-purple-800 to-indigo-800 dark:from-gray-100 dark:via-purple-300 dark:to-indigo-300">
                ARESA
              </span>
              <br />
              <span className="text-2xl md:text-3xl bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-500">
                Autonomous Research Engineering & Synthesis Architecture
              </span>
            </h1>

            <p className="max-w-4xl mx-auto text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
              Building self-improving, self-evaluating AI systems that advance STEM research autonomously.
            </p>

            {/* Mission Statement */}
            <div className="max-w-4xl mx-auto mb-12 p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
              <h2 className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-3">Our Mission</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                As AI capabilities advance with world models and cutting-edge research, humans are becoming the bottleneck
                of research progress. ARESA is building the scaffolding for scientifically controlled, empirically proven
                autonomous research—starting with human-in-the-loop collaboration and evolving toward independent discovery.
                Every proof, architecture, and method we develop is validated and shared openly with the world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Publications */}
      <section className="pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 flex items-center">
            <FileText className="w-8 h-8 mr-3 text-purple-600" />
            Featured Research
          </h2>

          <div className="space-y-8">
            {featuredPubs.map((pub, index) => {
              const Icon = iconMap[pub.slug] || Brain;
              const gradient = gradientMap[pub.slug] || "from-purple-500 to-indigo-500";

              return (
                <div
                  key={pub.slug}
                  className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                >
                  <div className={`flex flex-col ${index % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"} gap-8`}>
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center space-x-3">
                          <div className={`p-3 bg-gradient-to-br ${gradient} rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          {pub.badge && (
                            <span className={`px-3 py-1 text-xs font-bold text-white rounded-full bg-gradient-to-r ${gradient}`}>
                              {pub.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-3">
                          {pub.pdfUrl && (
                            <a
                              href={pub.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 space-x-2 text-sm font-medium text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg transition-all duration-300 dark:from-gray-700 dark:to-gray-600 dark:text-gray-300 hover:shadow-lg"
                            >
                              <FileText className="w-4 h-4" />
                              <span>PDF</span>
                            </a>
                          )}
                          {(pub.category === "research" || pub.category === "dashboard") && (
                            <Link
                              href={`/publications/${pub.slug}`}
                              className="inline-flex items-center px-4 py-2 space-x-2 text-sm font-medium text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg transition-all duration-300 dark:from-gray-700 dark:to-gray-600 dark:text-gray-300 hover:shadow-lg"
                            >
                              <FileText className="w-4 h-4" />
                              <span>Read Paper</span>
                            </Link>
                          )}
                          {pub.demoUrl && (
                            <a
                              href={pub.demoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center px-4 py-2 space-x-2 text-sm font-medium text-white bg-gradient-to-r ${gradient} rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105`}
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>Live Demo</span>
                            </a>
                          )}
                        </div>
                      </div>

                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                        {pub.shortTitle}
                      </h3>

                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                        {pub.abstract}
                      </p>

                      {/* Metadata */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                            <Clock className="w-4 h-4" />
                            <span>{pub.date}</span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>Authors:</strong> {pub.authors.join(", ")}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>Institution:</strong> {pub.institution}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <strong>Keywords:</strong>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {pub.keywords.slice(0, 4).map((keyword) => (
                              <span
                                key={keyword}
                                className="px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded-md dark:bg-gray-700 dark:text-gray-300"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Panel */}
                    <div className="md:w-80">
                      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
                        <h4 className="flex items-center text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                          <BarChart3 className="w-5 h-5 mr-2" />
                          Key Metrics
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {pub.metrics.map((metric) => (
                            <div
                              key={metric.label}
                              className="px-3 py-4 text-center rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300"
                            >
                              <div className={`text-xl font-bold mb-1 bg-clip-text text-transparent bg-gradient-to-r ${gradient}`}>
                                {metric.value}
                              </div>
                              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                {metric.label}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hover gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl pointer-events-none`} />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Other Publications */}
      {otherPubs.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
              Additional Publications
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherPubs.map((pub) => {
                const Icon = iconMap[pub.slug] || FileText;
                const gradient = gradientMap[pub.slug] || "from-gray-500 to-slate-500";

                return (
                  <Link
                    key={pub.slug}
                    href={`/publications/${pub.slug}`}
                    className="group p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className={`p-2 bg-gradient-to-br ${gradient} rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {pub.shortTitle}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                      {pub.abstract}
                    </p>
                    <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 font-medium">
                      Read more <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Books Section */}
      <section className="py-12 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 flex items-center">
            <BookOpen className="w-8 h-8 mr-3 text-purple-600" />
            Research Books
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {books.map((book) => (
              <Link
                key={book.slug}
                href={`/books/${book.slug}`}
                className="group p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
              >
                <div className="flex items-start space-x-6">
                  <div className={`w-32 h-44 bg-gradient-to-br ${book.coverGradient} rounded-lg shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                    <BookOpen className="w-12 h-12 text-white/80" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      by {book.author} • {book.date}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
                      {book.description}
                    </p>
                    <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 font-medium">
                      {book.chapters} Chapters <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} ARESA — YoreAI Research Division
          </p>
        </div>
      </footer>
    </div>
  );
}
