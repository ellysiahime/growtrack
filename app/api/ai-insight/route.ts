import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AIInsightPayload, AIInsightResponse } from "@/types/insight";

export const dynamic = "force-dynamic";

const OPENAI_MODEL = "gpt-4o-mini";

type SupabaseExamSubjectRow = {
  id: string;
  exam_date: string | null;
  score: number | string | null;
  teacher_name: string | null;
  subject: {
    id: string;
    name: string;
  } | null;
};

type SupabaseExamPeriodRow = {
  id: string;
  year: number;
  class: string;
  term: string;
  exam_type: string;
  start_date: string;
  end_date: string;
  exam_subjects: SupabaseExamSubjectRow[];
};

type SubjectPerformanceSummary = {
  subject: string;
  average: number;
  latestScore: number | null;
  highestScore: number;
  lowestScore: number;
  scoreCount: number;
  trend: "improving" | "declining" | "steady" | "insufficient_data";
};

type CachedInsightRow = {
  id: string;
  created_at: string;
  updated_at: string;
  source_snapshot_hash: string;
  model: string;
  insight_json: AIInsightPayload;
};

function normalizeExamPeriods(rawExamPeriods: unknown[]): SupabaseExamPeriodRow[] {
  return rawExamPeriods.map((period) => {
    const item = period as {
      id: string;
      year: number;
      class: string;
      term: string;
      exam_type: string;
      start_date: string;
      end_date: string;
      exam_subjects?: Array<{
        id: string;
        exam_date: string | null;
        score: number | string | null;
        teacher_name: string | null;
        subject?: { id: string; name: string }[] | { id: string; name: string } | null;
      }>;
    };

    return {
      id: item.id,
      year: item.year,
      class: item.class,
      term: item.term,
      exam_type: item.exam_type,
      start_date: item.start_date,
      end_date: item.end_date,
      exam_subjects: (item.exam_subjects || []).map((subjectRow) => ({
        id: subjectRow.id,
        exam_date: subjectRow.exam_date,
        score: subjectRow.score,
        teacher_name: subjectRow.teacher_name,
        subject: Array.isArray(subjectRow.subject)
          ? subjectRow.subject[0] || null
          : subjectRow.subject || null,
      })),
    };
  });
}

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || error.message?.toLowerCase().includes("relation") === true;
}

function extractBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length);
}

function createAuthedSupabase(accessToken: string): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function buildSnapshotHash(payload: unknown) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function extractNumericScore(value: number | string | null) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function getTrend(scores: number[]) {
  if (scores.length < 2) return "insufficient_data" as const;

  const difference = scores[scores.length - 1] - scores[0];
  if (difference >= 5) return "improving" as const;
  if (difference <= -5) return "declining" as const;
  return "steady" as const;
}

function buildAcademicSnapshot(examPeriods: SupabaseExamPeriodRow[], allSubjects: { id: string; name: string }[]) {
  const numericScores: Array<{
    examPeriodId: string;
    examPeriodLabel: string;
    subject: string;
    score: number;
    examDate: string | null;
  }> = [];
  const excludedSubjects = new Set<string>();

  const sortedPeriods = [...examPeriods].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );

  const periodSummaries = sortedPeriods.map((period) => {
    const label = `Year ${period.year} Class ${period.class} Term ${period.term} ${period.exam_type}`;

    const numericRows = (period.exam_subjects || [])
      .map((row) => ({
        subject: row.subject?.name || "Unknown Subject",
        score: extractNumericScore(row.score),
        examDate: row.exam_date,
      }))
      .filter((row): row is { subject: string; score: number; examDate: string | null } => row.score !== null);

    numericRows.forEach((row) => {
      numericScores.push({
        examPeriodId: period.id,
        examPeriodLabel: label,
        subject: row.subject,
        score: row.score,
        examDate: row.examDate,
      });
    });

    (period.exam_subjects || []).forEach((row) => {
      if (extractNumericScore(row.score) === null && row.subject?.name) {
        excludedSubjects.add(row.subject.name);
      }
    });

    const averageScore =
      numericRows.length > 0
        ? roundToSingleDecimal(numericRows.reduce((sum, row) => sum + row.score, 0) / numericRows.length)
        : null;

    return {
      id: period.id,
      label,
      startDate: period.start_date,
      endDate: period.end_date,
      averageScore,
      scores: numericRows,
    };
  });

  const perSubjectMap = new Map<string, number[]>();
  numericScores.forEach((row) => {
    const subjectScores = perSubjectMap.get(row.subject) || [];
    subjectScores.push(row.score);
    perSubjectMap.set(row.subject, subjectScores);
  });

  const subjectSummaries: SubjectPerformanceSummary[] = Array.from(perSubjectMap.entries())
    .map(([subject, scores]) => ({
      subject,
      average: roundToSingleDecimal(scores.reduce((sum, score) => sum + score, 0) / scores.length),
      latestScore: scores[scores.length - 1] ?? null,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      scoreCount: scores.length,
      trend: getTrend(scores),
    }))
    .sort((a, b) => b.average - a.average);

  const overallAverage =
    numericScores.length > 0
      ? roundToSingleDecimal(numericScores.reduce((sum, row) => sum + row.score, 0) / numericScores.length)
      : null;

  return {
    overallAverage,
    totalSubjects: allSubjects.length,
    totalExamPeriods: sortedPeriods.length,
    numericScoreCount: numericScores.length,
    excludedSubjects: Array.from(excludedSubjects).sort(),
    subjectSummaries,
    periodSummaries,
    rawScores: numericScores,
  };
}

