import { H1, H2, Paragraph, OrderedList, ListItem, SectionBreak, InsetText, Link as GovLink } from 'govuk-react';

export const AboutGdsPage = () => (
  <div>
    <H1>What makes something feel GOV.UK?</H1>
    <Paragraph>
      The Government Digital Service (GDS) sets the standard for how services should look, feel and behave. The
      aim is consistency, clarity and trust. This project bakes in the defaults so delivery teams can focus on
      user needs rather than pixel math.
    </Paragraph>
    <H2>Key ingredients</H2>
    <OrderedList>
      <ListItem>
        <strong>Design tokens and typography.</strong> GOV.UK colours, spacing and the Transport typeface are
        enforced through <code>govuk-react</code> and <code>govuk-frontend</code> imports.
      </ListItem>
      <ListItem>
        <strong>Language and content.</strong> Headings, lead paragraphs and hint text follow the Service Manual
        rules for plain English and task-focused writing.
      </ListItem>
      <ListItem>
        <strong>Accessible components.</strong> Form controls use GOV.UK patterns with built-in labels, hint text
        and error handling.
      </ListItem>
      <ListItem>
        <strong>Structured journeys.</strong> Multi-page forms keep steps short, provide back links and end with a
        “Check your answers” page to avoid surprises.
      </ListItem>
    </OrderedList>
    <SectionBreak level="LARGE" visible />
    <H2>Always validate with users</H2>
    <Paragraph>
      GDS stresses research, iteration and accessibility. Components help, but the Service Standard requires
      multidisciplinary teams, inclusive research and operational readiness.
    </Paragraph>
    <GovLink href="https://www.gov.uk/service-manual/service-standard">Read the 14 points.</GovLink>
    <InsetText>
      Need a refresher? Browse the <GovLink href="https://design-system.service.gov.uk">Design System</GovLink>{' '}
      and <GovLink href="https://www.gov.uk/service-manual">Service Manual</GovLink> for detailed examples.
    </InsetText>
  </div>
);
