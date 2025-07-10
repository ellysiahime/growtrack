"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { CalendarIcon, UserIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { PencilIcon, TrashIcon, XMarkIcon, AcademicCapIcon, ClipboardDocumentCheckIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { ExamPeriod, ExamTypeColors } from "@/types/exam";

export default function ExamPage() {
  const router = useRouter();
  const [examPeriods, setExamPeriods] = useState<ExamPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const OWNER_UID = process.env.NEXT_PUBLIC_OWNER_UID;
  const [showModal, setShowModal] = useState<null | 'create' | 'edit' | 'delete'>(null);
  const [modalExam, setModalExam] = useState<ExamPeriod | null>(null);
  const [form, setForm] = useState({
    year: '',
    class: '',
    term: '',
    exam_type: '',
    start_date: '',
    end_date: '',
    homeroom_teacher: '',
    cgpa: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsOwner(user?.id === OWNER_UID);
    };
    checkUser();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const openCreateModal = () => {
    setForm({ year: '', class: '', term: '', exam_type: '', start_date: '', end_date: '', homeroom_teacher: '', cgpa: '' });
    setModalExam(null);
    setShowModal('create');
    setFormError('');
  };

  const openEditModal = (e: React.MouseEvent, exam: ExamPeriod) => {
    e.stopPropagation();
    setForm({
      year: exam.year.toString(),
      class: exam.class,
      term: exam.term,
      exam_type: exam.exam_type,
      start_date: exam.start_date,
      end_date: exam.end_date,
      homeroom_teacher: exam.homeroom_teacher || '',
      cgpa: exam.cgpa != null ? exam.cgpa.toString() : "",
    });
    setModalExam(exam);
    setShowModal('edit');
    setFormError('');
  };

  const openDeleteModal = (e: React.MouseEvent, exam: ExamPeriod) => {
    e.stopPropagation();
    setModalExam(exam);
    setShowModal('delete');
  };

  const handleDelete = async () => {
    if (!modalExam) return;
    
    setFormLoading(true);
    const { error } = await supabase
      .from('exam_periods')
      .delete()
      .eq('id', modalExam.id);
    
    if (error) {
      setFormError('Failed to delete exam.');
      setFormLoading(false);
      return;
    }

    setFormLoading(false);
    closeModal();
    fetchExamPeriods();
  };

  const closeModal = () => {
    setShowModal(null);
    setModalExam(null);
    setFormError('');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    // Validation: year, class, term, exam_type, start_date, and end_date are required
    if (!form.year || !form.class || !form.term || !form.exam_type || !form.start_date || !form.end_date) {
      setFormError('Year, Class, Term, Exam Type, Start Date, and End Date are required.');
      setFormLoading(false);
      return;
    }

    // Validate that end date is not before start date
    const startDate = new Date(form.start_date);
    const endDate = new Date(form.end_date);
    if (endDate < startDate) {
      setFormError('End Date cannot be before Start Date.');
      setFormLoading(false);
      return;
    }

    if (showModal === 'create') {
      const { error } = await supabase.from('exam_periods').insert([
        {
          year: parseInt(form.year),
          class: form.class,
          term: form.term,
          exam_type: form.exam_type,
          start_date: form.start_date,
          end_date: form.end_date,
          homeroom_teacher: form.homeroom_teacher || '',
          cgpa: form.cgpa !== '' ? parseFloat(form.cgpa) : null,
        },
      ]);
      if (error) {
        setFormError('Failed to create exam.');
        setFormLoading(false);
        return;
      }
    } else if (showModal === 'edit' && modalExam) {
      const { error } = await supabase.from('exam_periods').update({
        year: parseInt(form.year),
        class: form.class,
        term: form.term,
        exam_type: form.exam_type,
        start_date: form.start_date,
        end_date: form.end_date,
        homeroom_teacher: form.homeroom_teacher || '',
        cgpa: form.cgpa !== '' ? parseFloat(form.cgpa) : null,
      }).eq('id', modalExam.id);
      if (error) {
        setFormError('Failed to update exam.');
        setFormLoading(false);
        return;
      }
    }
    setFormLoading(false);
    closeModal();
    fetchExamPeriods();
  };

  const fetchExamPeriods = async () => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("exam_periods")
      .select("*")
      .order("end_date", { ascending: false });
    if (error) {
      setError("Failed to fetch exam periods.");
    } else {
      setExamPeriods(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExamPeriods();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-pink-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-pink-600 drop-shadow-lg tracking-wide mb-2">
              📚 Exam Periods
            </h1>
            <p className="text-gray-700 text-lg">Manage Exam Schedules</p>
          </div>
          {isOwner && (
            <button
              onClick={openCreateModal}
              className="bg-pink-500 hover:bg-pink-600 text-white font-bold px-6 py-3 rounded-full shadow transition-all duration-200"
            >
              + New Exam
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border-2 border-red-300 rounded-3xl p-4 mb-6">
            <p className="text-red-700 font-semibold text-center">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600 font-bold text-xl">Loading exam periods...</div>
          </div>
        ) : examPeriods.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-pink-100 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-pink-700 mb-2">No Exam Periods Found</h2>
            <p className="text-gray-600">Start by adding your first exam period.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {examPeriods.map((exam) => (
              <div
                key={exam.id}
                className={`bg-white rounded-3xl p-6 shadow-xl border-2 ${getExamTypeColors(exam.exam_type).border} hover:shadow-2xl transition-all duration-300 cursor-pointer`}
                onClick={() => router.push(`/exam/${exam.id}`)}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`${getExamTypeColors(exam.exam_type).iconBg} p-2 rounded-full`}>
                      {React.createElement(getExamTypeColors(exam.exam_type).icon, {
                        className: `w-5 h-5 ${getExamTypeColors(exam.exam_type).iconText}`
                      })}
                    </div>
                    <span className={`font-bold ${getExamTypeColors(exam.exam_type).headerText}`}>{exam.exam_type}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(exam.start_date, exam.end_date)}`}>
                    {getStatusText(exam.start_date, exam.end_date)}
                  </span>
                  {isOwner && (
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={(e) => openEditModal(e, exam)}
                        className="bg-yellow-300 hover:bg-yellow-400 text-yellow-900 rounded-full p-2 transition-all duration-150 cursor-pointer"
                        title="Edit Exam"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => openDeleteModal(e, exam)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 rounded-full p-2 transition-all duration-150 cursor-pointer"
                        title="Delete Exam"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-pink-500" />
                    <span className="text-sm text-gray-600">
                      {formatDate(exam.start_date)} - {formatDate(exam.end_date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-pink-500" />
                    <span className="text-sm text-gray-600">{exam.homeroom_teacher}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <ChartBarIcon className="w-4 h-4 text-pink-500" />
                    <span className="text-sm text-gray-600">CGPA: {exam.cgpa}</span>
                  </div>

                  <div className="pt-3 border-t border-pink-100">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-700">Year {exam.year}</p>
                        <p className="text-sm text-gray-600">Class {exam.class} • Term {exam.term}</p>
                      </div>
                      <button className="bg-pink-100 hover:bg-pink-200 p-2 rounded-full transition-all duration-200">
                        <MagnifyingGlassIcon className="w-4 h-4 text-pink-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {(showModal === 'create' || showModal === 'edit') && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={closeModal}
          >
            <div 
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-pink-500 hover:text-pink-700 text-2xl font-bold"
                aria-label="Close"
              >
                <XMarkIcon className="w-7 h-7" />
              </button>

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-pink-700">{showModal === 'create' ? 'New Exam Period' : 'Edit Exam Period'}</h2>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-pink-700 mb-1">Year</label>
                    <input 
                      name="year" 
                      type="number" 
                      value={form.year} 
                      onChange={handleFormChange} 
                      className="w-full border-2 border-pink-300 rounded-full px-4 py-2 text-base focus:outline-none focus:ring-4 focus:ring-pink-200 bg-pink-50 font-medium transition-all duration-200"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-pink-700 mb-1">Class</label>
                    <input 
                      name="class" 
                      value={form.class} 
                      onChange={handleFormChange} 
                      className="w-full border-2 border-pink-300 rounded-full px-4 py-2 text-base focus:outline-none focus:ring-4 focus:ring-pink-200 bg-pink-50 font-medium transition-all duration-200"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-pink-700 mb-1">Term</label>
                    <input 
                      name="term" 
                      value={form.term} 
                      onChange={handleFormChange} 
                      className="w-full border-2 border-pink-300 rounded-full px-4 py-2 text-base focus:outline-none focus:ring-4 focus:ring-pink-200 bg-pink-50 font-medium transition-all duration-200"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-pink-700 mb-1">Exam Type</label>
                    <div className="relative">
                      <select
                        name="exam_type"
                        value={form.exam_type}
                        onChange={handleFormChange}
                        className="custom-select w-full border-2 border-pink-300 rounded-full px-4 pr-10 py-2 text-base focus:outline-none focus:ring-4 focus:ring-pink-200 bg-pink-50 font-medium transition-all duration-200"
                        required
                      >
                        <option value="">Select type</option>
                        <option value="Final">Final</option>
                        <option value="Midterm">Midterm</option>
                      </select>
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-pink-700 mb-1">Start Date</label>
                    <input 
                      name="start_date" 
                      type="date" 
                      value={form.start_date || ""} 
                      onChange={handleFormChange} 
                      className="w-full border-2 border-pink-300 rounded-full px-4 py-2 text-base focus:outline-none focus:ring-4 focus:ring-pink-200 bg-pink-50 font-medium transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-pink-700 mb-1">End Date</label>
                    <input 
                      name="end_date" 
                      type="date" 
                      value={form.end_date || ""} 
                      onChange={handleFormChange} 
                      className="w-full border-2 border-pink-300 rounded-full px-4 py-2 text-base focus:outline-none focus:ring-4 focus:ring-pink-200 bg-pink-50 font-medium transition-all duration-200"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-pink-700 mb-1">Homeroom Teacher</label>
                    <input 
                      name="homeroom_teacher" 
                      value={form.homeroom_teacher} 
                      onChange={handleFormChange} 
                      className="w-full border-2 border-pink-300 rounded-full px-4 py-2 text-base focus:outline-none focus:ring-4 focus:ring-pink-200 bg-pink-50 font-medium transition-all duration-200"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-pink-700 mb-1">CGPA</label>
                    <input 
                      name="cgpa" 
                      type="number" 
                      step="0.01"
                      value={form.cgpa} 
                      onChange={handleFormChange} 
                      className="w-full border-2 border-pink-300 rounded-full px-4 py-2 text-base focus:outline-none focus:ring-4 focus:ring-pink-200 bg-pink-50 font-medium transition-all duration-200"
                    />
                  </div>
                </div>

                {formError && (
                  <div className="bg-red-100 border-2 border-red-300 rounded-2xl p-4">
                    <p className="text-red-700 font-semibold text-center">{formError}</p>
                  </div>
                )}

                <div className="flex gap-4 justify-end mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="bg-gray-300 hover:bg-gray-400 text-white rounded-full px-6 py-2 font-bold transition-all duration-200"
                    disabled={formLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-pink-500 hover:bg-pink-600 text-white rounded-full px-6 py-2 font-bold transition-all duration-200"
                    disabled={formLoading}
                  >
                    {formLoading ? 'Saving...' : showModal === 'create' ? 'Create' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showModal === 'delete' && modalExam && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={closeModal}
          >
            <div 
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-pink-500 hover:text-pink-700 text-2xl font-bold"
                aria-label="Close"
              >
                <XMarkIcon className="w-7 h-7" />
              </button>

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-red-600">Delete Exam</h2>
              </div>

              <div className="bg-red-50 rounded-2xl p-4">
                <p className="text-red-700 font-medium">Are you sure you want to delete this exam period?</p>
                <div className="mt-2 text-sm text-gray-600">
                  <p className="mt-1 text-lg font-semibold">{modalExam.exam_type} Exam</p>
                  <p className="mt-1">Year {modalExam.year} • Class {modalExam.class} • Term {modalExam.term}</p>
                  <p className="mt-1">{formatDate(modalExam.start_date)} - {formatDate(modalExam.end_date)}</p>
                </div>
              </div>

              <div className="flex gap-4 justify-end mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-300 hover:bg-gray-400 text-white rounded-full px-6 py-2 font-bold transition-all duration-200"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6 py-2 font-bold transition-all duration-200"
                  disabled={formLoading}
                >
                  {formLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
              {formError && <div className="text-red-600 text-center font-bold text-sm mt-4">{formError}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 