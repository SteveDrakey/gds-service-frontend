import { Link as RouterLink } from 'react-router-dom';
import { H1, Paragraph, Button } from 'govuk-react';

export const NotFoundPage = () => (
  <div>
    <H1>Page not found</H1>
    <Paragraph>
      If you typed the web address, check it is correct. You can also return to the start of this prototype and
      follow the journey again.
    </Paragraph>
    <Button as={RouterLink} to="/">
      Go back to the overview
    </Button>
  </div>
);
