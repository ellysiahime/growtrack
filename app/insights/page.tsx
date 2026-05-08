"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowPathIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  SparklesIcon,
  TrophyIcon,
} from "@heroicons/react/24/solid";
import { supabase } from "@/lib/supabaseClient";
import type { AIInsightResponse, InsightBullet, StudyRecommendation } from "@/types/insight";

function SectionList({
  items,
  emptyMessage,
}: {
  items: InsightBullet[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={`${item.subject}-${index}`} className="rounded-2xl border border-pink-100 bg-pink-50/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-pink-700">{item.subject}</h3>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-pink-500">
              {item.title}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-gray-700">{item.explanation}</p>
        </div>
      ))}
    </div>
  );
}

function RecommendationList({ items }: { items: StudyRecommendation[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">No study recommendations available yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {items.map((item, index) => (
        <div key={`${item.subject}-${index}`} className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-amber-700">{item.subject}</h3>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-600">
              {item.timeframe}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-gray-800">{item.focusArea}</p>
          <p className="mt-2 text-sm leading-6 text-gray-700">{item.action}</p>
        </div>
      ))}
    </div>
  );
}

export default function InsightsPage() {
  const [data, setData] = useState<AIInsightResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const fetchLatestInsight = async () => {
    setError("");
    setStatusMessage("");
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setIsAuthenticated(false);
        setData(null);
        return;
      }

      setIsAuthenticated(true);

      const response = await fetch("/api/ai-insight", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load AI insight.");
      }

      setData(payload as AIInsightResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load AI insight.");
    } finally {
      setLoading(false);
    }
  };

  const generateInsight = async () => {
    setError("");
    setStatusMessage("");
    setGenerating(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);

      const response = await fetch("/api/ai-insight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ force: false }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to generate AI insight.");
      }

      const insightResponse = payload as AIInsightResponse;
      setData(insightResponse);
      setStatusMessage(
        insightResponse.source === "cache"
          ? "No new academic data was found, so the latest saved AI insight is being shown."
          : "A fresh AI insight was generated from the latest academic data."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate AI insight.");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchLatestInsight();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-pink-200 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-wide text-pink-600 drop-shadow-lg sm:text-4xl">
              <SparklesIcon className="h-9 w-9 text-amber-500" />
              AI Academic Insight
            </h1>
            <p className="mt-2 text-lg text-gray-700">
              Personalized strengths, weak spots, study ideas, and encouraging feedback based on the academic data already in GrowTrack.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={generateInsight}
              disabled={generating || !isAuthenticated}
              className="rounded-full bg-pink-500 px-6 py-3 font-bold text-white shadow transition-all duration-200 hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generating ? "Generating..." : "Generate AI Insight"}
            </button>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="rounded-3xl border-2 border-yellow-200 bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="mt-1 h-6 w-6 text-yellow-500" />
              <div>
                <h2 className="text-xl font-bold text-pink-700">Sign in required</h2>
                <p className="mt-2 text-gray-700">
                  AI insight generation uses your academic data under the current Supabase session. Please sign in first, then come back to this page.
                </p>
                <Link href="/login" className="mt-4 inline-block font-semibold text-pink-600 hover:text-pink-700">
                  Go to Login
                </Link>
              </div>
            </div>
          </div>
        )}

        {error && isAuthenticated && (
          <div className="mb-6 rounded-3xl border-2 border-red-300 bg-red-100 p-4 shadow-xl">
            <p className="text-center font-semibold text-red-700">{error}</p>
          </div>
        )}

        {statusMessage && isAuthenticated && (
          <div className="mb-6 rounded-3xl border-2 border-amber-200 bg-amber-50 p-4 shadow-xl">
            <p className="text-center font-semibold text-amber-700">{statusMessage}</p>
          </div>
        )}

        {loading && isAuthenticated ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className={`animate-pulse rounded-3xl bg-white p-6 shadow-xl ${index === 0 ? "lg:col-span-3" : ""}`}>
                <div className="h-6 w-40 rounded-full bg-pink-100" />
                <div className="mt-4 h-4 w-full rounded-full bg-pink-50" />
                <div className="mt-2 h-4 w-4/5 rounded-full bg-pink-50" />
                <div className="mt-2 h-4 w-3/5 rounded-full bg-pink-50" />
              </div>
            ))}
          </div>
        ) : null}

        {!loading && (!data || !data.insight) && !error && isAuthenticated && (
          <div className="rounded-3xl border-2 border-pink-100 bg-white p-8 text-center shadow-xl">
            <SparklesIcon className="mx-auto h-12 w-12 text-amber-500" />
            <h2 className="mt-4 text-2xl font-bold text-pink-700">AI insight not available yet</h2>
            <p className="mt-2 text-gray-600">
              No saved AI insight was found. Click the button above when you want to analyze the current academic data.
            </p>
            <div className="mx-auto mt-6 max-w-3xl rounded-3xl border border-dashed border-amber-200 bg-amber-50/70 p-6 text-left">
              <h3 className="text-lg font-bold text-amber-700">What will appear here</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-4">
                  <p className="font-semibold text-pink-700">Strengths</p>
                  <p className="mt-2 text-sm text-gray-600">Subjects that consistently perform well and patterns worth maintaining.</p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="font-semibold text-pink-700">Weaknesses</p>
                  <p className="mt-2 text-sm text-gray-600">Subjects or score patterns that may need more support.</p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="font-semibold text-pink-700">Study Recommendations</p>
                  <p className="mt-2 text-sm text-gray-600">Actionable next steps based on subject trends across exams.</p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="font-semibold text-pink-700">Motivational Feedback</p>
                  <p className="mt-2 text-sm text-gray-600">Supportive feedback that reflects the overall progress shown in the data.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {data?.insight && !loading && (
          <div className="space-y-6">
            <div className="rounded-3xl border-2 border-pink-100 bg-white p-6 shadow-xl">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <BoltIcon className="h-5 w-5 text-amber-500" />
                    <span className="text-sm font-semibold uppercase tracking-wide text-pink-500">
                      Overall Summary
                    </span>
                  </div>
                  <p className="mt-3 max-w-4xl text-base leading-7 text-gray-700">{data.insight.overallSummary}</p>
                </div>
                <div className="rounded-2xl bg-pink-50 px-4 py-3 text-sm text-gray-600">
                  <p>
                    <span className="font-semibold text-pink-700">Source:</span>{" "}
                    {data.source === "cache" ? "Saved insight" : "Fresh analysis"}
                  </p>
                  <p className="mt-1">
                    <span className="font-semibold text-pink-700">Generated:</span>{" "}
                    {data.generatedAt ? new Date(data.generatedAt).toLocaleString() : "Not available"}
                  </p>
                  <p className="mt-1">
                    <span className="font-semibold text-pink-700">Model:</span> {data.model || "Not available"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border-2 border-green-100 bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center gap-3">
                  <TrophyIcon className="h-7 w-7 text-green-500" />
                  <h2 className="text-2xl font-bold text-pink-700">Strengths</h2>
                </div>
                <SectionList items={data.insight.strengths} emptyMessage="No clear strengths were identified from the current data yet." />
              </div>

              <div className="rounded-3xl border-2 border-rose-100 bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center gap-3">
                  <ExclamationTriangleIcon className="h-7 w-7 text-rose-500" />
                  <h2 className="text-2xl font-bold text-pink-700">Weaknesses</h2>
                </div>
                <SectionList items={data.insight.weaknesses} emptyMessage="No consistent weakness was identified from the current data yet." />
              </div>
            </div>

            <div className="rounded-3xl border-2 border-amber-100 bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center gap-3">
                <LightBulbIcon className="h-7 w-7 text-amber-500" />
                <h2 className="text-2xl font-bold text-pink-700">Study Recommendations</h2>
              </div>
              <RecommendationList items={data.insight.studyRecommendations} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-3xl border-2 border-pink-100 bg-white p-6 shadow-xl lg:col-span-2">
                <div className="mb-4 flex items-center gap-3">
                  <ArrowPathIcon className="h-7 w-7 text-sky-500" />
                  <h2 className="text-2xl font-bold text-pink-700">Notable Trends</h2>
                </div>
                {data.insight.notableTrends.length > 0 ? (
                  <div className="space-y-3">
                    {data.insight.notableTrends.map((trend, index) => (
                      <div key={index} className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4 text-sm leading-6 text-gray-700">
                        {trend}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No notable trends were returned.</p>
                )}
              </div>

              <div className="rounded-3xl border-2 border-pink-100 bg-white p-6 shadow-xl">
                <h2 className="text-2xl font-bold text-pink-700">Data Coverage</h2>
                <div className="mt-4 space-y-3 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold text-pink-700">Subjects analyzed:</span>{" "}
                    {data.insight.dataCoverage.subjectsAnalyzed}
                  </p>
                  <p>
                    <span className="font-semibold text-pink-700">Exams analyzed:</span>{" "}
                    {data.insight.dataCoverage.examsAnalyzed}
                  </p>
                  <p>
                    <span className="font-semibold text-pink-700">Numeric scores:</span>{" "}
                    {data.insight.dataCoverage.numericScoresAnalyzed}
                  </p>
                  <p>
                    <span className="font-semibold text-pink-700">Excluded subjects:</span>{" "}
                    {data.insight.dataCoverage.excludedSubjects.length > 0
                      ? data.insight.dataCoverage.excludedSubjects.join(", ")
                      : "None"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border-2 border-purple-100 bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center gap-3">
                <SparklesIcon className="h-7 w-7 text-purple-500" />
                <h2 className="text-2xl font-bold text-pink-700">Motivational Feedback</h2>
              </div>
              <p className="rounded-2xl bg-purple-50 p-5 text-base leading-7 text-gray-700">
                {data.insight.motivationalFeedback}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
