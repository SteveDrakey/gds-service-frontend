import { ReactNode } from 'react';
import { Link as RouterLink, useLocation, useParams } from 'react-router-dom';
import styled from 'styled-components';
import {
  BackLink,
  H1,
  InsetText,
  ListItem,
  OrderedList,
  Paragraph,
  Tag,
  WarningText
} from 'govuk-react';
import { useServiceForm } from '../state/ServiceFormContext';

const StepList = styled(OrderedList)`
  margin-bottom: 2rem;
`;

const StepItem = styled(ListItem)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: ${({ $active }) => ($active ? 'bold' : 'normal')};
`;

const StepLink = styled(RouterLink)`
  color: inherit;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

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

  const steps = [
    ...service.questions.map((question, index) => ({
      path: `questions/${index}`,
      label: question.label
    })),
    { path: 'summary', label: 'Check answers' }
  ];

  const activeIndex = steps.findIndex((step) => step.path === relativePath);
  const previousPath =
    activeIndex > 0 ? `${basePath}/${steps[activeIndex - 1].path}` : activeIndex === -1 ? basePath : '/';

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
      <nav aria-label="Service steps">
        <StepList>
          {steps.map((step, index) => {
            const stepHref = `${basePath}/${step.path}`;
            const isActive = step.path === relativePath;
            const isComplete = activeIndex > index;

            return (
              <StepItem key={step.path} $active={isActive}>
                {(isActive || isComplete) && (
                  <Tag tint={isActive ? 'BLUE' : 'GREEN'}>{isActive ? 'In progress' : 'Done'}</Tag>
                )}
                <StepLink to={stepHref} aria-current={isActive ? 'step' : undefined}>
                  {index + 1}. {step.label}
                </StepLink>
              </StepItem>
            );
          })}
        </StepList>
      </nav>
      {children}
    </Section>
  );
};
