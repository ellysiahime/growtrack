"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ScoreData {
  subject: string;
  midterm: number;
  final: number;
}

interface ProgressData {
  exam_period: string;
  [key: string]: string | number | null; // Allow null for missing subject data
}

async function getChartData(p_class: string, p_term: string): Promise<ScoreData[]> {
  if (!p_class || !p_term) {
    return [];
  }

  const isAverage = p_term === 'all';
  const rpcName = isAverage ? 'get_average_score_chart_data' : 'get_score_chart_data_by_filter';
  const params = isAverage ? { p_class } : { p_class, p_term: Number(p_term) };

  const { data, error } = await supabase.rpc(rpcName, params);

  if (error) {
    console.error(`Error fetching chart data (${rpcName}):`, error);
    return [];
  }
  return data || [];
}

async function getProgressData(): Promise<ProgressData[]> {
  const { data, error } = await supabase
    .from('exam_periods')
    .select(`
      class,
      exam_type,
      term,
      start_date,
      exam_subjects (
        score,
        subjects!inner(name)
      )
    `)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching progress data:', error);
    return [];
  }

  if (!data) return [];

  // 1. Collect all unique subject names across all periods (excluding Art)
  const allSubjects = new Set<string>();
  data.forEach((period: any) => {
    period.exam_subjects.forEach((subjectScore: any) => {
      const subjectName = subjectScore.subjects.name;
      if (subjectName !== 'Art') {
        allSubjects.add(subjectName);
      }
    });
  });

  // 2. Build the progressMap, ensuring every subject is present in every period
  const progressMap = new Map<string, ProgressData>();
  data.forEach((period: any) => {
    const periodKey = `Class ${period.class} - Term ${period.term} ${period.exam_type}`;
    if (!progressMap.has(periodKey)) {
      progressMap.set(periodKey, { exam_period: periodKey });
    }
    const progressData = progressMap.get(periodKey)!;
    // Set all subjects to null by default
    allSubjects.forEach(subject => {
      progressData[subject] = null;
    });
    // Fill in actual scores
    period.exam_subjects.forEach((subjectScore: any) => {
      const subjectName = subjectScore.subjects.name;
      if (subjectName !== 'Art') {
        progressData[subjectName] = subjectScore.score;
      }
    });
  });

  return Array.from(progressMap.values());
}

async function getFilterOptions() {
  const { data, error } = await supabase
    .from('exam_periods')
    .select('class, term');

  if (error) {
    console.error('Error fetching filter options:', error);
    return { classes: [], terms: [] };
  }

  const classes = [...new Set(data.map(item => item.class))].sort((a, b) => b - a);
  const terms = [...new Set(data.map(item => item.term))].sort((a, b) => a - b);

  return { classes, terms };
}

