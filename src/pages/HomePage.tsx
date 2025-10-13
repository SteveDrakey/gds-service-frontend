import { Link as RouterLink } from 'react-router-dom';
import styled from 'styled-components';
import {
  Button,
  GridCol,
  GridRow,
  H1,
  H2,
  InsetText,
  LeadParagraph,
  Paragraph,
  Tag,
  WarningText
} from 'govuk-react';
import { useServiceDefinitions } from '../state/ServiceDefinitionsContext';

const ServiceList = styled.div`
  display: grid;
  gap: 2rem;
  margin-top: 2rem;
`;

const ServiceCard = styled.article`
  border: 1px solid #b1b4b6;
  border-left: 5px solid #1d70b8;
  padding: 1.5rem;
  background: #ffffff;
  display: grid;
  gap: 1rem;
`;

export const HomePage = () => {
  const { services, loading, error } = useServiceDefinitions();

  return (
    <div>
      <H1>Service catalogue</H1>
      <LeadParagraph>
        Each service listed below is inferred directly from the OpenAPI specification so product teams always
        work from the latest source of truth.
      </LeadParagraph>
      <GridRow>
        <GridCol setWidth="two-thirds">
          <Paragraph>
            Select a service to answer the questions one page at a time. The form follows GOV.UK Design System
            conventions for layout, spacing and language so users get a consistent experience.
          </Paragraph>
        </GridCol>
        <GridCol setWidth="one-third">
          <InsetText>
            The prototype fetches the OpenAPI document on load. Every time the definition changes, the questions
            update automatically without redeploying the frontend.
          </InsetText>
        </GridCol>
      </GridRow>
      {error && (
        <WarningText>
          {error} The fallback service definitions are shown below until the specification becomes available.
        </WarningText>
      )}
      {loading ? (
        <Paragraph>Loading services…</Paragraph>
      ) : (
        <ServiceList>
          {services.map((service) => (
            <ServiceCard key={service.slug}>
              <H2>{service.name}</H2>
              {service.summary && <Paragraph>{service.summary}</Paragraph>}
              {service.source === 'fallback' && <Tag tint="YELLOW">Fallback data</Tag>}
              <Button as={RouterLink} to={`/services/${service.slug}/questions/0`}>
                Start now
              </Button>
            </ServiceCard>
          ))}
        </ServiceList>
      )}
    </div>
  );
};
