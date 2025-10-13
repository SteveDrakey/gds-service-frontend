import { Outlet, useLocation, Link as RouterLink } from 'react-router-dom';
import styled from 'styled-components';
import {
  BackLink,
  H1,
  OrderedList,
  ListItem,
  Tag,
  Paragraph,
  InsetText
} from 'govuk-react';

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

const steps = [
  { path: '/apply', label: 'Your details' },
  { path: '/apply/service', label: 'Service background' },
  { path: '/apply/check', label: 'Check answers' }
];

export const FormLayout = () => {
  const location = useLocation();
  const activeIndex = steps.findIndex((step) => location.pathname === step.path);
  const previousStep = activeIndex > 0 ? steps[activeIndex - 1] : undefined;

  return (
    <Section aria-labelledby="form-title">
      {previousStep && (
        <BackLink as={RouterLink} to={previousStep.path} data-testid="form-back-link">
          Back
        </BackLink>
      )}
      <H1 id="form-title">Apply to test a new government service</H1>
      <InsetText>
        This 3-step form mirrors the GOV.UK pattern: gather essentials, confirm context, then ask the user to
        check their answers before submission.
      </InsetText>
      <nav aria-label="Application steps">
        <StepList>
          {steps.map((step, index) => {
            const isActive = location.pathname === step.path;
            const isComplete = activeIndex > index;

            return (
              <StepItem key={step.path} $active={isActive}>
                {(isActive || isComplete) && (
                  <Tag tint={isActive ? 'BLUE' : 'GREEN'}>{isActive ? 'In progress' : 'Done'}</Tag>
                )}
                <StepLink to={step.path} aria-current={isActive ? 'step' : undefined}>
                  {index + 1}. {step.label}
                </StepLink>
              </StepItem>
            );
          })}
        </StepList>
      </nav>
      <Paragraph>
        All pages share a single piece of form state so that the answers can be reviewed and edited without
        losing progress.
      </Paragraph>
      <Outlet />
    </Section>
  );
};
