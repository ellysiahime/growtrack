"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from "@/lib/supabaseClient";
import { Subject } from "@/types/exam";
import { PencilIcon } from "@heroicons/react/24/solid";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '08:00', '08:30', '09:30', '10:30', '11:30', '12:15', '13:15', '14:15', '14:30'
];

// Function to get subject icon (copied from subjects page)
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

export default function TimetablePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetableEntries, setTimetableEntries] = useState<any[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const OWNER_UID = process.env.NEXT_PUBLIC_OWNER_UID;
  const originalSubjectsRef = useRef<{[key: string]: string}>({});

  // Check user ownership
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

  // Fetch subjects and timetable entries from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch subjects
      const subjectsResponse = await supabase
        .from("subjects")
        .select("*")
        .order("name", { ascending: true });
      
      // Fetch timetable entries
      const timetableResponse = await supabase
        .from("timetable")
        .select("*, subjects(name)");
      
      if (subjectsResponse.error || timetableResponse.error) {
        setError("Failed to fetch data");
        console.error(subjectsResponse.error || timetableResponse.error);
      } else {
        // Set subjects
        setSubjects(subjectsResponse.data || []);
        
        // Set timetable entries and pre-populate selected subjects
        const entries = timetableResponse.data || [];
        setTimetableEntries(entries);
        
        // Create a mapping of selected subjects based on timetable entries
        const initialSelectedSubjects: {[key: string]: string} = {};
        entries.forEach((entry: any) => {
          const key = `${entry.day}-${entry.time}`;
          initialSelectedSubjects[key] = entry.subject_id;
        });
        setSelectedSubjects(initialSelectedSubjects);
        // Store original for diffing
        originalSubjectsRef.current = initialSelectedSubjects;
      }
      
      setLoading(false);
    };

    fetchData();
  }, []);

  // Generate unique key for each cell
  const getCellKey = (day: string, timeSlot: string) => `${day}-${timeSlot}`;

  // Handle subject selection for a specific cell
  const handleSubjectChange = (day: string, timeSlot: string, subjectId: string) => {
    setSelectedSubjects(prev => ({
      ...prev,
      [getCellKey(day, timeSlot)]: subjectId
    }));
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (!isEditMode) {
      // Entering edit mode: store the original state
      originalSubjectsRef.current = { ...selectedSubjects };
      setIsEditMode(true);
    } else {
      // Leaving edit mode (cancel): revert to original
      setSelectedSubjects(originalSubjectsRef.current);
      setIsEditMode(false);
    }
  };

  // Save only changed cells in one go
  const handleSave = async () => {
    const original = originalSubjectsRef.current;
    const updated = selectedSubjects;
    const upserts = [];
    // Build a map of existing DB entries for quick lookup
    const entryMap: {[key: string]: any} = {};
    timetableEntries.forEach((entry: any) => {
      entryMap[`${entry.day}-${entry.time}`] = entry;
    });

    // Find all cells that have changed
    for (const day of DAYS) {
      for (const time of TIME_SLOTS) {
        const key = `${day}-${time}`;
        const orig = original[key] ?? null;
        const curr = updated[key] ?? null;
        if (orig !== curr) {
          upserts.push({
            day,
            time,
            subject_id: curr || null
          });
        }
      }
    }

    setLoading(true);
    setError(null);
    try {
      // Perform upserts (insert/update, including null subject_id)
      if (upserts.length > 0) {
        const upsertResult = await supabase
          .from("timetable")
          .upsert(upserts, { onConflict: "day,time" });
        if (upsertResult.error) {
          console.error('Upsert error:', upsertResult);
          throw upsertResult.error;
        }
      }
      // Refetch data
      const timetableResponse = await supabase
        .from("timetable")
        .select("*, subjects(name)");
      if (timetableResponse.error) {
        console.error('Refetch error:', timetableResponse);
        throw timetableResponse.error;
      }
      const entries = timetableResponse.data || [];
      setTimetableEntries(entries);
      const initialSelectedSubjects: {[key: string]: string} = {};
      entries.forEach((entry: any) => {
        const key = `${entry.day}-${entry.time}`;
        initialSelectedSubjects[key] = entry.subject_id;
      });
      setSelectedSubjects(initialSelectedSubjects);
      originalSubjectsRef.current = initialSelectedSubjects;
      setIsEditMode(false);
    } catch (err: any) {
      setError(err?.message || "Failed to save timetable changes.");
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-pink-200 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-pink-600 drop-shadow-lg tracking-wide mb-2">
              📅 Timetable
            </h1>
            <p className="text-gray-700 text-lg">Weekly Timetable</p>
          </div>
          
          {/* Edit button - only visible to owner */}
          {isOwner && (
            <div className="flex gap-4 w-full sm:w-auto">
              {!isEditMode ? (
                <button
                  onClick={toggleEditMode}
                  className="bg-pink-500 hover:bg-pink-600 text-white font-bold px-6 py-3 rounded-full shadow flex items-center justify-center gap-2 transition-all duration-200 w-full sm:w-auto"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit Timetable
                </button>
              ) : (
                <div className="flex gap-4 w-full sm:w-auto">
                  <button
                    onClick={toggleEditMode}
                    className="bg-gray-300 hover:bg-gray-400 text-white rounded-full px-6 py-3 font-semibold transition-all duration-200 flex-1 sm:flex-none"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="bg-pink-500 hover:bg-pink-600 text-white rounded-full px-6 py-3 font-semibold transition-all duration-200 flex-1 sm:flex-none"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center text-gray-600 font-bold text-xl">Loading timetable...</div>
        ) : error ? (
          <div className="bg-red-100 border-2 border-red-300 rounded-3xl p-4 text-center">
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-pink-100 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border-2 border-pink-200 p-4 bg-pink-50 text-pink-700 font-bold">Time</th>
                  {DAYS.map(day => (
                    <th 
                      key={day} 
                      className="border-2 border-pink-200 p-4 bg-pink-50 text-pink-700 font-bold"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((timeSlot, index) => {
                  // Special condition for Breakfast
                  if (timeSlot === '08:00') {
                    return (
                      <tr key={timeSlot}>
                        <td className="border-2 border-pink-200 p-4 text-center font-semibold text-gray-700">
                          {timeSlot}
                        </td>
                        <td 
                          colSpan={DAYS.length} 
                          className="border-2 border-pink-200 p-4 text-center bg-pink-50 font-bold text-pink-700"
                        >
                          🍞 Breakfast 🥞
                        </td>
                      </tr>
                    );
                  }

                  // Special condition for Lunch Break
                  if (timeSlot === '11:30') {
                    return (
                      <tr key={timeSlot}>
                        <td className="border-2 border-pink-200 p-4 text-center font-semibold text-gray-700">
                          {timeSlot}
                        </td>
                        <td 
                          colSpan={DAYS.length} 
                          className="border-2 border-pink-200 p-4 text-center bg-pink-50 font-bold text-pink-700"
                        >
                          🍽️ Lunch Break 🍱
                        </td>
                      </tr>
                    );
                  }

                  // Special condition for Afternoon Break
                  if (timeSlot === '14:15') {
                    return (
                      <tr key={timeSlot}>
                        <td className="border-2 border-pink-200 p-4 text-center font-semibold text-gray-700">
                          {timeSlot}
                        </td>
                        <td 
                          colSpan={DAYS.length} 
                          className="border-2 border-pink-200 p-4 text-center bg-pink-50 font-bold text-pink-700"
                        >
                          🍎 Afternoon Break ☕
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={timeSlot}>
                      <td className="border-2 border-pink-200 p-4 text-center font-semibold text-gray-700">
                        {timeSlot}
                      </td>
                      {DAYS.map(day => {
                        const cellKey = getCellKey(day, timeSlot);
                        const selectedSubjectId = selectedSubjects[cellKey];
                        const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

                        return (
                          <td 
                            key={cellKey} 
                            className="border-2 border-pink-200 p-4"
                          >
                            {isEditMode ? (
                              <select
                                value={selectedSubjectId || ''}
                                onChange={(e) => handleSubjectChange(day, timeSlot, e.target.value)}
                                className="w-full p-1 rounded-md focus:outline-none"
                              >
                                <option value="">Select Subject</option>
                                {subjects.map(subject => (
                                  <option 
                                    key={subject.id} 
                                    value={subject.id}
                                    className="flex items-center"
                                  >
                                    {getSubjectIcon(subject.name)} {subject.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="text-left sm:text-center">
                                {selectedSubject 
                                  ? (
                                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-2">
                                      <span className="text-lg sm:text-base">{getSubjectIcon(selectedSubject.name)}</span>
                                      <span className="text-sm sm:text-base">{selectedSubject.name}</span>
                                    </div>
                                  )
                                  : ''}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 