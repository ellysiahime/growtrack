export interface InsightBullet {
  subject: string;
  title: string;
  explanation: string;
}

export interface StudyRecommendation {
  subject: string;
  focusArea: string;
  action: string;
  timeframe: string;
}

export interface InsightCoverage {
  subjectsAnalyzed: number;
  examsAnalyzed: number;
  numericScoresAnalyzed: number;
  excludedSubjects: string[];
}

export interface AIInsightPayload {
  overallSummary: string;
  strengths: InsightBullet[];
  weaknesses: InsightBullet[];
  studyRecommendations: StudyRecommendation[];
  motivationalFeedback: string;
  notableTrends: string[];
  dataCoverage: InsightCoverage;
}

export interface AIInsightResponse {
  insight: AIInsightPayload | null;
  generatedAt: string | null;
  model: string | null;
  source: "fresh" | "cache";
}
