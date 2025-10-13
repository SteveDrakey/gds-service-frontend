import { Navigate, Outlet, useParams } from 'react-router-dom';
import { Paragraph } from 'govuk-react';
import { ServiceFormProvider } from '../../state/ServiceFormContext';
import { useServiceDefinitions } from '../../state/ServiceDefinitionsContext';
import { ServiceFormLayout } from '../../layouts/ServiceFormLayout';

export const ServiceFormRoute = () => {
  const { serviceSlug } = useParams();
  const { loading, error, getService } = useServiceDefinitions();

  if (loading) {
    return <Paragraph>Loading service definition…</Paragraph>;
  }

  if (!serviceSlug) {
    return <Navigate to="/" replace />;
  }

  const service = getService(serviceSlug);

  if (!service) {
    return <Navigate to="/" replace />;
  }

  return (
    <ServiceFormProvider service={service}>
      <ServiceFormLayout specificationError={error}>
        <Outlet />
      </ServiceFormLayout>
    </ServiceFormProvider>
  );
};
