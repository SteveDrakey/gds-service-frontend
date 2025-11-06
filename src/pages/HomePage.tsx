import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import styled from 'styled-components';
import {
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

const ServiceLinkCard = styled(RouterLink)`
  border: 1px solid #b1b4b6;
  border-left: 5px solid #1d70b8;
  padding: 1.5rem;
  background: #ffffff;
  display: grid;
  gap: 1rem;
  text-decoration: none;
  color: inherit;
  transition: border-left-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-left-color: #0b0c0c;
    box-shadow: 0 2px 0 #0b0c0c;
  }

  &:focus {
    outline: 3px solid #ffbf47;
    outline-offset: 0;
  }
`;

const SearchContainer = styled.div`
  margin-top: 2rem;
`;

const SearchLabel = styled.label`
  display: block;
  font-weight: bold;
  font-size: 1.1875rem;
  margin-bottom: 0.5rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1.25rem;
  border: 2px solid #0b0c0c;
  border-radius: 0;
  box-shadow: inset 0 1px 0 rgba(11, 12, 12, 0.25);

  &:focus {
    outline: 3px solid #ffbf47;
    outline-offset: 0;
  }
`;

export const HomePage = () => {
  const { services, loading, error } = useServiceDefinitions();
  const [query, setQuery] = useState('');

  const filteredServices = services.filter((service) => {
    if (!query.trim()) {
      return true;
    }

    const haystack = `${service.name} ${service.summary ?? ''}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

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
      <SearchContainer>
        <SearchLabel htmlFor="service-search">Search services</SearchLabel>
        <SearchInput
          id="service-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or summary"
        />
      </SearchContainer>
      {loading ? (
        <Paragraph>Loading services…</Paragraph>
      ) : (
        <ServiceList>
          {filteredServices.map((service) => (
            <ServiceLinkCard to={`/services/${service.slug}/questions/0`} key={service.slug}>
              <H2>{service.name}</H2>
              {service.summary && <Paragraph>{service.summary}</Paragraph>}
              {service.source === 'fallback' && <Tag tint="YELLOW">Fallback data</Tag>}
            </ServiceLinkCard>
          ))}
          {!filteredServices.length && !loading && (
            <Paragraph>We couldn't find any services matching that search.</Paragraph>
          )}
        </ServiceList>
      )}
    </div>
  );
};
