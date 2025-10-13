import YAML from 'yaml';
import { extractServicesFromOpenApi } from '../utils/serviceExtraction';
import type { ServiceDefinition } from '../types/service';
import fallbackSpecification from './fallback-openapi.v31.yaml?raw';

const manualFallbackServices: ServiceDefinition[] = [
  {
    slug: 'create-missed-bin-servicerequest',
    name: 'Report a missed bin',
    summary: 'Use this service to report a missed bin',
    source: 'fallback',
    questions: [
      {
        id: 'contact.first-name',
        label: 'First name',
        type: 'text',
        required: false
      },
      {
        id: 'contact.last-name',
        label: 'Last name',
        type: 'text',
        required: false
      },
      {
        id: 'contact.email',
        label: 'Email address',
        type: 'text',
        required: false
      },
      {
        id: 'contact.telephone',
        label: 'Telephone number',
        type: 'text',
        required: false
      },
      {
        id: 'contact.dob',
        label: 'Date of birth',
        description: 'For example, 31/03/1970',
        type: 'text',
        required: false
      },
      {
        id: 'contact.address',
        label: 'Home address',
        type: 'textarea',
        required: false
      },
      {
        id: 'bin-type',
        label: 'Which bin was missed?',
        type: 'select',
        options: [
          { value: 'Black', label: 'Black' },
          { value: 'Green', label: 'Green' },
          { value: 'Brown', label: 'Brown' }
        ],
        required: false
      },
      {
        id: 'address',
        label: 'Address of the missed bin',
        type: 'textarea',
        required: true
      },
      {
        id: 'date',
        label: 'Date of missed collection',
        type: 'text',
        required: true
      },
      {
        id: 'case.title',
        label: 'Case title',
        type: 'text',
        required: true
      },
      {
        id: 'case.ticketnumber',
        label: 'External reference number',
        type: 'text',
        required: false
      },
      {
        id: 'case.description',
        label: 'Notes',
        type: 'textarea',
        required: false
      }
    ]
  },
  {
    slug: 'create-report-asb-servicerequest',
    name: 'Report anti-social behaviour',
    summary: 'Use this service to report anti-social behaviour',
    source: 'fallback',
    questions: [
      {
        id: 'reported-by-name',
        label: 'Reporting contact',
        type: 'text',
        required: true
      },
      {
        id: 'report-against-name',
        label: 'Reported contact (if known)',
        type: 'text',
        required: false
      },
      {
        id: 'address',
        label: 'Address of reported behaviour',
        type: 'textarea',
        required: true
      },
      {
        id: 'notes',
        label: 'Notes',
        type: 'textarea',
        required: true
      }
    ]
  }
];

const buildFallbackServices = (): ServiceDefinition[] => {
  try {
    const parsed = YAML.parse(fallbackSpecification);
    const services = extractServicesFromOpenApi(parsed).map((service) => ({
      ...service,
      source: 'fallback' as const
    }));

    if (services.length === 0) {
      console.warn('The bundled fallback OpenAPI specification did not yield any services.');
      return manualFallbackServices;
    }

    return services;
  } catch (error) {
    console.error('Failed to parse the bundled fallback OpenAPI specification.', error);
    return manualFallbackServices;
  }
};

export const fallbackServices = buildFallbackServices();
