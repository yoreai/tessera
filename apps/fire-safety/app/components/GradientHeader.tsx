"use client";

export default function GradientHeader() {
  return (
    <div className="bg-gradient-to-r from-red-600 via-purple-600 to-pink-600 p-6 md:p-8 rounded-2xl shadow-xl">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white text-center drop-shadow-lg">
        🔥 The Hidden Fire Safety Crisis in Allegheny County
      </h1>
      <h2 className="text-base md:text-lg lg:text-xl text-white/90 text-center mt-3 italic font-light">
        A Data-Driven Call for Smarter Emergency Response and Prevention
      </h2>
    </div>
  );
}
