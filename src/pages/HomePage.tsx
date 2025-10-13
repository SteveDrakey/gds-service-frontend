import { Link as RouterLink } from 'react-router-dom';
import {
  Button,
  H1,
  H2,
  LeadParagraph,
  Paragraph,
  InsetText,
  UnorderedList,
  ListItem,
  GridRow,
  GridCol
} from 'govuk-react';

export const HomePage = () => (
  <div>
    <H1>Opinionated GOV.UK starter</H1>
    <LeadParagraph>
      This Vite + React example shows how to structure a small service so that every page honours the
      GOV.UK Design System (GDS) and Service Standard.
    </LeadParagraph>
    <GridRow>
      <GridCol setWidth="two-thirds">
        <Paragraph>
          {[
            'The layout, typography and components all come from `govuk-react` and `govuk-frontend`.',
            'The goal is to demonstrate the golden path: start with research, express content in plain English, and build an accessible multi-step form.'
          ].join(' ')}
        </Paragraph>
        <Paragraph>
          Use the navigation to explore how the GDS principles are applied. When you are ready, work through the
          sample application form to see progressive disclosure in action.
        </Paragraph>
        <Button as={RouterLink} to="/apply">
          Start the sample form
        </Button>
      </GridCol>
      <GridCol setWidth="one-third">
        <InsetText>
          <strong>Why Vite?</strong> Fast builds and instant feedback make it easier to iterate quickly while
          collaborating with designers and researchers.
        </InsetText>
      </GridCol>
    </GridRow>
    <H2>GDS in practice</H2>
    <UnorderedList>
      <ListItem>Use real user needs to frame every piece of content.</ListItem>
      <ListItem>Design journeys that support accessibility from the first sketch.</ListItem>
      <ListItem>Keep forms short, confirm answers, and avoid hidden validation surprises.</ListItem>
    </UnorderedList>
    <Paragraph>
      {[
        'The GOV.UK Design System is more than styles. It is an agreement about language, accessibility, usability and inclusive patterns.',
        'Read the guidance whenever you introduce new journeys: [design-system.service.gov.uk](https://design-system.service.gov.uk).'
      ].join(' ')}
    </Paragraph>
  </div>
);
