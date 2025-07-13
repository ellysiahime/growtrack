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
    <div className="w-full h-full flex flex-col items-center justify-center">
      {loading ? (
        <div className="text-gray-400">Loading chart...</div>
      ) : data.length > 0 ? (
        <>
          <div
            className={`font-semibold mb-2 text-center ${
              currentExamType == 'Final' ? 'text-purple-600' : 'text-sky-600'
            }`}
          >
            {periodLabel}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill={currentExamType == 'Final' ? '#805ad5' : '#0284c7'} name="Score" />
            </BarChart>
          </ResponsiveContainer>
        </>
      ) : (
        <div className="text-gray-400">No complete score data found for any exam period.</div>
      )}
    </div>
  );
} 