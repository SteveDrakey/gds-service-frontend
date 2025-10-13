import YAML from 'yaml';
import { extractServicesFromOpenApi } from '../utils/serviceExtraction';
import type { ServiceDefinition } from '../types/service';
import fallbackSpecification from './fallback-openapi.v31.yaml?raw';

const manualFallbackServices: ServiceDefinition[] = [
  {
    slug: 'research-session-request',
    name: 'Request support for a user research session',
    summary:
      'Share the essential context about your team and the users you want to speak to so that a researcher can help you plan the session.',
    source: 'fallback',
    questions: [
      {
        id: 'teamName',
        label: 'What is the name of your team?',
        type: 'text',
        required: true
      },
      {
        id: 'sessionGoal',
        label: 'Describe what you need to learn from this session',
        description:
          'Keep this to a short paragraph. Focus on the user needs or hypotheses you want to test so researchers can prioritise the work.',
        type: 'textarea',
        required: true
      },
      {
        id: 'preferredDate',
        label: 'When would you like the session to take place?',
        type: 'text',
        required: false
      },
      {
        id: 'remoteOrInPerson',
        label: 'How will you run the session?',
        type: 'select',
        options: [
          { value: 'remote', label: 'Remote (video call)' },
          { value: 'in-person', label: 'In person' },
          { value: 'hybrid', label: 'A mix of remote and in person' }
        ],
        required: true
      }
    ]
  },
  {
    slug: 'accessibility-clinic',
    name: 'Book an accessibility clinic',
    summary:
      'Tell us about the service or product you want to review. Accessibility specialists will use this to plan the clinic.',
    source: 'fallback',
    questions: [
      {
        id: 'serviceName',
        label: 'What is the name of the service?',
        type: 'text',
        required: true
      },
      {
        id: 'serviceStage',
        label: 'Which stage best describes your service?',
        type: 'select',
        options: [
          { value: 'discovery', label: 'Discovery' },
          { value: 'alpha', label: 'Alpha' },
          { value: 'beta', label: 'Beta' },
          { value: 'live', label: 'Live' }
        ],
        required: true
      },
      {
        id: 'hasResearch',
        label: 'Have you already run research with disabled people?',
        description: 'This helps the team understand what support you might need during the clinic.',
        type: 'checkbox',
        required: false
      },
      {
        id: 'contactEmail',
        label: 'Email address for the main contact',
        description: 'We will only use this to arrange the clinic and share accessibility advice afterwards.',
        type: 'text',
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
