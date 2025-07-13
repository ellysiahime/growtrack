'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './styles/calendar.css';
import { BookOpenIcon, AcademicCapIcon, ChartBarIcon } from '@heroicons/react/24/solid';
import { ExamPeriod, ExamSubject } from '@/types/exam';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import HomeScoreOverviewChart from './components/HomeScoreOverviewChart';

export default function Home() {
  const [examPeriods, setExamPeriods] = useState<ExamPeriod[]>([]);
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
    console.log('Clicked date:', date);
    const exam = getExamPeriodForDate(date);
    console.log('Exam found:', exam);
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-pink-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-pink-600 drop-shadow-lg tracking-wide mb-2 flex items-center gap-2">
            <Image src="/growtrack_logo.png" alt="GrowTrack Logo" width={40} height={40} className="inline-block align-middle" />
            GrowTrack
          </h1>
          <p className="text-gray-700 text-lg">Overall Dashboard</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Chart Section */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-pink-100">
            <h2 className="text-xl font-bold text-pink-700 mb-4">Latest Exam Score</h2>
            <div className="aspect-[4/3] bg-gray-50 rounded-2xl border-2 border-dashed border-pink-100 flex items-center justify-center">
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

        {/* Quick Actions */}
        <div className="mt-6 bg-white rounded-3xl p-6 shadow-xl border-2 border-pink-100">
          <h2 className="text-xl font-bold text-pink-700 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/subjects')}
              className="flex items-center gap-3 p-4 bg-pink-100 hover:bg-pink-200 rounded-2xl transition-all duration-200"
            >
              <BookOpenIcon className="w-6 h-6 text-pink-600" />
              <span className="font-semibold text-pink-700">Subjects List</span>
            </button>
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
          </div>
        </div>
      </div>
    </div>
  );
}
