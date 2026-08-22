export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export interface MultipleChoiceQuestion {
  id: number;
  type: 'multiple_choice';
  question: string;
  options: [string, string, string, string];
  answer: string;
  explanation?: string;
}

export interface TrueFalseQuestion {
  id: number;
  type: 'true_false';
  question: string;
  options?: undefined;
  answer: 'True' | 'False';
  explanation?: string;
}

export interface ShortAnswerQuestion {
  id: number;
  type: 'short_answer';
  question: string;
  options?: undefined;
  answer: string;
  explanation?: string;
}

export type QuizQuestion = MultipleChoiceQuestion | TrueFalseQuestion | ShortAnswerQuestion;

export interface QuizSuccessResponsePayload {
  success: true;
  data: {
    title: string;
    questions: QuizQuestion[];
  };
}

export type WatchOutCategory = 
  | 'fee'
  | 'deadline'
  | 'penalty'
  | 'auto_renewal'
  | 'obligation'
  | 'restriction'
  | 'liability';

export interface WatchOutItem {
  id: number;
  category: WatchOutCategory;
  title: string;
  description: string;
}

export interface ExplainSuccessResponsePayload {
  success: true;
  data: {
    summary: string;
    detailedExplanation: string;
    watchOutFor: WatchOutItem[];
  };
}

export interface ApiErrorPayload {
  success: false;
  error: {
    code: 'INVALID_INPUT' | 'TOO_SHORT' | 'TOO_LONG' | 'RATE_LIMITED' | 'AI_GENERATION_FAILED' | 'SERVER_TIMEOUT' | 'INTERNAL_ERROR';
    message: string;
  };
}

export type QuizApiResponse = QuizSuccessResponsePayload | ApiErrorPayload;
export type ExplainApiResponse = ExplainSuccessResponsePayload | ApiErrorPayload;
