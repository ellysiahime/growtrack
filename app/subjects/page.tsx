"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isOwner, setIsOwner] = useState(false);

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
  const handleEdit = (subject: any) => {
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
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subject?")) return;
    setLoading(true);
    setError("");
    const { error } = await supabase
      .from("subjects")
      .delete()
      .eq("id", id);
    if (error) {
      setError("Failed to delete subject.");
    } else {
      fetchSubjects();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl w-full mx-auto py-6 px-2 sm:py-10 sm:px-4">
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 sm:mb-8 text-center text-pink-600 drop-shadow-lg tracking-wide">🎓 Subjects</h1>
      {isOwner && (
        <form
          onSubmit={handleAddSubject}
          className="flex flex-col sm:flex-row gap-2 mb-6 sm:mb-8 justify-center w-full"
        >
          <input
            type="text"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="Add new subject"
            className="border-2 border-pink-300 rounded-full px-4 py-2 w-full sm:flex-1 focus:outline-none focus:ring-4 focus:ring-pink-200 text-base sm:text-lg bg-pink-50 font-medium transition-all duration-200"
            disabled={loading || !isOwner}
          />
          <button
            type="submit"
            className="bg-pink-500 text-white px-4 sm:px-6 py-2 rounded-full font-bold text-base sm:text-lg shadow hover:bg-pink-600 disabled:opacity-50 transition-all duration-200 w-full sm:w-auto"
            disabled={loading || !newSubject.trim()}
          >
            Add
          </button>
        </form>
      )}
      {error && (
        <div className="text-red-600 mb-4 text-center font-bold text-sm sm:text-base">{error}</div>
      )}
      <div className="bg-white shadow-xl rounded-3xl p-3 sm:p-6 border-2 border-pink-100">
        {loading ? (
          <div className="text-center text-pink-400 font-bold">Loading...</div>
        ) : subjects.length === 0 ? (
          <div className="text-center text-pink-300 font-semibold">No subjects found.</div>
        ) : (
          <ul className="divide-y divide-pink-100">
            {subjects
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((subject: any) => (
                <li key={subject.id} className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 py-2 sm:py-3 px-1 sm:px-2 group hover:bg-pink-50 rounded-2xl transition-all duration-150">
                  {editId === subject.id ? (
                    <>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="border-2 border-pink-300 rounded-full px-3 py-1 text-base sm:text-lg flex-1 focus:outline-none focus:ring-2 focus:ring-pink-200 bg-pink-50 font-medium"
                        autoFocus
                        disabled={!isOwner}
                      />
                      {isOwner && (
                        <div className="flex gap-2 mt-2 sm:mt-0">
                          <button
                            onClick={handleEditSave}
                            className="bg-green-400 hover:bg-green-500 text-white rounded-full p-2 transition-all duration-150"
                            title="Save"
                          >
                            <CheckIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className="bg-gray-300 hover:bg-gray-400 text-white rounded-full p-2 transition-all duration-150"
                            title="Cancel"
                          >
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-base sm:text-lg font-semibold text-pink-700 text-center sm:text-left">{subject.name}</span>
                      {isOwner && (
                        <div className="flex gap-2 mt-2 sm:mt-0">
                          <button
                            onClick={() => handleEdit(subject)}
                            className="bg-yellow-300 hover:bg-yellow-400 text-yellow-900 rounded-full p-2 transition-all duration-150"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(subject.id)}
                            className="bg-red-400 hover:bg-red-500 text-white rounded-full p-2 transition-all duration-150"
                            title="Delete"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
} 