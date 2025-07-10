'use client';
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ExamPeriod, ExamSubject, ExamTypeColors } from '@/types/exam';
import { CalendarIcon, UserIcon, ChartBarIcon, ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline';
import { ClipboardDocumentCheckIcon, AcademicCapIcon } from '@heroicons/react/24/solid';

export default function ExamDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const examId = pathname.split('/').pop() || '';
  const [exam, setExam] = React.useState<ExamPeriod | null>(null);
  const [examSubjects, setExamSubjects] = React.useState<ExamSubject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [isOwner, setIsOwner] = React.useState(false);
  const OWNER_UID = process.env.NEXT_PUBLIC_OWNER_UID;

  React.useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsOwner(user?.id === OWNER_UID);
    };
    checkUser();
  }, []);

  React.useEffect(() => {
    const fetchData = async () => {
      if (!examId) {
        setError('Invalid exam ID');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        // Fetch exam details
        const { data: examData, error: examError } = await supabase
          .from('exam_periods')
          .select('*')
          .eq('id', examId)
          .single();

        if (examError) throw examError;
        setExam(examData);

        // Fetch exam subjects
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('exam_subjects')
          .select(`
            *,
            subject:subjects(id, name)
          `)
          .eq('exam_period_id', examId)
          .order('exam_date', { ascending: true });

        if (subjectsError) throw subjectsError;
        setExamSubjects(subjectsData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch exam details.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [examId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (startDate: string, endDate: string) => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < today) return "bg-green-100 text-green-700"; // Completed
    if (today >= start && today <= end) return "bg-pink-100 text-pink-700"; // Active
    
    const daysUntilStart = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilStart <= 7) return "bg-yellow-100 text-yellow-700"; // Upcoming
    return "bg-gray-100 text-gray-700"; // Scheduled
  };

  const getStatusText = (startDate: string, endDate: string) => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < today) return "Completed";
    if (today >= start && today <= end) return "Active";
    
    const daysUntilStart = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilStart <= 7) return "Upcoming";
    return "Scheduled";
  };

  const getExamTypeColors = (examType: string): ExamTypeColors => {
    if (examType === "Midterm") {
      return {
        iconBg: "bg-sky-100",
        iconText: "text-sky-600",
        border: "border-sky-100",
        headerText: "text-sky-700",
        modalBg: "bg-sky-50",
        inputBorder: "border-sky-300",
        inputBg: "bg-sky-50",
        inputFocusRing: "focus:ring-sky-200",
        labelText: "text-sky-700",
        icon: ClipboardDocumentCheckIcon
      };
    }
    return {
      iconBg: "bg-purple-100",
      iconText: "text-purple-600",
      border: "border-purple-100",
      headerText: "text-purple-700",
      modalBg: "bg-purple-50",
      inputBorder: "border-purple-300",
      inputBg: "bg-purple-50",
      inputFocusRing: "focus:ring-purple-200",
      labelText: "text-purple-700",
      icon: AcademicCapIcon
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-pink-100 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600 font-bold text-xl">Loading exam details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-pink-100 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 border-2 border-red-300 rounded-3xl p-4 mb-6">
            <p className="text-red-700 font-semibold text-center">{error || 'Exam not found'}</p>
          </div>
          <button
            onClick={() => router.push('/exam')}
            className="flex items-center gap-2 text-pink-600 hover:text-pink-700 font-semibold"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Exam List
          </button>
        </div>
      </div>
    );
  }

  const colors = getExamTypeColors(exam.exam_type);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-pink-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/exam')}
            className="flex items-center gap-2 text-pink-600 hover:text-pink-700 font-semibold"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Exam List
          </button>
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(exam.start_date, exam.end_date)}`}>
            {getStatusText(exam.start_date, exam.end_date)}
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Exam Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-pink-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`${colors.iconBg} p-3 rounded-2xl`}>
                    {React.createElement(colors.icon, {
                      className: `w-6 h-6 ${colors.iconText}`
                    })}
                  </div>
                  <h1 className={`text-2xl font-bold ${colors.headerText}`}>
                    {exam.exam_type + " Exam"}
                  </h1>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className={`text-lg font-semibold ${colors.headerText} mb-2`}>Class Information</h2>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Year</span>
                      <span className="font-semibold">{exam.year}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Class</span>
                      <span className="font-semibold">{exam.class}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Term</span>
                      <span className="font-semibold">{exam.term}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-pink-100 pt-6">
                  <h2 className={`text-lg font-semibold ${colors.headerText} mb-2`}>Exam Period</h2>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <CalendarIcon className="w-5 h-5 text-pink-500" />
                      <div>
                        {formatDate(exam.start_date)} to {formatDate(exam.end_date)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-pink-100 pt-6">
                  <h2 className={`text-lg font-semibold ${colors.headerText} mb-2`}>Additional Info</h2>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <UserIcon className="w-5 h-5 text-pink-500" />
                      <span>{exam.homeroom_teacher || 'Not assigned'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <ChartBarIcon className="w-5 h-5 text-pink-500" />
                      <span>CGPA: {exam.cgpa || 'Not available'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Subject Schedule */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-pink-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-pink-700">Subject Schedule</h2>
                {isOwner && (
                  <button
                    onClick={() => {/* TODO: Implement subject schedule management */}}
                    className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200"
                  >
                    + Add Subject
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {examSubjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="bg-gray-50 rounded-2xl p-4 border border-pink-100"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {subject.subject?.name || 'Unknown Subject'}
                        </h4>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <CalendarIcon className="w-4 h-4 mr-2 text-pink-500" />
                            {formatDate(subject.exam_date)}
                          </div>
                        </div>
                      </div>
                      {isOwner && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {/* TODO: Implement edit subject schedule */}}
                            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-full p-2 transition-all duration-150"
                            title="Edit Schedule"
                          >
                            <CalendarIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {/* TODO: Implement add/edit score */}}
                            className="bg-sky-100 hover:bg-sky-200 text-sky-700 rounded-full p-2 transition-all duration-150"
                            title="Add/Edit Score"
                          >
                            <ChartBarIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {examSubjects.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No subjects scheduled yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 