function hasNumericScore(period: SupabaseExamPeriodRow) {
  return (period.exam_subjects || []).some((row) => extractNumericScore(row.score) !== null);
}

function isCompletedPeriod(period: SupabaseExamPeriodRow) {
  const endDate = new Date(period.end_date);
  const today = new Date();

  const normalizedEndDate = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate(),
    23,
    59,
    59,
    999
  );

  return normalizedEndDate.getTime() < today.getTime();
}

function getEligibleExamPeriods(examPeriods: SupabaseExamPeriodRow[]) {
  return examPeriods.filter((period) => isCompletedPeriod(period) && hasNumericScore(period));
}

async function getLatestCachedInsight(supabase: SupabaseClient, snapshotHash: string) {
  const { data, error } = await supabase
    .from("ai_insights")
    .select("id, created_at, updated_at, source_snapshot_hash, model, insight_json")
    .eq("source_snapshot_hash", snapshotHash)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<CachedInsightRow>();

  if (isMissingTableError(error)) {
    return null;
  }

  if (error) {
    throw error;
  }

  return data;
}

async function getMostRecentInsight(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("ai_insights")
    .select("id, created_at, updated_at, source_snapshot_hash, model, insight_json")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<CachedInsightRow>();

  if (isMissingTableError(error)) {
    return null;
  }

  if (error) {
    throw error;
  }

  return data;
}

async function saveInsight(
  supabase: SupabaseClient,
  payload: {
    snapshotHash: string;
    insight: AIInsightPayload;
    model: string;
    userId: string;
  }
) {
  const { error } = await supabase.from("ai_insights").upsert(
    {
      source_snapshot_hash: payload.snapshotHash,
      insight_json: payload.insight,
      model: payload.model,
      summary: payload.insight.overallSummary,
      generated_by: payload.userId,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "source_snapshot_hash",
    }
  );

  if (isMissingTableError(error)) {
    return;
  }

  if (error) {
    throw error;
  }
}

function extractOutputText(responseJson: unknown) {
  if (!responseJson || typeof responseJson !== "object") {
    return null;
  }

  const root = responseJson as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };

  if (typeof root.output_text === "string" && root.output_text.trim()) {
    return root.output_text;
  }

  const contentText = root.output
    ?.flatMap((item) => item.content || [])
    .find((contentItem) => contentItem.type === "output_text" && typeof contentItem.text === "string")?.text;

  return contentText || null;
}

