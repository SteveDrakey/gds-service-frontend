import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Checkbox,
  DateField,
  ErrorSummary,
  ErrorText,
  H2,
  HintText,
  InputField,
  Paragraph,
  Select,
  TextArea
} from 'govuk-react';
import { useServiceForm } from '../../state/ServiceFormContext';
import type { DateAnswerValue, ServiceQuestion } from '../../types/service';
import { buildServiceSteps } from '../../utils/serviceSteps';

const normaliseId = (value: string, fallback: string) => {
  const cleaned = value.replace(/[^a-zA-Z0-9_-]+/g, '-');
  return cleaned.length > 0 ? cleaned : fallback;
};

const isDateAnswer = (value: unknown): value is DateAnswerValue =>
  Boolean(value) && typeof value === 'object' && ('day' in (value as Record<string, unknown>) || 'month' in (value as Record<string, unknown>) || 'year' in (value as Record<string, unknown>));

const normaliseDateAnswer = (value: unknown): DateAnswerValue => {
  if (!isDateAnswer(value)) {
    return { day: '', month: '', year: '' };
  }

  const candidate = value as DateAnswerValue;
  return {
    day: typeof candidate.day === 'string' ? candidate.day : '',
    month: typeof candidate.month === 'string' ? candidate.month : '',
    year: typeof candidate.year === 'string' ? candidate.year : ''
  };
};

const isComplete = (question: ServiceQuestion, value: unknown) => {
  if (!question.required) {
    return true;
  }

  if (question.type === 'checkbox') {
    return value === true;
  }

  if (question.type === 'date') {
    const dateValue = normaliseDateAnswer(value);
    return ['day', 'month', 'year'].every((part) => {
      const segment = dateValue[part as keyof DateAnswerValue];
      return typeof segment === 'string' && segment.trim().length > 0;
    });
  }

  if (typeof value !== 'string') {
    return false;
  }

  return value.trim().length > 0;
};

const getErrorMessage = (question: ServiceQuestion) => {
  if (question.errorMessage) {
    return question.errorMessage;
  }

  switch (question.type) {
    case 'checkbox':
      return 'You must confirm this before continuing.';
    case 'select':
      return 'Select an option to continue.';
    case 'date':
      return 'Enter the date in full before continuing.';
    default:
      return 'Enter an answer before continuing.';
  }
};

