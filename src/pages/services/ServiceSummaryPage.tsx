import { Button, H2, H3, InsetText, Link, Paragraph, VisuallyHidden } from 'govuk-react';
import styled from 'styled-components';
import { Link as RouterLink } from 'react-router-dom';
import { useServiceForm } from '../../state/ServiceFormContext';
import type { DateAnswerValue, ServiceQuestion } from '../../types/service';

const SummaryList = styled.dl`
  margin: 0 0 2rem;
  border-top: 1px solid #b1b4b6;
`;

const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 35%) minmax(0, 1fr) auto;
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

const SummaryActions = styled.dd`
  margin: 0;
  justify-self: end;
`;

const ChangeLink = styled(Link).attrs({ as: RouterLink })`
  display: inline-block;
`;

const isDateAnswer = (value: unknown): value is DateAnswerValue =>
  Boolean(value) && typeof value === 'object' &&
  ('day' in (value as Record<string, unknown>) ||
    'month' in (value as Record<string, unknown>) ||
    'year' in (value as Record<string, unknown>));

const formatDate = (value: DateAnswerValue) => {
  const day = value.day?.trim();
  const month = value.month?.trim();
  const year = value.year?.trim();

  if (!day || !month || !year) {
    return 'Not provided';
  }

  const paddedDay = day.padStart(2, '0');
  const paddedMonth = month.padStart(2, '0');
  const paddedYear = year.padStart(4, '0');
  const isoString = `${paddedYear}-${paddedMonth}-${paddedDay}`;
  const parsed = new Date(isoString);

  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(parsed);
  }

  return `${paddedDay}/${paddedMonth}/${paddedYear}`;
};

const formatAnswer = (value: unknown, question: ServiceQuestion) => {
  if (question.type === 'checkbox') {
    return value === true ? 'Yes' : 'No';
  }

  if (question.type === 'date') {
    return isDateAnswer(value) ? formatDate(value) : 'Not provided';
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    return 'Not provided';
  }

  if (question.type === 'select' && question.options) {
    const match = question.options.find((option) => option.value === value);
    return match ? match.label : value;
  }

  return value;
};

export const ServiceSummaryPage = () => {
  const { service, answers } = useServiceForm();

  const pageOrder = service.pages
    ? [...service.pages].sort((a, b) => {
        const orderA = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
        const orderB = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.title.localeCompare(b.title);
      })
    : [];

  const groupedQuestions = pageOrder.length
    ? [
        ...pageOrder
          .map((page) => ({
            page,
            questions: service.questions.filter((question) => question.pageId === page.id)
          }))
          .filter((group) => group.questions.length > 0),
        {
          page: undefined,
          questions: service.questions.filter((question) =>
            !question.pageId || !pageOrder.some((page) => page.id === question.pageId)
          )
        }
      ].filter((group) => group.questions.length > 0)
    : [{ page: undefined, questions: service.questions }];

  return (
    <form onSubmit={(event) => event.preventDefault()} noValidate>
      <H2>Check your answers before submitting</H2>
      <Paragraph>Make sure the information below is correct. Use the change links to update any answers.</Paragraph>
      {groupedQuestions.map((group, groupIndex) => (
        <section key={group.page?.id ?? `summary-group-${groupIndex}`}>
          {group.page && (
            <>
              <H3>{group.page.title}</H3>
              {group.page.description && <Paragraph>{group.page.description}</Paragraph>}
            </>
          )}
          <SummaryList>
            {group.questions.map((question) => {
              const questionIndex = service.questions.indexOf(question);
              return (
                <SummaryRow key={question.id}>
                  <SummaryKey>{question.label}</SummaryKey>
                  <SummaryValue>{formatAnswer(answers[question.id], question)}</SummaryValue>
                  <SummaryActions>
                    <ChangeLink to={`../questions/${questionIndex}`}>
                      Change
                      <VisuallyHidden> {question.label}</VisuallyHidden>
                    </ChangeLink>
                  </SummaryActions>
                </SummaryRow>
              );
            })}
          </SummaryList>
        </section>
      ))}
      <InsetText>
        Submitting is not wired up in this prototype. Connect the submit button to your API once the service is ready.
      </InsetText>
      <Button type="button">Submit</Button>
    </form>
  );
};
