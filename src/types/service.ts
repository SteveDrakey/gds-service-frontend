export type QuestionType = 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date';

export interface ServicePage {
  number: number;
  title?: string;
  description?: string;
  hint?: string;
  questions: string[];
}

export interface DateAnswerValue {
  day?: string;
  month?: string;
  year?: string;
}

export interface ServiceQuestionOption {
  value: string;
  label: string;
}

export interface ServiceQuestion {
  id: string;
  label: string;
  description?: string;
  hint?: string;
  type: QuestionType;
  options?: ServiceQuestionOption[];
  required: boolean;
  errorMessage?: string;
  page?: number;
  order?: number;
}

export interface ServiceDefinition {
  slug: string;
  name: string;
  summary?: string;
  questions: ServiceQuestion[];
  pages?: ServicePage[];
  source?: string;
}