export const ServiceQuestionPage = () => {
  const { questionIndex = '0' } = useParams<{ questionIndex: string }>();
  const stepIndex = Number(questionIndex);
  const navigate = useNavigate();
  const { service, answers, updateAnswer } = useServiceForm();

  const steps = useMemo(() => buildServiceSteps(service), [service]);

  if (Number.isNaN(stepIndex)) {
    return <Navigate to="." replace />;
  }

  const step = steps[stepIndex];

  if (!step) {
    return <Navigate to="../questions/0" replace />;
  }

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setErrors({});
  }, [stepIndex]);

  const fieldIds = useMemo(() => {
    return new Map(
      step.questions.map((question, index) => [question.id, normaliseId(question.id, `question-${stepIndex + 1}-${index + 1}`)])
    );
  }, [step.questions, stepIndex]);

  const isLastStep = stepIndex === steps.length - 1;

  const handleErrorClick = (targetName: string) => {
    const element = document.getElementById(targetName);
    if (element instanceof HTMLElement) {
      element.focus();
    }
  };

  const clearError = useCallback((questionId: string) => {
    setErrors((previous) => {
      if (!previous[questionId]) {
        return previous;
      }

      const next = { ...previous };
      delete next[questionId];
      return next;
    });
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};

    step.questions.forEach((question) => {
      if (!isComplete(question, answers[question.id])) {
        nextErrors[question.id] = getErrorMessage(question);
      }
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    if (isLastStep) {
      navigate('../summary');
    } else {
      navigate(`../questions/${stepIndex + 1}`);
    }
  };

  const handleTextChange = (
    question: ServiceQuestion
  ) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      clearError(question.id);
      updateAnswer(question.id, event.target.value);
    };

  const handleCheckboxChange = (question: ServiceQuestion) => (event: ChangeEvent<HTMLInputElement>) => {
    clearError(question.id);
    updateAnswer(question.id, event.target.checked);
  };

  const handleDateChange = (question: ServiceQuestion) => (next: DateAnswerValue) => {
    clearError(question.id);
    updateAnswer(question.id, {
      day: typeof next.day === 'string' ? next.day : '',
      month: typeof next.month === 'string' ? next.month : '',
      year: typeof next.year === 'string' ? next.year : ''
    });
  };

  const renderField = (question: ServiceQuestion) => {
    const fieldId = fieldIds.get(question.id) ?? normaliseId(question.id, question.id);
    const hintContent = question.hint ?? question.description;
    const hint = hintContent ? <HintText id={`${fieldId}-hint`}>{hintContent}</HintText> : undefined;
    const error = errors[question.id];
    const fieldMeta = {
      error,
      touched: Boolean(error)
    };

    const value = answers[question.id];
    const stringValue = typeof value === 'string' ? value : '';

    switch (question.type) {
      case 'textarea':
        return (
          <TextArea
            hint={hint}
            meta={fieldMeta}
            input={{
              id: fieldId,
              name: question.id,
              value: stringValue,
              rows: 6,
              onChange: handleTextChange(question),
              required: question.required,
              'aria-describedby': hint ? `${fieldId}-hint` : undefined
            }}
          >
            {question.label}
          </TextArea>
        );
      case 'select':
        return (
          <Select
            label={question.label}
            hint={hint}
            meta={fieldMeta}
            input={{
              id: fieldId,
              name: question.id,
              value: stringValue,
              onChange: handleTextChange(question),
              required: question.required,
              'aria-describedby': hint ? `${fieldId}-hint` : undefined
            }}
          >
            <option value="">Select an option</option>
            {question.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        );
      case 'checkbox':
        return (
          <div>
            {error && <ErrorText>{error}</ErrorText>}
            <Checkbox id={fieldId} checked={value === true} onChange={handleCheckboxChange(question)} hint={hintContent}>
              {question.label}
            </Checkbox>
          </div>
        );
      case 'number':
        return (
          <InputField
            hint={hint}
            meta={fieldMeta}
            input={{
              id: fieldId,
              name: question.id,
              type: 'number',
              value: stringValue,
              inputMode: 'numeric',
              onChange: handleTextChange(question),
              required: question.required,
              'aria-describedby': hint ? `${fieldId}-hint` : undefined
            }}
          >
            {question.label}
          </InputField>
        );
      case 'date': {
        const dateValue = normaliseDateAnswer(value);
        return (
          <DateField
            errorText={error}
            hintText={hintContent}
            inputNames={{
              day: `${fieldId}-day`,
              month: `${fieldId}-month`,
              year: `${fieldId}-year`
            }}
            inputs={{
              day: {
                id: `${fieldId}-day`,
                name: `${question.id}-day`,
                inputMode: 'numeric',
                pattern: '[0-9]*'
              },
              month: {
                id: `${fieldId}-month`,
                name: `${question.id}-month`,
                inputMode: 'numeric',
                pattern: '[0-9]*'
              },
              year: {
                id: `${fieldId}-year`,
                name: `${question.id}-year`,
                inputMode: 'numeric',
                pattern: '[0-9]*'
              }
            }}
            input={{
              value: dateValue,
              onChange: handleDateChange(question)
            }}
          >
            {question.label}
          </DateField>
        );
      }
      default:
        return (
          <InputField
            hint={hint}
            meta={fieldMeta}
            input={{
              id: fieldId,
              name: question.id,
              value: stringValue,
              onChange: handleTextChange(question),
              required: question.required,
              'aria-describedby': hint ? `${fieldId}-hint` : undefined
            }}
          >
            {question.label}
          </InputField>
        );
    }
  };

  const errorEntries = Object.entries(errors);

  const errorSummaryItems = errorEntries.map(([questionId, message]) => {
    const question = step.questions.find((item) => item.id === questionId);
    const fieldId = fieldIds.get(questionId) ?? questionId;
    const targetName = question?.type === 'date' ? `${fieldId}-day` : fieldId;

    return {
      targetName,
      text: message
    };
  });

  const pageDescription = step.page?.description
    ? step.page.description
    : step.questions.length > 1
      ? 'Answer these questions to continue.'
      : 'Answer this question to continue.';

  return (
    <form onSubmit={handleSubmit} noValidate>
      {errorSummaryItems.length > 0 && (
        <ErrorSummary errors={errorSummaryItems} onHandleErrorClick={handleErrorClick} />
      )}
      {step.page?.title && <H2>{step.page.title}</H2>}
      {pageDescription && <Paragraph>{pageDescription}</Paragraph>}
      {step.page?.hint && <HintText>{step.page.hint}</HintText>}
      {step.questions.map((question) => (
        <div key={question.id}>{renderField(question)}</div>
      ))}
      <Button type="submit">Continue</Button>
    </form>
  );
};
