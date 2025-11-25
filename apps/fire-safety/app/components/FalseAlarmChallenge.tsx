"use client";

export default function FalseAlarmChallenge() {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="bg-white dark:bg-gray-800/80 p-5 rounded-xl border-l-4 border-red-500 shadow-md">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">💡 The False Alarm Challenge</h3>
      </div>

      {/* Two-column cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-l-4 border-red-500 shadow-md">
          <h4 className="text-lg font-bold text-red-600 dark:text-red-400 mb-3">💰 The Hidden Cost</h4>
          <p className="text-gray-600 dark:text-gray-200 leading-relaxed">
            False alarms don't just waste money—they put lives at risk. When emergency responders
            are tied up with preventable calls, response times for real emergencies increase.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-l-4 border-cyan-500 shadow-md">
          <h4 className="text-lg font-bold text-cyan-600 dark:text-cyan-400 mb-3">🔧 Smart Solutions</h4>
          <p className="text-gray-600 dark:text-gray-200 leading-relaxed">
            Modern fire detection technology can reduce false alarms by 40-60% while maintaining safety.
            Investment in smart systems could save millions.
          </p>
        </div>
      </div>

      {/* Cost Per False Alarm Banner */}
      <div className="bg-gradient-to-r from-red-600 via-orange-500 to-teal-400 p-6 rounded-xl text-center shadow-xl">
        <div className="text-sm text-white/90 font-medium mb-2">💸 Cost Per False Alarm</div>
        <div className="text-5xl font-extrabold text-white drop-shadow-lg mb-2">$1,000</div>
        <div className="text-sm text-white/90 italic">in emergency response resources per incident</div>
      </div>
    </div>
  );
}
