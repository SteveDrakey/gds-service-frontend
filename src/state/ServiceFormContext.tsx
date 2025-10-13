import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import type { ServiceDefinition, ServiceQuestion } from '../types/service';

interface ServiceFormContextValue {
  service: ServiceDefinition;
  answers: Record<string, unknown>;
  updateAnswer: (questionId: string, value: unknown) => void;
  reset: () => void;
}

const ServiceFormContext = createContext<ServiceFormContextValue | undefined>(undefined);

const defaultValueForQuestion = (question: ServiceQuestion): unknown => {
  switch (question.type) {
    case 'checkbox':
      return false;
    default:
      return '';
  }
};

const createInitialAnswers = (service: ServiceDefinition) =>
  service.questions.reduce<Record<string, unknown>>((accumulator, question) => {
    accumulator[question.id] = defaultValueForQuestion(question);
    return accumulator;
  }, {});

export const ServiceFormProvider = ({
  service,
  children
}: {
  service: ServiceDefinition;
  children: ReactNode;
}) => {
  const initialAnswers = useMemo(() => createInitialAnswers(service), [service]);
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialAnswers);

  useEffect(() => {
    setAnswers(initialAnswers);
  }, [initialAnswers]);

  const updateAnswer = useCallback((questionId: string, value: unknown) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }, []);

  const reset = useCallback(() => {
    setAnswers(createInitialAnswers(service));
  }, [service]);

  const value = useMemo(
    () => ({
      service,
      answers,
      updateAnswer,
      reset
    }),
    [service, answers, updateAnswer, reset]
  );

  return <ServiceFormContext.Provider value={value}>{children}</ServiceFormContext.Provider>;
};

export const useServiceForm = () => {
  const context = useContext(ServiceFormContext);
  if (!context) {
    throw new Error('useServiceForm must be used within a ServiceFormProvider');
  }
  return context;
};
