import { FormEvent, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Button, Panel, Paragraph, Table, HintText, InsetText, Link as GovLink } from 'govuk-react';
import { useFormData, type ApplicationFormData } from '../../state/FormContext';

const summaryFields: Array<{
  key: keyof ApplicationFormData;
  label: string;
  changePath: string;
}> = [
  { key: 'fullName', label: 'Full name', changePath: '/apply' },
  { key: 'email', label: 'Email address', changePath: '/apply' },
  { key: 'organisation', label: 'Organisation', changePath: '/apply/service' },
  { key: 'role', label: 'Role on the team', changePath: '/apply/service' },
  { key: 'serviceSummary', label: 'Service description', changePath: '/apply/service' }
];

export const ReviewPage = () => {
  const { data, reset } = useFormData();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    reset();
  };

  if (submitted) {
    return (
      <div>
        <Panel title="Application submitted">We will contact you within 2 working days.</Panel>
        <Paragraph>
          In a real service you would persist the data and show a unique reference. This demo clears the
          in-memory state to prove that steps share data safely.
        </Paragraph>
        <Button as={RouterLink} to="/">
          Return to the overview
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Paragraph>
        Check the information before sending your request. Use the Change links if you need to edit an answer.
      </Paragraph>
      <InsetText>
        Every GOV.UK form should include this review step so that people can correct mistakes without submitting
        another request.
      </InsetText>
      <Table caption="Your answers">
        {summaryFields.map((field) => (
          <Table.Row key={field.key as string}>
            <Table.CellHeader scope="row">{field.label}</Table.CellHeader>
            <Table.Cell>{data[field.key] || 'Not provided'}</Table.Cell>
            <Table.Cell>
              <GovLink as={RouterLink} to={field.changePath}>
                Change
              </GovLink>
            </Table.Cell>
          </Table.Row>
        ))}
        <Table.Row>
          <Table.CellHeader scope="row">Understands standards</Table.CellHeader>
          <Table.Cell>
            {data.understoodStandards ? 'Yes — standards reviewed' : 'No, needs to review guidance'}
          </Table.Cell>
          <Table.Cell>
            <GovLink as={RouterLink} to="/apply/service">
              Change
            </GovLink>
          </Table.Cell>
        </Table.Row>
      </Table>
      <HintText>
        Submitting will clear this prototype form. In production you would save the answers to a secure backend.
      </HintText>
      <Button type="submit">Submit application</Button>
    </form>
  );
};
