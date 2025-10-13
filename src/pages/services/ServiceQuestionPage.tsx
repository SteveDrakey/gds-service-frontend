import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Checkbox,
  ErrorText,
  HintText,
  InputField,
  Paragraph,
  Select,
  TextArea
} from 'govuk-react';
import { useServiceForm } from '../../state/ServiceFormContext';
import type { ServiceQuestion } from '../../types/service';

const isComplete = (question: ServiceQuestion, value: unknown) => {
  if (!question.required) {
    return true;
  }

  if (question.type === 'checkbox') {
    return value === true;
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

  const isLastStep = stepIndex === service.questions.length - 1;
  const buttonLabel = isLastStep ? 'Review your answers' : 'Save and continue';

  const hint = useMemo(
    () => (question.description ? <HintText>{question.description}</HintText> : undefined),
    [question.description]
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

  const renderField = () => {
    const stringValue = typeof value === 'string' ? value : '';

    switch (question.type) {
      case 'textarea':
        return (
          <TextArea
            hint={hint}
            input={{
              name: question.id,
              value: stringValue,
              rows: 6,
              onChange: handleTextChange,
              required: question.required
            }}
          >
            {question.label}
          </TextArea>
        );
      case 'select':
        return (
          <Select
            label={question.label}
            hint={question.description}
            input={{
              name: question.id,
              value: stringValue,
              onChange: handleTextChange,
              required: question.required
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
          <Checkbox
            checked={value === true}
            onChange={handleCheckboxChange}
            hint={question.description}
          >
            {question.label}
          </Checkbox>
        );
      case 'number':
        return (
          <InputField
            hint={hint}
            input={{
              name: question.id,
              type: 'number',
              value: stringValue,
              inputMode: 'numeric',
              onChange: handleTextChange,
              required: question.required
            }}
          >
            {question.label}
          </InputField>
        );
      default:
        return (
          <InputField
            hint={hint}
            input={{
              name: question.id,
              value: stringValue,
              onChange: handleTextChange,
              required: question.required
            }}
          >
            {question.label}
          </InputField>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <ErrorText>{error}</ErrorText>}
      <Paragraph>
        Answer this question to continue. You can review and change your responses on the next screen.
      </Paragraph>
      {renderField()}
      <Button type="submit">{buttonLabel}</Button>
    </form>
  );
};
