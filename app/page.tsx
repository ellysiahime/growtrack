import { ChartBarIcon, CalendarIcon, AcademicCapIcon, BookOpenIcon } from "@heroicons/react/24/outline";

export default function Home() {
  // Dummy data for demonstration
  const recentScores = [
    { subject: "Math", score: 85, date: "2024-01-15" },
    { subject: "English", score: 92, date: "2024-01-10" },
    { subject: "Science", score: 78, date: "2024-01-08" },
    { subject: "History", score: 88, date: "2024-01-05" },
  ];

  const upcomingExams = [
    { subject: "Math", date: "2024-01-20", type: "Midterm" },
    { subject: "English", date: "2024-01-25", type: "Quiz" },
    { subject: "Science", date: "2024-01-30", type: "Final" },
  ];

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-pink-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-pink-600 drop-shadow-lg tracking-wide mb-2">
            🧠📊 Dashboard
          </h1>
          <p className="text-pink-700 text-lg">Welcome back! Here's your academic overview.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-pink-100">
            <div className="flex items-center gap-3">
              <div className="bg-pink-100 p-3 rounded-full">
                <BookOpenIcon className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-pink-600 font-semibold">Total Subjects</p>
                <p className="text-2xl font-bold text-pink-700">6</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-pink-100">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-full">
                <AcademicCapIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-semibold">Average Score</p>
                <p className="text-2xl font-bold text-green-700">85.8%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-pink-100">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-semibold">Upcoming Exams</p>
                <p className="text-2xl font-bold text-blue-700">3</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-pink-100">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-3 rounded-full">
                <ChartBarIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-yellow-600 font-semibold">This Month</p>
                <p className="text-2xl font-bold text-yellow-700">12</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart Section */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-pink-100">
            <h2 className="text-xl font-bold text-pink-700 mb-4 flex items-center gap-2">
              <ChartBarIcon className="w-6 h-6" />
              Recent Scores
            </h2>
            <div className="space-y-4">
              {recentScores.map((score, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-pink-50 rounded-2xl">
                  <div>
                    <p className="font-semibold text-pink-700">{score.subject}</p>
                    <p className="text-sm text-pink-600">{score.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-pink-600">{score.score}%</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-pink-50 rounded-2xl text-center">
              <p className="text-pink-600 font-semibold">📊 Chart visualization coming soon!</p>
            </div>
          </div>

          {/* Calendar Section */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-pink-100">
            <h2 className="text-xl font-bold text-pink-700 mb-4 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6" />
              Upcoming Exams - {currentMonth}
            </h2>
            <div className="space-y-4">
              {upcomingExams.map((exam, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-pink-50 rounded-2xl">
                  <div>
                    <p className="font-semibold text-pink-700">{exam.subject}</p>
                    <p className="text-sm text-pink-600">{exam.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-pink-600">{exam.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-pink-50 rounded-2xl text-center">
              <p className="text-pink-600 font-semibold">📅 Calendar widget coming soon!</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-3xl p-6 shadow-xl border-2 border-pink-100">
          <h2 className="text-xl font-bold text-pink-700 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button className="flex items-center gap-3 p-4 bg-pink-100 hover:bg-pink-200 rounded-2xl transition-all duration-200">
              <BookOpenIcon className="w-6 h-6 text-pink-600" />
              <span className="font-semibold text-pink-700">Manage Subjects</span>
            </button>
            <button className="flex items-center gap-3 p-4 bg-green-100 hover:bg-green-200 rounded-2xl transition-all duration-200">
              <AcademicCapIcon className="w-6 h-6 text-green-600" />
              <span className="font-semibold text-green-700">Add Exam</span>
            </button>
            <button className="flex items-center gap-3 p-4 bg-blue-100 hover:bg-blue-200 rounded-2xl transition-all duration-200">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
              <span className="font-semibold text-blue-700">View Scores</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
