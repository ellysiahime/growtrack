"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ScoreData {
  subject: string;
  midterm: number;
  final: number;
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

async function getFilterOptions() {
  const { data, error } = await supabase
    .from('exam_periods')
    .select('class, term');

  if (error) {
    console.error('Error fetching filter options:', error);
    return { classes: [], terms: [] };
  }

  const classes = [...new Set(data.map(item => item.class))].sort();
  const terms = [...new Set(data.map(item => item.term))].sort((a, b) => a - b);

  return { classes, terms };
}

const ScorePage = () => {
  const [data, setData] = useState<ScoreData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for filters
  const [availableClasses, setAvailableClasses] = useState<(string)[]>([]);
  const [availableTerms, setAvailableTerms] = useState<(number)[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('all');

  // Fetch filter options on mount
  useEffect(() => {
    getFilterOptions().then(({ classes, terms }) => {
      setAvailableClasses(classes);
      setAvailableTerms(terms);
      // Set default filters to the first available option
      if (classes.length > 0) {
        setSelectedClass(classes[0]);
      }
      // No need to set term, it defaults to 'all'
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
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-white rounded-2xl shadow-md border-2 border-pink-50">
        <div className="flex-1">
          <label htmlFor="class-select" className="block text-sm font-medium text-gray-700 mb-1">
            Class
          </label>
          <select
            id="class-select"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500"
          >
            {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="term-select" className="block text-sm font-medium text-gray-700 mb-1">
            Term
          </label>
          <select
            id="term-select"
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500"
          >
            <option value="all">All</option>
            {availableTerms.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-pink-100 min-h-[450px]">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">Loading chart data...</p>
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="midterm" fill="#0284c7" name={bar1Name} />
              <Bar dataKey="final" fill="#805ad5" name={bar2Name} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">No score data available for the selected filters.</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default ScorePage; 