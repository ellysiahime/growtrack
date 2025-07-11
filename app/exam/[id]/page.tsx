'use client';
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ExamPeriod, ExamSubject, ExamTypeColors, Subject } from '@/types/exam';
import { CalendarIcon, UserIcon, ChartBarIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ClipboardDocumentCheckIcon, AcademicCapIcon } from '@heroicons/react/24/solid';
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

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
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [addSubjectId, setAddSubjectId] = React.useState('');
  const [addTeacher, setAddTeacher] = React.useState('');
  const [addExamDate, setAddExamDate] = React.useState('');
  const [addScore, setAddScore] = React.useState('');
  const [addLoading, setAddLoading] = React.useState(false);
  const [addError, setAddError] = React.useState('');
  const [editId, setEditId] = React.useState<string | null>(null);
  const [editExamDate, setEditExamDate] = React.useState('');
  const [editTeacher, setEditTeacher] = React.useState('');
  const [editScore, setEditScore] = React.useState('');
  const [editLoading, setEditLoading] = React.useState(false);
  const [editError, setEditError] = React.useState('');
  const [deleteSubjectId, setDeleteSubjectId] = React.useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

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

  // Fetch subjects for dropdown
  React.useEffect(() => {
    const fetchSubjects = async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name', { ascending: true });
      if (!error) setSubjects(data || []);
    };
    fetchSubjects();
  }, []);

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

  // Add subject handler
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!addSubjectId) {
      setAddError('Please select a subject.');
      return;
    }
    setAddLoading(true);
    const { error } = await supabase.from('exam_subjects').insert([
      {
        exam_period_id: examId,
        subject_id: addSubjectId,
        teacher_name: addTeacher || null,
        exam_date: addExamDate || null,
        score: addScore !== '' ? Number(addScore) : null,
      },
    ]);
    setAddLoading(false);
    if (error) {
      setAddError('Failed to add subject.');
    } else {
      setShowAddForm(false);
      setAddSubjectId('');
      setAddTeacher('');
      setAddExamDate('');
      setAddScore('');
      // Refresh subject schedule
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('exam_subjects')
        .select(`*, subject:subjects(id, name)`)
        .eq('exam_period_id', examId)
        .order('exam_date', { ascending: true });
      setExamSubjects(subjectsData || []);
    }
  };

  // Start editing a subject row
  const handleEdit = (subject: ExamSubject) => {
    setEditId(subject.id);
    setEditExamDate(subject.exam_date || '');
    setEditTeacher(subject.teacher_name || '');
    setEditScore(subject.score !== null && subject.score !== undefined ? String(subject.score) : '');
    setEditError('');
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditId(null);
    setEditExamDate('');
    setEditTeacher('');
    setEditScore('');
    setEditError('');
  };

  // Save edit
  const handleSaveEdit = async (subjectId: string) => {
    setEditLoading(true);
    setEditError('');
    const { error } = await supabase
      .from('exam_subjects')
      .update({
        exam_date: editExamDate || null,
        teacher_name: editTeacher || null,
        score: editScore !== '' ? Number(editScore) : null,
      })
      .eq('id', subjectId);
    setEditLoading(false);
    if (error) {
      setEditError('Failed to update.');
    } else {
      setEditId(null);
      setEditExamDate('');
      setEditTeacher('');
      setEditScore('');
      // Refresh subject schedule
      const { data: subjectsData } = await supabase
        .from('exam_subjects')
        .select(`*, subject:subjects(id, name)`)
        .eq('exam_period_id', examId)
        .order('exam_date', { ascending: true });
      setExamSubjects(subjectsData || []);
    }
  };

  // Add delete handler for exam_subjects
  const handleDeleteSubject = async (subjectId: string) => {
    setDeleteSubjectId(subjectId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteSubjectId) return;
    setEditLoading(true);
    setEditError('');
    const { error } = await supabase
      .from('exam_subjects')
      .delete()
      .eq('id', deleteSubjectId);
    setEditLoading(false);
    if (error) {
      setEditError('Failed to delete.');
    } else {
      setDeleteSubjectId(null);
      setShowDeleteModal(false);
      // Refresh subject schedule
      const { data: subjectsData } = await supabase
        .from('exam_subjects')
        .select(`*, subject:subjects(id, name)`)
        .eq('exam_period_id', examId)
        .order('exam_date', { ascending: true });
      setExamSubjects(subjectsData || []);
    }
  };

  const handleCancelDelete = () => {
    setDeleteSubjectId(null);
    setShowDeleteModal(false);
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-pink-700">Subject Schedule</h2>
                {isOwner && (
                  <button
                    className="bg-pink-500 text-white px-4 py-2 rounded-full font-bold hover:bg-pink-600 transition-all"
                    onClick={() => setShowAddForm((v) => !v)}
                  >
                    {showAddForm ? 'Cancel' : 'Add Subject'}
                  </button>
                )}
              </div>
              {showAddForm && (
                <form onSubmit={handleAddSubject} className="mb-6 rounded-3xl p-6 flex flex-col gap-4 border-2 border-pink-200">
                  {addError && <div className="text-red-600 font-semibold text-sm">{addError}</div>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-pink-700 mb-1">Subject</label>
                      <div className="relative">
                        <select
                          className="custom-select w-full border-2 border-pink-300 rounded-full px-4 pr-10 py-2 text-base focus:outline-none focus:ring-4 focus:ring-pink-200 bg-pink-50 font-medium transition-all duration-200"
                          value={addSubjectId}
                          onChange={e => setAddSubjectId(e.target.value)}
                          required
                        >
                          <option value="">Select subject</option>
                          {subjects.map(subj => (
                            <option key={subj.id} value={subj.id}>{subj.name}</option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-pink-700 mb-1">Exam Date</label>
                      <input
                        type="date"
                        className="w-full border-2 border-pink-300 rounded-full px-4 py-2 text-base focus:outline-none focus:ring-4 focus:ring-pink-200 bg-pink-50 font-medium transition-all duration-200"
                        value={addExamDate}
                        onChange={e => setAddExamDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-pink-700 mb-1">Teacher</label>
                      <input
                        className="w-full border-2 border-pink-300 rounded-full px-4 py-2 text-base focus:outline-none focus:ring-4 focus:ring-pink-200 bg-pink-50 font-medium transition-all duration-200"
                        value={addTeacher}
                        onChange={e => setAddTeacher(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-pink-700 mb-1">Score</label>
                      <input
                        type="number"
                        className="w-full border-2 border-pink-300 rounded-full px-4 py-2 text-base focus:outline-none focus:ring-4 focus:ring-pink-200 bg-pink-50 font-medium transition-all duration-200"
                        value={addScore}
                        onChange={e => setAddScore(e.target.value)}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="bg-pink-500 text-white px-6 py-2 rounded-full font-bold hover:bg-pink-600 transition-all mt-2 disabled:opacity-50 text-lg"
                    disabled={addLoading}
                  >
                    {addLoading ? 'Adding...' : 'Add Subject'}
                  </button>
                </form>
              )}
              <div className="space-y-4">
                {examSubjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="bg-gray-50 rounded-2xl p-4 border border-pink-100"
                  >
                    <div className={isOwner ? 'grid grid-cols-1 sm:grid-cols-5 gap-2 items-center' : 'grid grid-cols-1 sm:grid-cols-4 gap-2 items-center'}>
                      <div className="font-semibold text-gray-800 truncate">{subject.subject?.name || 'Unknown Subject'}</div>
                      {editId === subject.id ? (
                        <>
                          <div>
                            <label className="block text-xs text-pink-700 mb-1">Exam Date</label>
                            <input
                              type="date"
                              className="w-full border-2 border-pink-300 rounded-full px-3 py-1 text-base focus:outline-none focus:ring-4 focus:ring-pink-200 bg-pink-50 font-medium"
                              value={editExamDate}
                              onChange={e => setEditExamDate(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-pink-700 mb-1">Teacher</label>
                            <input
                              className="w-full border-2 border-pink-300 rounded-full px-3 py-1 text-base focus:outline-none focus:ring-4 focus:ring-pink-200 bg-pink-50 font-medium"
                              value={editTeacher}
                              onChange={e => setEditTeacher(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-pink-700 mb-1">Score</label>
                            <input
                              type="number"
                              className="w-full border-2 border-pink-300 rounded-full px-3 py-1 text-base focus:outline-none focus:ring-4 focus:ring-pink-200 bg-pink-50 font-medium"
                              value={editScore}
                              onChange={e => setEditScore(e.target.value)}
                              min="0"
                              max="100"
                              step="0.01"
                            />
                          </div>
                          {isOwner && (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleSaveEdit(subject.id)}
                                className="bg-green-400 hover:bg-green-500 text-white rounded-full p-2 transition-all duration-150 cursor-pointer"
                                title="Save"
                                disabled={editLoading}
                              >
                                <CheckIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="bg-gray-300 hover:bg-gray-400 text-white rounded-full p-2 transition-all duration-150 cursor-pointer"
                                title="Cancel"
                                disabled={editLoading}
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-2 text-pink-500" />
                            {subject.exam_date ? formatDate(subject.exam_date) : 'N/A'}
                          </div>
                          <div className="flex items-center">
                            <UserIcon className="w-4 h-4 mr-2 text-pink-500" />
                            {subject.teacher_name || 'N/A'}
                          </div>
                          <div className="flex items-center">
                            <ChartBarIcon className="w-4 h-4 mr-2 text-pink-500" />
                            {subject.score !== null && subject.score !== undefined ? subject.score : 'N/A'}
                          </div>
                          {isOwner && (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleEdit(subject)}
                                className="bg-yellow-300 hover:bg-yellow-400 text-yellow-900 rounded-full p-2 transition-all duration-150 cursor-pointer"
                                title="Edit"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSubject(subject.id)}
                                className="bg-red-100 hover:bg-red-200 text-red-700 rounded-full p-2 transition-all duration-150 cursor-pointer"
                                title="Delete"
                                disabled={editLoading}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteSubjectId && (
        <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={handleCancelDelete}
      >
        <div 
          className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleCancelDelete}
            className="absolute top-4 right-4 text-pink-500 hover:text-pink-700 text-2xl font-bold"
            aria-label="Close"
          >
            <XMarkIcon className="w-7 h-7" />
          </button>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-red-600">Delete Subject</h2>
          </div>

          <div className="bg-red-50 rounded-2xl p-4">
            <p className="text-red-700 font-medium">Are you sure you want to delete this subject?</p>
            <div className="mt-2 text-sm text-gray-600">
                <p className="mt-1 text-lg font-semibold">{examSubjects.find(subject => subject.id === deleteSubjectId)?.subject?.name}</p>
            </div>
          </div>

          <div className="flex gap-4 justify-end mt-6">
            <button
              type="button"
              onClick={handleCancelDelete}
              className="bg-gray-300 hover:bg-gray-400 text-white rounded-full px-6 py-2 font-bold transition-all duration-200"
              disabled={editLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6 py-2 font-bold transition-all duration-200"
              disabled={editLoading}
            >
              {editLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
} 