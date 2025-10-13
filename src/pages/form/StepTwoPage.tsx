import { FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, InputField, TextArea, HintText, Paragraph, Checkbox } from 'govuk-react';
import { useFormData } from '../../state/FormContext';

export const StepTwoPage = () => {
  const { data, update } = useFormData();
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate('/apply/check');
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Paragraph>
        Tell us a little about the organisation and service context so a designer can assess if the prototype is
        ready for research.
      </Paragraph>
      <InputField
        input={{
          name: 'organisation',
          value: data.organisation,
          onChange: (event) => update({ organisation: event.target.value }),
          required: true
        }}
      >
        Organisation name
      </InputField>
      <InputField
        hint={<HintText>For example “Service designer”, “Policy lead” or “Product manager”.</HintText>}
        input={{
          name: 'role',
          value: data.role,
          onChange: (event) => update({ role: event.target.value }),
          required: true
        }}
      >
        Your role on the team
      </InputField>
      <TextArea
        hint={<HintText>Keep this short. Focus on the user problem and the decisions you want to test.</HintText>}
        input={{
          name: 'serviceSummary',
          rows: 6,
          value: data.serviceSummary,
          onChange: (event) => update({ serviceSummary: event.target.value }),
          required: true
        }}
      >
        Describe the service or hypothesis
      </TextArea>
      <Checkbox
        checked={data.understoodStandards}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          update({ understoodStandards: event.target.checked })
        }
        hint="Confirm you have reviewed the GDS guidance"
      >
        I have reviewed the Service Standard and the research ethics guidance.
      </Checkbox>
      <Button type="submit">Continue to check answers</Button>
    </form>
  );
};
