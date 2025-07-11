export interface ExamPeriod {
  id: string;
  year: number;
  class: string;
  term: string;
  exam_type: string;
  start_date: string;
  end_date: string;
  homeroom_teacher: string;
  cgpa: number;
}

export interface ExamSubject {
  id: string;
  exam_period_id: string;
  subject_id: string;
  exam_date: string;
  teacher_name?: string;
  score?: number;
  subject?: {
    id: string;
    name: string;
  };
}

export interface Subject {
  id: string;
  name: string;
}

export type ExamType = 'Midterm' | 'Final';

export type ExamStatus = 'Completed' | 'Active' | 'Upcoming' | 'Scheduled';

export interface ExamTypeColors {
  iconBg: string;
  iconText: string;
  border: string;
  headerText: string;
  modalBg: string;
  inputBorder: string;
  inputBg: string;
  inputFocusRing: string;
  labelText: string;
  icon: any; // This is a HeroIcon component type
} 