async function generateInsight(snapshot: ReturnType<typeof buildAcademicSnapshot>) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing from the server environment.");
  }

  const schema = {
    type: "object",
    additionalProperties: false,
    required: [
      "overallSummary",
      "strengths",
      "weaknesses",
      "studyRecommendations",
      "motivationalFeedback",
      "notableTrends",
      "dataCoverage",
    ],
    properties: {
      overallSummary: { type: "string" },
      strengths: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["subject", "title", "explanation"],
          properties: {
            subject: { type: "string" },
            title: { type: "string" },
            explanation: { type: "string" },
          },
        },
      },
      weaknesses: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["subject", "title", "explanation"],
          properties: {
            subject: { type: "string" },
            title: { type: "string" },
            explanation: { type: "string" },
          },
        },
      },
      studyRecommendations: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["subject", "focusArea", "action", "timeframe"],
          properties: {
            subject: { type: "string" },
            focusArea: { type: "string" },
            action: { type: "string" },
            timeframe: { type: "string" },
          },
        },
      },
      motivationalFeedback: { type: "string" },
      notableTrends: {
        type: "array",
        items: { type: "string" },
      },
      dataCoverage: {
        type: "object",
        additionalProperties: false,
        required: [
          "subjectsAnalyzed",
          "examsAnalyzed",
          "numericScoresAnalyzed",
          "excludedSubjects",
        ],
        properties: {
          subjectsAnalyzed: { type: "integer" },
          examsAnalyzed: { type: "integer" },
          numericScoresAnalyzed: { type: "integer" },
          excludedSubjects: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "You are an academic insight assistant for a private family dashboard.",
                "Analyze only the provided academic data.",
                "Do not invent missing facts, diagnoses, or external context.",
                "Keep the tone constructive, age-appropriate, and supportive.",
                "When evidence is limited, acknowledge uncertainty in the explanation.",
                "Prefer practical recommendations tied to specific subjects or patterns.",
                "Return JSON that matches the schema exactly.",
              ].join(" "),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                objective:
                  "Summarize strengths, weaknesses, study recommendations, motivational feedback, notable trends, and data coverage from all available exams and scores.",
                academicSnapshot: snapshot,
              }),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "growtrack_ai_insight",
          strict: true,
          schema,
        },
      },
    }),
  });

  const responseJson = await response.json();

  if (!response.ok) {
    const errorMessage =
      typeof responseJson?.error?.message === "string"
        ? responseJson.error.message
        : "OpenAI request failed.";
    throw new Error(errorMessage);
  }

  const outputText = extractOutputText(responseJson);
  if (!outputText) {
    throw new Error("OpenAI returned an empty insight payload.");
  }

  return JSON.parse(outputText) as AIInsightPayload;
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = extractBearerToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const force = body?.force === true;

    const supabase = createAuthedSupabase(accessToken);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [{ data: examPeriods, error: examPeriodsError }, { data: subjects, error: subjectsError }] =
      await Promise.all([
        supabase
          .from("exam_periods")
          .select(
            "id, year, class, term, exam_type, start_date, end_date, exam_subjects(id, exam_date, score, teacher_name, subject:subjects(id, name))"
          )
          .order("start_date", { ascending: true }),
        supabase.from("subjects").select("id, name").order("name", { ascending: true }),
      ]);

    if (examPeriodsError || subjectsError) {
      throw examPeriodsError || subjectsError;
    }

    const normalizedExamPeriods = normalizeExamPeriods(examPeriods || []);
    const eligibleExamPeriods = getEligibleExamPeriods(normalizedExamPeriods);
    const snapshot = buildAcademicSnapshot(eligibleExamPeriods, subjects || []);

    if (snapshot.numericScoreCount === 0) {
      return NextResponse.json(
        {
          error:
            "There are no completed exam periods with numeric scores available yet for AI insight generation.",
        },
        { status: 400 }
      );
    }

    const snapshotHash = buildSnapshotHash({
      examPeriods: eligibleExamPeriods,
      subjects,
    });

    const cachedInsight = await getLatestCachedInsight(supabase, snapshotHash);
    if (cachedInsight && !force) {
      const response: AIInsightResponse = {
        insight: cachedInsight.insight_json,
        generatedAt: cachedInsight.updated_at || cachedInsight.created_at,
        model: cachedInsight.model,
        source: "cache",
      };

      return NextResponse.json(response);
    }

    const insight = await generateInsight(snapshot);

    await saveInsight(supabase, {
      snapshotHash,
      insight,
      model: OPENAI_MODEL,
      userId: user.id,
    });

    const response: AIInsightResponse = {
      insight,
      generatedAt: new Date().toISOString(),
      model: OPENAI_MODEL,
      source: "fresh",
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate AI insight.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = extractBearerToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAuthedSupabase(accessToken);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const latestInsight = await getMostRecentInsight(supabase);
    if (!latestInsight) {
      return NextResponse.json({ insight: null, generatedAt: null, model: null, source: "cache" });
    }

    const response: AIInsightResponse = {
      insight: latestInsight.insight_json,
      generatedAt: latestInsight.updated_at || latestInsight.created_at,
      model: latestInsight.model,
      source: "cache",
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch AI insight.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
