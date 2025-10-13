import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import YAML from 'yaml';
import type { ServiceDefinition } from '../types/service';
import { extractServicesFromOpenApi, SERVICE_SPEC_URL } from '../utils/serviceExtraction';
import { fallbackServices } from './fallbackServices';

interface ServiceDefinitionsContextValue {
  services: ServiceDefinition[];
  loading: boolean;
  error?: string;
  refresh: () => Promise<void>;
  getService: (slug: string) => ServiceDefinition | undefined;
}

const ServiceDefinitionsContext = createContext<ServiceDefinitionsContextValue | undefined>(undefined);

const parseSpec = (raw: string) => {
  try {
    return YAML.parse(raw);
  } catch (yamlError) {
    try {
      return JSON.parse(raw);
    } catch (jsonError) {
      throw yamlError;
    }
  }
};

export const ServiceDefinitionsProvider = ({ children }: { children: ReactNode }) => {
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const abortController = useRef<AbortController | null>(null);

  const load = async () => {
    setLoading(true);
    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;

    try {
      const response = await fetch(SERVICE_SPEC_URL, {
        headers: { Accept: 'application/yaml, application/json' },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Failed to load OpenAPI specification (status ${response.status})`);
      }

      const rawSpec = await response.text();
      const spec = parseSpec(rawSpec);
      const extractedServices = extractServicesFromOpenApi(spec);

      if (extractedServices.length === 0) {
        throw new Error('The specification did not contain any service definitions.');
      }

      setServices(extractedServices);
      setError(undefined);
    } catch (specError) {
      console.error('Failed to load OpenAPI specification', specError);
      setServices(fallbackServices);
      setError(
        specError instanceof Error
          ? specError.message
          : 'Unable to load the OpenAPI specification for this service.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => abortController.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<ServiceDefinitionsContextValue>(
    () => ({
      services,
      loading,
      error,
      refresh: load,
      getService: (slug: string) => services.find((service) => service.slug === slug)
    }),
    [services, loading, error]
  );

  return <ServiceDefinitionsContext.Provider value={value}>{children}</ServiceDefinitionsContext.Provider>;
};

export const useServiceDefinitions = () => {
  const context = useContext(ServiceDefinitionsContext);
  if (!context) {
    throw new Error('useServiceDefinitions must be used within a ServiceDefinitionsProvider');
  }
  return context;
};
