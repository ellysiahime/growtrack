'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './styles/calendar.css';
import { BookOpenIcon, AcademicCapIcon, CalendarDaysIcon, ChartBarIcon } from '@heroicons/react/24/solid';
import { ExamPeriod, ExamSubject } from '@/types/exam';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import HomeScoreOverviewChart from './components/HomeScoreOverviewChart';

export default function Home() {
  const [examPeriods, setExamPeriods] = useState<ExamPeriod[]>([]);
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallPerformance, setOverallPerformance] = useState<number | null>(null);
  const [subjectPerformanceRanking, setSubjectPerformanceRanking] = useState<Array<{subject: string, averageScore: number}>>([]);
  const router = useRouter();
  // New state for responsive font size
  const [isMobile, setIsMobile] = useState(false);

  // Handle window resize for responsive font sizing
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // Check initial size
    checkMobile();
    
    // Add event listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchExamPeriods();
    fetchExamSubjects();
  }, []);

  const fetchExamPeriods = async () => {
    const { data, error } = await supabase
      .from('exam_periods')
      .select('*')
      .order('start_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching exam periods:', error);
    } else {
      setExamPeriods(data || []);
    }
    setLoading(false);
  };

  const fetchExamSubjects = async () => {
    const { data, error } = await supabase
      .from('exam_subjects')
      .select(`
        *,
        subject:subjects(name)
      `)
      .order('exam_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching exam subjects:', error);
    } else {
      setExamSubjects(data || []);
      

      // Filter out null or undefined scores
      const validSubjects = (data || []).filter(subject => 
        subject.score !== null && 
        subject.score !== undefined && 
        !isNaN(subject.score)
      );
      
      // Calculate overall performance
      if (validSubjects.length > 0) {
        const totalScore = validSubjects.reduce((sum, subject) => sum + (subject.score || 0), 0);
        const averageScore = totalScore / validSubjects.length;
        setOverallPerformance(Math.round(averageScore * 10) / 10); // Round to 1 decimal place
      } else {
        setOverallPerformance(null);
      }

      // Calculate subject performance ranking
      const subjectScores: {[key: string]: {total: number, count: number}} = {};
      validSubjects.forEach(subject => {
        if (subject.subject?.name && subject.score !== undefined) {
          if (!subjectScores[subject.subject.name]) {
            subjectScores[subject.subject.name] = { total: 0, count: 0 };
          }
          subjectScores[subject.subject.name].total += subject.score;
          subjectScores[subject.subject.name].count += 1;
        }
      });

      // Calculate average scores and sort
      const performanceRanking = Object.entries(subjectScores)
        .map(([subject, { total, count }]) => ({
          subject, 
          averageScore: Math.round((total / count) * 10) / 10
        }))
        .sort((a, b) => b.averageScore - a.averageScore);

      setSubjectPerformanceRanking(performanceRanking);
    }
  };

  // Function to get exam details for a specific date
  const getExamType = (date: Date) => {
    const dateToCheck = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    for (const exam of examPeriods) {
      const startDate = new Date(exam.start_date);
      const examStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endDate = new Date(exam.end_date);
      const examEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      if (dateToCheck >= examStartDate && dateToCheck <= examEndDate) {
        return exam.exam_type;
      }
    }
    return null;
  };

  // Function to get exam subjects for a specific date
  const getExamSubjects = (date: Date) => {
    // Format the calendar date as YYYY-MM-DD in local time
    const dateToCheck = formatLocalDate(date);
    return examSubjects.filter(subject => subject.exam_date === dateToCheck);
  };

  // Helper to format date as YYYY-MM-DD in local time
  function formatLocalDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Function to get the exam period for a specific date
  const getExamPeriodForDate = (date: Date) => {
    const dateStr = formatLocalDate(date);
    for (const exam of examPeriods) {
      const startStr = formatLocalDate(new Date(exam.start_date));
      const endStr = formatLocalDate(new Date(exam.end_date));
      if (dateStr >= startStr && dateStr <= endStr) {
        return exam;
      }
    }
    return null;
  };

  // Handle click on calendar day
  const handleDayClick = (date: Date) => {
    const exam = getExamPeriodForDate(date);
    if (exam) {
      router.push(`/exam/${exam.id}`);
    }
  };

  // Custom tile className
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const examType = getExamType(date);
      const subjects = getExamSubjects(date);
      const classes = [];

      if (examType === 'Midterm') {
        classes.push('midterm-date');
      } else if (examType === 'Final') {
        classes.push('final-date');
      }

      if (subjects.length > 0) {
        classes.push('has-subjects');
      }

      // Add clickable class if this date is in an exam period
      const exam = getExamPeriodForDate(date);
      if (exam) {
        classes.push('exam-clickable');
      }

      return classes.join(' ');
    }
    return '';
  };

  // Custom tile content
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const subjects = getExamSubjects(date);
      if (subjects.length > 0) {
        return (
          <div className="subjects-list">
            {subjects.slice(0, 2).map((subject, index) => (
              <div key={subject.id} className="subject-item">
                {subject.subject?.name}
              </div>
            ))}
            {subjects.length > 2 && (
              <div className="subject-item more">+{subjects.length - 2} more</div>
            )}
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-pink-200 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-pink-600 drop-shadow-lg tracking-wide mb-2 flex items-center gap-2">
            <Image src="/growtrack_logo.png" alt="GrowTrack Logo" width={40} height={40} className="inline-block align-middle" />
            GrowTrack
          </h1>
          <p className="text-gray-700 text-lg">Overall Dashboard</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Academic Performance Overview */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-pink-100">
            <h2 className="text-xl font-bold text-pink-700 mb-4">Academic Overview</h2>
            <div className="flex items-center justify-center">
              {overallPerformance !== null ? (
                <div className="text-center">
                  <p className="text-4xl font-bold text-pink-600">{overallPerformance}</p>
                  <p className="text-sm text-gray-500 mt-2">Average Score of all subjects</p>
                </div>
              ) : (
                <p className="text-gray-500">No exam scores available</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className={`bg-white rounded-3xl p-6 shadow-xl border-2 border-pink-100 lg:col-span-2 ${isMobile ? 'hidden' : ''}`}>
            <h2 className="text-xl font-bold text-pink-700 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <button
                onClick={() => router.push('/exam')}
                className="flex items-center gap-3 p-4 bg-sky-100 hover:bg-sky-200 rounded-2xl transition-all duration-200"
              >
                <AcademicCapIcon className="w-6 h-6 text-sky-600" />
                <span className="font-semibold text-sky-700">Exam Period</span>
              </button>
              <button
                onClick={() => router.push('/score')}
                className="flex items-center gap-3 p-4 bg-purple-100 hover:bg-purple-200 rounded-2xl transition-all duration-200"
              >
                <ChartBarIcon className="w-6 h-6 text-purple-600" />
                <span className="font-semibold text-purple-700">View Scores</span>
              </button>
              <button
                onClick={() => router.push('/subjects')}
                className="flex items-center gap-3 p-4 bg-pink-100 hover:bg-pink-200 rounded-2xl transition-all duration-200"
              >
                <BookOpenIcon className="w-6 h-6 text-pink-600" />
                <span className="font-semibold text-pink-700">Subjects List</span>
              </button>
              <button
                onClick={() => router.push('/timetable')}
                className="flex items-center gap-3 p-4 bg-green-100 hover:bg-green-200 rounded-2xl transition-all duration-200"
              >
                <CalendarDaysIcon className="w-6 h-6 text-green-600" />
                <span className="font-semibold text-green-700">Timetable</span>
              </button>
            </div>
          </div>
        </div>


        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Chart Section */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-pink-100 lg:h-auto">
            <h2 className="text-xl font-bold text-pink-700 mb-4">Latest Exam Score</h2>
            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-pink-100 flex items-center justify-center">
              <HomeScoreOverviewChart />
            </div>
          </div>

          {/* Calendar Section */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-pink-100">
            <h2 className="text-xl font-bold text-pink-700 mb-4">Exam Calendar</h2>
            <div className="calendar-container">
              <Calendar
                className="rounded-2xl border-2 border-pink-100 p-4"
                tileClassName={tileClassName}
                tileContent={tileContent}
                onClickDay={handleDayClick}
              />
            </div>
            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-sky-100" />
                <span className="text-sm text-gray-600">Midterm</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-purple-100" />
                <span className="text-sm text-gray-600">Final</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-pink-100" />
                <span className="text-sm text-gray-600">Today</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {/* Subject Performance Ranking - Full Width */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl border-2 border-pink-200 mb-6">
            <h2 className="text-xl font-bold text-pink-700 mb-4">Subject Performance Ranking</h2>
            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-pink-100 flex items-center justify-center p-2 sm:p-6">
              {subjectPerformanceRanking.length > 0 ? (
                <ResponsiveContainer width="100%" height={isMobile ? 250 : 400}>
                  <BarChart
                    layout="vertical"
                    data={subjectPerformanceRanking}
                    margin={{ 
                      left: isMobile ? -40 : 0, 
                      right: 0, 
                      top: 0, 
                      bottom: 0 
                    }}
                  >
                    <defs>
                      <linearGradient id="subjectPerformanceGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#fecdd3"/> {/* Light pink */}
                        <stop offset="100%" stopColor="#db2777"/> {/* Intense pink */}
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      horizontal={false} 
                      vertical={true} 
                      stroke="#e5e7eb" 
                    />
                    <XAxis 
                      type="number" 
                      domain={[0, 100]} 
                      tickLine={false}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="subject" 
                      width={100} 
                      tickLine={false}
                      tick={{ fontSize: isMobile ? 10 : undefined }} 
                    />
                    <Tooltip 
                      formatter={(value) => [
                        <span key="value" className="text-pink-600">{value}</span>, 
                        'Average Score'
                      ]} 
                      labelStyle={{ color: 'black' }}
                    />
                    <Bar 
                      dataKey="averageScore" 
                      fill="url(#subjectPerformanceGradient)" 
                      barSize={isMobile ? 10 : 15} 
                      radius={[0, 10, 10, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">No subject performance data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
