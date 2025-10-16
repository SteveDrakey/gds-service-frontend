import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Checkbox,
  DateField,
  ErrorSummary,
  ErrorText,
  HintText,
  InputField,
  Paragraph,
  Select,
  TextArea
} from 'govuk-react';
import { useServiceForm } from '../../state/ServiceFormContext';
import type { DateAnswerValue, ServiceQuestion } from '../../types/service';

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

  if (Number.isNaN(stepIndex)) {
    return <Navigate to="." replace />;
  }

  const question = service.questions[stepIndex];

  if (!question) {
    return <Navigate to="../questions/0" replace />;
  }

  const value = answers[question.id];
  const [error, setError] = useState<string>();
  const fieldId = useMemo(() => normaliseId(question.id, `question-${stepIndex + 1}`), [question.id, stepIndex]);

  const isLastStep = stepIndex === service.questions.length - 1;
  const targetId = question.type === 'date' ? `${fieldId}-day` : fieldId;

  const hint = useMemo(
    () => (question.description ? <HintText id={`${fieldId}-hint`}>{question.description}</HintText> : undefined),
    [fieldId, question.description]
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isComplete(question, answers[question.id])) {
      setError(getErrorMessage(question));
      return;
    }

    setError(undefined);

    if (isLastStep) {
      navigate('../summary');
    } else {
      navigate(`../questions/${stepIndex + 1}`);
    }
  };

  const handleTextChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setError(undefined);
    updateAnswer(question.id, event.target.value);
  };

  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError(undefined);
    updateAnswer(question.id, event.target.checked);
  };

  const handleDateChange = (next: DateAnswerValue) => {
    setError(undefined);
    updateAnswer(question.id, {
      day: typeof next.day === 'string' ? next.day : '',
      month: typeof next.month === 'string' ? next.month : '',
      year: typeof next.year === 'string' ? next.year : ''
    });
  };

  const handleErrorClick = (targetName: string) => {
    const element = document.getElementById(targetName);
    if (element instanceof HTMLElement) {
      element.focus();
    }
  };

  const fieldMeta = useMemo(
    () => ({
      error,
      touched: Boolean(error)
    }),
    [error]
  );

  const renderField = () => {
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
              onChange: handleTextChange,
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
              onChange: handleTextChange,
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
          <>
            {error && <ErrorText>{error}</ErrorText>}
            <Checkbox
              id={fieldId}
              checked={value === true}
              onChange={handleCheckboxChange}
              hint={question.description}
            >
              {question.label}
            </Checkbox>
          </>
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
              onChange: handleTextChange,
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
            hintText={question.description}
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
              onChange: handleDateChange
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
              onChange: handleTextChange,
              required: question.required,
              'aria-describedby': hint ? `${fieldId}-hint` : undefined
            }}
          >
            {question.label}
          </InputField>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <ErrorSummary
          errors={[
            {
              targetName: targetId,
              text: error
            }
          ]}
          onHandleErrorClick={handleErrorClick}
        />
      )}
      <Paragraph>Answer this question to continue.</Paragraph>
      {renderField()}
      <Button type="submit">Continue</Button>
    </form>
  );
};
