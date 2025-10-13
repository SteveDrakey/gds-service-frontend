import { Button, H2, InsetText, Paragraph } from 'govuk-react';
import styled from 'styled-components';
import { useServiceForm } from '../../state/ServiceFormContext';

const SummaryList = styled.dl`
  margin: 0 0 2rem;
  border-top: 1px solid #b1b4b6;
`;

const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 35%) minmax(0, 1fr);
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #b1b4b6;
`;

const SummaryKey = styled.dt`
  margin: 0;
  font-weight: bold;
`;

const SummaryValue = styled.dd`
  margin: 0;
  white-space: pre-wrap;
`;

const formatAnswer = (value: unknown, type: string, options?: { value: string; label: string }[]) => {
  if (type === 'checkbox') {
    return value === true ? 'Yes' : 'No';
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    return 'Not provided';
  }

  if (type === 'select' && options) {
    const match = options.find((option) => option.value === value);
    return match ? match.label : value;
  }

  return value;
};

export const ServiceSummaryPage = () => {
  const { service, answers } = useServiceForm();

  return (
    <form onSubmit={(event) => event.preventDefault()} noValidate>
      <H2>Check your answers before submitting</H2>
      <Paragraph>
        Make sure the information below is correct. Use the step navigation to change any answers that need
        updating.
      </Paragraph>
      <SummaryList>
        {service.questions.map((question) => (
          <SummaryRow key={question.id}>
            <SummaryKey>{question.label}</SummaryKey>
            <SummaryValue>{formatAnswer(answers[question.id], question.type, question.options)}</SummaryValue>
          </SummaryRow>
        ))}
      </SummaryList>
      <InsetText>
        Submitting is not wired up in this prototype. Connect the submit button to your API once the service is
        ready.
      </InsetText>
      <Button type="button">Submit</Button>
    </form>
  );
};