const ScorePage = () => {
  const [data, setData] = useState<ScoreData[]>([]);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for filters
  const [availableClasses, setAvailableClasses] = useState<(string)[]>([]);
  const [availableTerms, setAvailableTerms] = useState<(number)[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  // State for highlighted subject in line chart
  const [highlightedSubject, setHighlightedSubject] = useState<string | null>(null);
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

  // Fetch filter options and progress data on mount
  useEffect(() => {
    Promise.all([
      getFilterOptions(),
      getProgressData()
    ]).then(([{ classes, terms }, progressChartData]) => {
      setAvailableClasses(classes);
      setAvailableTerms(terms);
      setProgressData(progressChartData);
      
      // Set default filters to the first available option
      if (classes.length > 0) {
        setSelectedClass(classes[0]);
      }
    });
  }, []);

  // Fetch chart data when filters change
  useEffect(() => {
    if (selectedClass && selectedTerm) {
      setLoading(true);
      getChartData(selectedClass, selectedTerm).then(chartData => {
        setData(chartData);
        setLoading(false);
      });
    }
  }, [selectedClass, selectedTerm]);

  const bar1Name = selectedTerm === 'all' ? 'Average Midterm' : 'Midterm';
  const bar2Name = selectedTerm === 'all' ? 'Average Final' : 'Final';

  // Get unique subject names for line chart colors
  const subjects = progressData.length > 0 
    ? Object.keys(progressData[0]).filter(key => key !== 'exam_period')
    : [];

  const colors = ['#ff595e', '#ff8531', '#ffca3a', '#8ac926', '#1fa189', '#4e75b5', '#8373e6', '#ed72ed'];

  // Custom legend for line chart
  const renderCustomLegend = () => (
    <div className="flex flex-wrap gap-4 mt-4 justify-center">
      {subjects.map((subject, index) => (
        <span
          key={subject}
          onClick={() => setHighlightedSubject(highlightedSubject === subject ? null : subject)}
          style={{
            color: colors[index % colors.length],
            fontWeight: highlightedSubject === subject ? 'bold' : 'normal',
            cursor: 'pointer',
            opacity: highlightedSubject && highlightedSubject !== subject ? 0.5 : 1,
            textDecoration: highlightedSubject === subject ? 'underline' : 'none',
            transition: 'opacity 0.2s',
          }}
        >
          {subject}
        </span>
      ))}
    </div>
  );

  return ( 
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-pink-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-pink-600 drop-shadow-lg tracking-wide mb-2">
            📈 Exam Score
          </h1>
          <p className="text-gray-700 text-lg">Score Analysis</p>
        </div> 

        {/* Analysis by Type Chart */}
        <div className="bg-white rounded-3xl p-2 pb-4 pt-4 sm:p-6 shadow-xl border-2 border-pink-100 mb-6">
          <h2 className="text-xl text-pink-700 mb-4 font-bold text-center">Analysis by Type</h2>
          
          {/* Filters inside the chart box */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 rounded-2xl">
            <div className="flex-1">
              <label htmlFor="class-select" className="block text-sm font-medium text-gray-700 mb-1">
                Class
              </label>
              <div className="relative flex items-center">
                <select
                  id="class-select"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="custom-select w-full border-2 border-pink-300 rounded-full px-4 pr-10 text-base focus:outline-none focus:ring-4 focus:ring-pink-200 bg-pink-50 font-medium transition-all duration-200 h-12"
                >
                  {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className="pointer-events-none absolute right-4 flex items-center h-12">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="block mx-auto">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>
            </div>
            <div className="flex-1">
              <label htmlFor="term-select" className="block text-sm font-medium text-gray-700 mb-1">
                Term
              </label>
              <div className="relative flex items-center">
                <select
                  id="term-select"
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="custom-select w-full border-2 border-pink-300 rounded-full px-4 pr-10 text-base focus:outline-none focus:ring-4 focus:ring-pink-200 bg-pink-50 font-medium transition-all duration-200 h-12"
                >
                  <option value="all">All</option>
                  {availableTerms.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <span className="pointer-events-none absolute right-4 flex items-center h-12">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="block mx-auto">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-[400px]">
              <p className="text-gray-500">Loading chart data...</p>
            </div>
          ) : data.length > 0 ? (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[500px]"> {/* Ensures minimum width for desktop */}
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="subject" 
                      tick={{ fontSize: isMobile ? 10 : undefined }} 
                      tickLine={false} 
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="midterm" fill="#0284c7" name={bar1Name} />
                    <Bar dataKey="final" fill="#805ad5" name={bar2Name} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-[400px]">
              <p className="text-gray-500">No score data available for the selected filters.</p>
            </div>
          )}
        </div>

        {/* Progress Over Time Chart */}
        <div className="bg-white rounded-3xl p-2 pb-4 pt-4 sm:p-6 shadow-xl border-2 border-pink-100">
          <h2 className="text-xl text-pink-700 mb-4 font-bold text-center">Progress Over Time</h2>
          {progressData.length > 0 ? (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[500px]"> {/* Ensures minimum width for desktop */}
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={progressData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="exam_period" 
                      tick={{ fontSize: isMobile ? 10 : undefined }} 
                    />
                    <YAxis />
                    {!isMobile && <Tooltip />}
                    {/* Hide default legend, use custom below */}
                    {/* <Legend /> */}
                    {subjects.map((subject, index) => (
                      <Line
                        key={subject}
                        type="monotone"
                        dataKey={subject}
                        stroke={colors[index % colors.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        opacity={highlightedSubject && highlightedSubject !== subject ? 0 : 1}
                        activeDot={{ r: 3 }}
                        isAnimationActive={false}
                      />
                    ))}
                    </LineChart>
              </ResponsiveContainer>
            </div>
          </div>  
          ) : (
            <div className="flex justify-center items-center h-[400px]">
              <p className="text-gray-500">No progress data available.</p>
            </div>
          )}
          {/* Custom legend below chart */}
          {progressData.length > 0 && renderCustomLegend()}
        </div>
      </div>
    </div>
  );
};

export default ScorePage; 