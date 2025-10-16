export type QuestionType = 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date';

export type QuestionWidth =
  | 'full'
  | 'three-quarters'
  | 'two-thirds'
  | 'one-half'
  | 'one-third'
  | 'one-quarter';

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
  heading?: string;
  preface?: string;
  pageId?: string;
  order?: number;
  width?: QuestionWidth;
}

export interface ServicePage {
  id: string;
  title: string;
  description?: string;
  order?: number;
}

export interface ServiceDefinition {
  slug: string;
  name: string;
  summary?: string;
  questions: ServiceQuestion[];
  source?: string;
  pages?: ServicePage[];
}
