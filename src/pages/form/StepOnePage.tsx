import { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, InputField, Paragraph, HintText } from 'govuk-react';
import { useFormData } from '../../state/FormContext';

export const StepOnePage = () => {
  const { data, update } = useFormData();
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate('/apply/service');
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Paragraph>
        We only ask for details we need at this stage. You can change any answer later before submitting.
      </Paragraph>
      <InputField
        input={{
          name: 'fullName',
          value: data.fullName,
          onChange: (event) => update({ fullName: event.target.value }),
          required: true
        }}
      >
        Full name
      </InputField>
      <InputField
        hint={
          <HintText>We use your email to send research updates about the prototype. No marketing spam.</HintText>
        }
        input={{
          name: 'email',
          type: 'email',
          value: data.email,
          onChange: (event) => update({ email: event.target.value }),
          required: true,
          spellCheck: false
        }}
      >
        Email address
      </InputField>
      <Button type="submit">Continue</Button>
    </form>
  );
};
