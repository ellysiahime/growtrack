"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { Subject } from "@/types/exam";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const OWNER_UID = process.env.NEXT_PUBLIC_OWNER_UID;

  // Fetch subjects from Supabase
  const fetchSubjects = async () => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .order("name", { ascending: true });
    if (error) {
      setError("Failed to fetch subjects.");
    } else {
      setSubjects(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsOwner(user?.id === OWNER_UID);
    };
    checkUser();
  }, []);

  // Add new subject
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    // Prevent duplicate subject (case-insensitive)
    if (subjects.some(s => s.name.trim().toLowerCase() === newSubject.trim().toLowerCase())) {
      setError("Subject already exists.");
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase
      .from("subjects")
      .insert([{ name: newSubject.trim() }]);
    if (error) {
      setError("Failed to add subject.");
    } else {
      setNewSubject("");
      fetchSubjects();
    }
    setLoading(false);
  };

  // Edit subject
  const handleEdit = (subject: Subject) => {
    setEditId(subject.id);
    setEditValue(subject.name);
  };

  const handleEditSave = async () => {
    if (!editValue.trim() || !editId) return;
    setLoading(true);
    setError("");
    const { error } = await supabase
      .from("subjects")
      .update({ name: editValue.trim() })
      .eq("id", editId);
    if (error) {
      setError("Failed to update subject.");
    } else {
      setEditId(null);
      setEditValue("");
      fetchSubjects();
    }
    setLoading(false);
  };

  const handleEditCancel = () => {
    setEditId(null);
    setEditValue("");
  };

  // Delete subject
  const openDeleteModal = (subject: Subject) => {
    setSubjectToDelete(subject);
    setShowDeleteModal(true);
    setDeleteError("");
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSubjectToDelete(null);
    setDeleteError("");
  };

  const handleDelete = async () => {
    if (!subjectToDelete) return;
    
    setDeleteLoading(true);
    setDeleteError("");
    const { error } = await supabase
      .from("subjects")
      .delete()
      .eq("id", subjectToDelete.id);
    
    if (error) {
      setDeleteError("Failed to delete subject.");
      setDeleteLoading(false);
      return;
    }

    setDeleteLoading(false);
    closeDeleteModal();
    fetchSubjects();
  };

  const getSubjectIcon = (subjectName: string) => {
    const name = subjectName.toLowerCase();
    if (name.includes('math') || name.includes('mathematics')) return '📐';
    if (name.includes('english') || name.includes('language')) return '📖';
    if (name.includes('science')) return '🔬';
    if (name.includes('history')) return '📜';
    if (name.includes('geography')) return '🌍';
    if (name.includes('art') || name.includes('drawing')) return '🎨';
    if (name.includes('music')) return '🎵';
    if (name.includes('physical') || name.includes('pe') || name.includes('sport')) return '⚽';
    if (name.includes('computer') || name.includes('it') || name.includes('technology')) return '💻';
    if (name.includes('chemistry')) return '🧪';
    if (name.includes('physics')) return '⚡';
    if (name.includes('biology')) return '🧬';
    if (name.includes('economics')) return '💰';
    if (name.includes('reading')) return '📝';
    if (name.includes('captain')) return '👑';
    if (name.includes('chinese') || name.includes('bahasa') || name.includes('spanish') || name.includes('french')) return '🗣️';
    return '📚'; // default icon
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-pink-200 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-pink-600 drop-shadow-lg tracking-wide mb-2">
            🎓 Subjects
          </h1>
          <p className="text-gray-700 text-lg">Organize Subjects</p>
        </div>

        {error && (
          <div className="bg-red-100 border-2 border-red-300 rounded-3xl p-4 mb-6">
            <p className="text-red-700 font-semibold text-center">{error}</p>
          </div>
        )}

        {isOwner && (
          <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-pink-100 mb-8">
            <h2 className="text-xl font-bold text-pink-700 mb-4">Add New Subject</h2>
            <form
              onSubmit={handleAddSubject}
              className="flex flex-col sm:flex-row gap-2 justify-center w-full"
            >
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Enter subject name"
                className="border-2 border-pink-300 rounded-full px-4 py-2 w-full sm:flex-1 focus:outline-none focus:ring-4 focus:ring-pink-200 text-base sm:text-lg bg-pink-50 font-medium transition-all duration-200"
                disabled={loading || !isOwner}
              />
              <button
                type="submit"
                className="bg-pink-500 text-white px-4 sm:px-6 py-2 rounded-full font-bold text-base sm:text-lg shadow hover:bg-pink-600 disabled:opacity-50 transition-all duration-200 w-full sm:w-auto cursor-pointer"
                disabled={loading || !newSubject.trim()}
              >
                Add Subject
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600 font-bold text-xl">Loading subjects...</div>
          </div>
        ) : subjects.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-pink-100 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-pink-700 mb-2">No Subjects Found</h2>
            <p className="text-gray-600">Start by adding your first subject.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {subjects
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((subject: Subject) => (
                <div
                  key={subject.id}
                  className="bg-white rounded-3xl p-6 shadow-xl border-2 border-pink-100 hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {editId === subject.id ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="font-bold text-pink-700 bg-white border-2 border-pink-300 rounded-full px-3 py-1 text-lg focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all duration-200"
                          autoFocus
                          disabled={!isOwner}
                          style={{ minWidth: '100px', maxWidth: '140px' }}
                        />
                      ) : (
                        <span className="font-bold text-pink-700">{subject.name}</span>
                      )}
                    </div>
                    {isOwner && (
                      <div className="flex gap-2 ml-2">
                        {editId === subject.id ? (
                          <>
                            <button
                              onClick={handleEditSave}
                              className="bg-green-400 hover:bg-green-500 text-white rounded-full p-2 transition-all duration-150 cursor-pointer"
                              title="Save"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleEditCancel}
                              className="bg-gray-300 hover:bg-gray-400 text-white rounded-full p-2 transition-all duration-150 cursor-pointer"
                              title="Cancel"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(subject)}
                              className="ml-2 bg-yellow-300 hover:bg-yellow-400 text-yellow-900 rounded-full p-2 transition-all duration-150 cursor-pointer"
                              title="Edit Subject"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(subject)}
                              className="ml-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-full p-2 transition-all duration-150 cursor-pointer"
                              title="Delete Subject"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="pt-3 border-t border-pink-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-3xl mb-1">{getSubjectIcon(subject.name)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Edit Mode */}
                  {/* No extra edit mode controls below */}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={closeDeleteModal} // Close modal when clicking outside
        >
          <div 
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from closing it
          >
            <button
              onClick={closeDeleteModal}
              className="absolute top-4 right-4 text-pink-500 hover:text-pink-700 text-2xl font-bold"
              aria-label="Close"
            >
              <XMarkIcon className="w-7 h-7" />
            </button>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-red-600">Delete Subject</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-red-50 rounded-2xl p-4">
                <p className="text-red-700 font-medium">Are you sure you want to delete this subject?</p>
                <div className="mt-2 text-sm text-gray-600">
                  <p className="mt-1 text-lg font-semibold">{subjectToDelete?.name}</p>
                  <p className="mt-1 text-3xl">{getSubjectIcon(subjectToDelete?.name || '')}</p>
                </div>
              </div>
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="bg-gray-300 hover:bg-gray-400 text-white rounded-full px-6 py-2 font-bold transition-all duration-200"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6 py-2 font-bold transition-all duration-200"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
              {deleteError && <div className="text-red-600 text-center font-bold text-sm mt-4">{deleteError}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 