import { ReactNode } from 'react';
import { Link as RouterLink, useLocation, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { BackLink, H1, InsetText, Paragraph, WarningText } from 'govuk-react';
import { useServiceForm } from '../state/ServiceFormContext';

const Section = styled.section`
  display: grid;
  gap: 1.5rem;
`;

interface ServiceFormLayoutProps {
  specificationError?: string;
  children: ReactNode;
}

export const ServiceFormLayout = ({ specificationError, children }: ServiceFormLayoutProps) => {
  const { service } = useServiceForm();
  const { serviceSlug } = useParams<{ serviceSlug: string }>();
  const location = useLocation();

  const basePath = `/services/${serviceSlug}`;
  const relativePath = location.pathname.startsWith(`${basePath}/`)
    ? location.pathname.slice(basePath.length + 1)
    : '';
  const questionMatch = relativePath.match(/^questions\/(\d+)$/);
  const currentQuestionIndex = questionMatch ? Number(questionMatch[1]) : undefined;

  let previousPath = '/';

  if (relativePath === 'summary') {
    previousPath =
      service.questions.length > 0
        ? `${basePath}/questions/${service.questions.length - 1}`
        : basePath;
  } else if (typeof currentQuestionIndex === 'number') {
    previousPath = currentQuestionIndex > 0 ? `${basePath}/questions/${currentQuestionIndex - 1}` : '/';
  } else {
    previousPath = basePath;
  }

  return (
    <Section aria-labelledby="service-form-title">
      <BackLink as={RouterLink} to={previousPath} data-testid="service-form-back-link">
        Back
      </BackLink>
      <H1 id="service-form-title">{service.name}</H1>
      {service.summary && <Paragraph>{service.summary}</Paragraph>}
      <InsetText>
        These questions are generated directly from the OpenAPI specification so each service keeps a single
        source of truth.
      </InsetText>
      {specificationError && (
        <WarningText>
          We could not reach the live specification. Showing the fallback definition instead.
        </WarningText>
      )}
      {children}
    </Section>
  );
};
