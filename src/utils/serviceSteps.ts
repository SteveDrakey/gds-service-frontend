import type { ServiceDefinition, ServicePage, ServiceQuestion } from '../types/service';

export interface ServiceStep {
  page?: ServicePage;
  questions: ServiceQuestion[];
}

export const buildServiceSteps = (service: ServiceDefinition): ServiceStep[] => {
  const { pages, questions } = service;

  if (!pages || pages.length === 0) {
    return questions.map((question) => ({ questions: [question] }));
  }

  const questionMap = new Map(questions.map((question) => [question.id, question]));
  const assigned = new Set<string>();

  const sortedPages = pages
    .map((page, index) => ({ page, index }))
    .sort((a, b) => {
      const numberA = typeof a.page.number === 'number' ? a.page.number : Number.POSITIVE_INFINITY;
      const numberB = typeof b.page.number === 'number' ? b.page.number : Number.POSITIVE_INFINITY;

      if (numberA !== numberB) {
        return numberA - numberB;
      }

      return a.index - b.index;
    })
    .map(({ page }) => page);

  const steps: ServiceStep[] = [];

  sortedPages.forEach((page) => {
    const pageQuestions = page.questions
      .map((id) => questionMap.get(id))
      .filter((question): question is ServiceQuestion => Boolean(question));

    if (pageQuestions.length === 0) {
      return;
    }

    pageQuestions.forEach((question) => assigned.add(question.id));
    steps.push({ page, questions: pageQuestions });
  });

  questions.forEach((question) => {
    if (!assigned.has(question.id)) {
      steps.push({ questions: [question] });
    }
  });

  return steps;
};

export const createQuestionStepIndexMap = (steps: ServiceStep[]) => {
  const map = new Map<string, number>();

  steps.forEach((step, index) => {
    step.questions.forEach((question) => {
      if (!map.has(question.id)) {
        map.set(question.id, index);
      }
    });
  });

  return map;
};
