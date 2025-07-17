"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BarData {
  subject: string;
  score: number;
}

export default function HomeScoreOverviewChart() {
  const [data, setData] = useState<BarData[]>([]);
  const [periodLabel, setPeriodLabel] = useState<string>('');
  const [currentExamType, setCurrentExamType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChartData() {
      setLoading(true);
      const { data: periods, error: periodsError } = await supabase
        .from('exam_periods')
        .select('id, class, term, exam_type')
        .order('start_date', { ascending: false });

      if (periodsError || !periods) {
        setData([]);
        setPeriodLabel('');
        setLoading(false);
        return;
      }

      for (const period of periods) {
        const { data: examSubjects, error: examSubjectsError } = await supabase
          .from('exam_subjects')
          .select('score, subjects(name)')
          .eq('exam_period_id', period.id);

        if (examSubjectsError || !examSubjects) continue;

        // Check if all scores are null or 'N/A'
        const allNA = examSubjects.every(
          es =>
            es.score === null ||
            es.score === undefined ||
            es.score === 'N/A'
        );

        if (allNA) continue;

        // Filter out Art and N/A/null scores
        const validSubjects = (examSubjects as any[])
          .filter(
            es =>
              (Array.isArray(es.subjects)
                ? es.subjects[0]?.name
                : es.subjects?.name) !== 'Art' &&
              es.score !== null &&
              es.score !== undefined &&
              es.score !== 'N/A'
          )
          .map(es => ({
            subject: Array.isArray(es.subjects)
              ? es.subjects[0]?.name
              : es.subjects?.name || 'Unknown',
            score: es.score,
          }));

        setData(validSubjects);
        setCurrentExamType(period.exam_type);
        setPeriodLabel(
          `Class ${period.class} - Term ${period.term} - ${period.exam_type} Exam`
        );
        setLoading(false);
        return;
      }

      // If no period found
      setData([]);
      setPeriodLabel('');
      setLoading(false);
    }
    fetchChartData();
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      {loading ? (
        <div className="flex-grow flex items-center justify-center text-gray-400">
          Loading chart...
        </div>
      ) : data.length > 0 ? (
        <>
          <div
            className={`font-semibold mb-2 mt-4 text-center ${
              currentExamType == 'Final' ? 'text-purple-600' : 'text-sky-600'
            }`}
          >
            {periodLabel}
          </div>
          
          {/* Desktop Chart - Hidden on mobile */}
          <div className="hidden md:block w-full flex-grow">
            <ResponsiveContainer width="100%" height={370}>
              <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="subject" 
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill={currentExamType == 'Final' ? '#805ad5' : '#0284c7'} name="Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Mobile Table - Visible only on mobile */}
          <div className="block md:hidden w-full flex-grow flex items-center justify-center overflow-hidden">
            <div className="w-full max-w-full">
              <table className="w-full text-left border-collapse rounded-2xl">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="py-2 px-4 text-left font-semibold text-gray-600">Subject</th>
                    <th className="py-2 px-4 text-right font-semibold text-gray-600">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200 last:border-b-0">
                      <td className="py-2 px-4">{item.subject}</td>
                      <td className="py-2 px-4 text-right">
                        <span 
                          className={`font-semibold ${
                            currentExamType == 'Final' 
                              ? 'text-purple-600' 
                              : 'text-sky-600'
                          }`}
                        >
                          {item.score}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-grow flex items-center justify-center text-gray-400">
          No complete score data found for any exam period.
        </div>
      )}
    </div>
  );
} 