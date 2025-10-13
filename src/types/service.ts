export type QuestionType = 'text' | 'textarea' | 'select' | 'checkbox' | 'number';

export interface ServiceQuestionOption {
  value: string;
  label: string;
}

export interface ServiceQuestion {
  id: string;
  label: string;
  description?: string;
  type: QuestionType;
  options?: ServiceQuestionOption[];
  required: boolean;
}

export interface ServiceDefinition {
  slug: string;
  name: string;
  summary?: string;
  questions: ServiceQuestion[];
  source?: string;
}
