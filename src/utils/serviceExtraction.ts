import type { ServiceDefinition, ServicePage, ServiceQuestion, ServiceQuestionOption } from '../types/service';

const SPEC_STATUS_KEYWORDS = ['status', 'health', 'todo', 'ping'];

const mapGdsFieldType = (value: unknown): ServiceQuestion['type'] | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalised = value.toLowerCase();

  switch (normalised) {
    case 'textarea':
    case 'longtext':
      return 'textarea';
    case 'select':
    case 'dropdown':
    case 'radio':
    case 'radios':
      return 'select';
    case 'checkbox':
      return 'checkbox';
    case 'date':
      return 'date';
    case 'number':
    case 'numeric':
      return 'number';
    case 'text':
    case 'string':
    case 'email':
    case 'tel':
    case 'telephone':
    case 'phone':
    case 'input':
      return 'text';
    default:
      return undefined;
  }
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

const sentenceCase = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (match) => match.toUpperCase());

const resolveRef = <T>(doc: unknown, maybeRef: unknown): T | undefined => {
  if (!maybeRef || typeof maybeRef !== 'object') {
    return maybeRef as T | undefined;
  }

  if ('$ref' in maybeRef) {
    const ref = (maybeRef as { $ref: string }).$ref;
    if (!ref?.startsWith('#/')) {
      return undefined;
    }

    const path = ref
      .slice(2)
      .split('/')
      .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'));

    let current: any = doc;
    for (const segment of path) {
      if (current && typeof current === 'object' && segment in current) {
        current = current[segment];
      } else {
        current = undefined;
        break;
      }
    }

    return resolveRef<T>(doc, current);
  }

  return maybeRef as T;
};

const mergeRequired = (a?: string[], b?: string[]) => {
  if (!a && !b) {
    return undefined;
  }
  return Array.from(new Set([...(a ?? []), ...(b ?? [])]));
};

const mergeSchemas = (base: any, addition: any) => {
  if (!addition) {
    return base;
  }

  const combined: any = { ...base, ...addition };

  if (base?.properties || addition?.properties) {
    combined.properties = {
      ...(base?.properties ?? {}),
      ...(addition?.properties ?? {})
    };
  }

  combined.required = mergeRequired(base?.required, addition?.required);

  if (base?.description && addition?.description && base.description !== addition.description) {
    combined.description = `${base.description}\n\n${addition.description}`;
  }

  return combined;
};

const resolveSchema = (doc: any, schema: any): any => {
  const resolved = resolveRef<any>(doc, schema);
  if (!resolved || typeof resolved !== 'object') {
    return resolved;
  }

  if (resolved.allOf) {
    const withoutAllOf = { ...resolved };
    delete withoutAllOf.allOf;
    return resolved.allOf
      .map((item: any) => resolveSchema(doc, item))
      .reduce((acc: any, item: any) => mergeSchemas(acc, item), resolveSchema(doc, withoutAllOf));
  }

  if (resolved.oneOf && Array.isArray(resolved.oneOf) && resolved.oneOf.length > 0) {
    return resolveSchema(doc, resolved.oneOf[0]);
  }

  if (resolved.anyOf && Array.isArray(resolved.anyOf) && resolved.anyOf.length > 0) {
    return resolveSchema(doc, resolved.anyOf[0]);
  }

  return resolved;
};

const inferQuestionType = (schema: any): ServiceQuestion['type'] => {
  if (!schema) {
    return 'text';
  }

  if (schema.enum) {
    return 'select';
  }

  if (schema.type === 'boolean') {
    return 'checkbox';
  }

  if (schema.format === 'date') {
    return 'date';
  }

  if (schema.type === 'number' || schema.type === 'integer') {
    return 'number';
  }

  if (schema.format === 'textarea' || schema.maxLength >= 200 || schema.type === 'array') {
    return 'textarea';
  }

  return 'text';
};

const buildOptions = (schema: any): ServiceQuestionOption[] | undefined => {
  if (!schema?.enum || !Array.isArray(schema.enum)) {
    return undefined;
  }

  const descriptions = Array.isArray(schema['x-enum-descriptions'])
    ? schema['x-enum-descriptions']
    : undefined;

  return schema.enum.map((value: unknown, index: number) => ({
    value: String(value),
    label:
      (descriptions && descriptions[index]) ||
      (typeof value === 'string' ? sentenceCase(value) : String(value))
  }));
};

const createQuestion = (
  id: string,
  key: string,
  schema: any,
  required: boolean
): ServiceQuestion | undefined => {
  if (!schema) {
    return undefined;
  }

  const gdsMeta = schema && typeof schema === 'object' ? (schema['x-gds'] as Record<string, unknown> | undefined) : undefined;

  const gdsType = mapGdsFieldType(gdsMeta?.fieldType);
  const type = gdsType ?? inferQuestionType(schema);

  if (type === 'select' && !schema.enum) {
    return undefined;
  }

  const question: ServiceQuestion = {
    id,
    label:
      (typeof gdsMeta?.title === 'string' && gdsMeta.title.trim().length > 0
        ? gdsMeta.title.trim()
        : undefined) ?? schema.title ?? sentenceCase(key),
    description: schema.description,
    hint:
      typeof gdsMeta?.hint === 'string' && gdsMeta.hint.trim().length > 0
        ? gdsMeta.hint.trim()
        : undefined,
    type,
    required: typeof gdsMeta?.required === 'boolean' ? gdsMeta.required : required
  };

  const options = buildOptions(schema);
  if (options && options.length > 0 && type === 'select') {
    question.options = options;
  }

  if (typeof gdsMeta?.errorMessage === 'string' && gdsMeta.errorMessage.trim().length > 0) {
    question.errorMessage = gdsMeta.errorMessage.trim();
  }

  if (typeof gdsMeta?.page === 'number') {
    question.page = gdsMeta.page;
  }

  if (typeof gdsMeta?.order === 'number') {
    question.order = gdsMeta.order;
  }

  return question;
};

const extractQuestions = (
  doc: any,
  schema: any,
  prefix: string[] = [],
  parentRequired?: string[]
): ServiceQuestion[] => {
  const resolved = resolveSchema(doc, schema);
  if (!resolved) {
    return [];
  }

  if (resolved.type !== 'object' || !resolved.properties) {
    if (prefix.length === 0) {
      return [];
    }
    const key = prefix[prefix.length - 1];
    const question = createQuestion(prefix.join('.'), key, resolved, Boolean(parentRequired?.includes(key)));
    return question ? [question] : [];
  }

  const questions: ServiceQuestion[] = [];
  const requiredList: string[] = resolved.required ?? [];

  Object.entries(resolved.properties).forEach(([key, propertySchema]: [string, any]) => {
    const propertyResolved = resolveSchema(doc, propertySchema);
    const nestedPrefix = [...prefix, key];
    const isRequired = requiredList.includes(key);

    if (propertyResolved?.type === 'object' && propertyResolved.properties) {
      questions.push(...extractQuestions(doc, propertyResolved, nestedPrefix, propertyResolved.required));
      return;
    }

    if (propertyResolved?.type === 'array' && propertyResolved.items) {
      const arrayItems = resolveSchema(doc, propertyResolved.items);
      if (arrayItems?.type === 'object' && arrayItems.properties) {
        questions.push(...extractQuestions(doc, arrayItems, nestedPrefix, arrayItems.required));
        return;
      }
    }

    const question = createQuestion(nestedPrefix.join('.'), key, propertyResolved, isRequired);
    if (question) {
      questions.push(question);
    }
  });

  return questions;
};

const isStatusOperation = (path: string, operation: any) => {
  const candidates: string[] = [];

  if (path) {
    candidates.push(path);
  }

  if (operation) {
    if (operation.summary) candidates.push(operation.summary);
    if (operation.operationId) candidates.push(operation.operationId);
    if (Array.isArray(operation.tags)) {
      candidates.push(...operation.tags);
    }
    if (operation['x-status']) candidates.push(operation['x-status']);
    if (operation['x-service-status']) candidates.push(operation['x-service-status']);
    if (operation['xServiceStatus']) candidates.push(operation['xServiceStatus']);
  }

  return candidates.some((value) =>
    SPEC_STATUS_KEYWORDS.some((keyword) => typeof value === 'string' && value.toLowerCase().includes(keyword))
  );
};

const resolveRequestBodySchema = (doc: any, requestBody: any) => {
  const resolvedBody = resolveSchema(doc, requestBody);
  if (!resolvedBody?.content || typeof resolvedBody.content !== 'object') {
    return undefined;
  }

  const jsonContent =
    resolvedBody.content['application/json'] ??
    resolvedBody.content['application/ld+json'] ??
    resolvedBody.content['application/vnd.api+json'] ??
    Object.values(resolvedBody.content)[0];

  if (!jsonContent || typeof jsonContent !== 'object') {
    return undefined;
  }

  return resolveSchema(doc, jsonContent.schema);
};

const deriveServiceName = (path: string, operation: any) => {
  if (operation?.summary) {
    return operation.summary;
  }
  if (operation?.tags && operation.tags.length > 0) {
    return sentenceCase(operation.tags[0]);
  }

  const segments = path.split('/').filter(Boolean);
  return sentenceCase(segments[segments.length - 1] ?? 'Service');
};

const sortQuestions = (questions: ServiceQuestion[], originalOrder: Map<string, number>) =>
  [...questions].sort((a, b) => {
    const pageA = typeof a.page === 'number' ? a.page : Number.POSITIVE_INFINITY;
    const pageB = typeof b.page === 'number' ? b.page : Number.POSITIVE_INFINITY;

    if (pageA !== pageB) {
      return pageA - pageB;
    }

    const orderA = typeof a.order === 'number' ? a.order : Number.POSITIVE_INFINITY;
    const orderB = typeof b.order === 'number' ? b.order : Number.POSITIVE_INFINITY;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    const originalA = originalOrder.get(a.id) ?? Number.POSITIVE_INFINITY;
    const originalB = originalOrder.get(b.id) ?? Number.POSITIVE_INFINITY;

    if (originalA !== originalB) {
      return originalA - originalB;
    }

    return a.label.localeCompare(b.label);
  });

const extractGdsPages = (operation: any, questions: ServiceQuestion[]): ServicePage[] | undefined => {
  const gdsMeta = operation && typeof operation === 'object' ? (operation['x-gds'] as any) : undefined;

  if (!gdsMeta || typeof gdsMeta !== 'object' || !Array.isArray(gdsMeta.pages)) {
    return undefined;
  }

  const questionMap = new Map(questions.map((question) => [question.id, question]));

  const pages: ServicePage[] = [];

  gdsMeta.pages.forEach((rawPage: any, index: number) => {
    if (!rawPage || typeof rawPage !== 'object') {
      return;
    }

    const number = typeof rawPage.page === 'number' ? rawPage.page : index + 1;
    const title = typeof rawPage.title === 'string' ? rawPage.title : undefined;
    const description =
      typeof rawPage.description === 'string'
        ? rawPage.description
        : typeof rawPage.desc === 'string'
          ? rawPage.desc
          : undefined;
    const hint = typeof rawPage.hint === 'string' ? rawPage.hint : undefined;

    const questionIds = Array.isArray(rawPage.questions)
      ? rawPage.questions.filter((value: unknown): value is string => typeof value === 'string' && questionMap.has(value))
      : [];

    if (questionIds.length === 0) {
      return;
    }

    questionIds.forEach((id: string, orderIndex: number) => {
      const question = questionMap.get(id);
      if (question) {
        question.page = number;
        if (typeof question.order !== 'number') {
          question.order = orderIndex + 1;
        }
      }
    });

    pages.push({ number, title, description, hint, questions: questionIds });
  });

  return pages.length > 0 ? pages : undefined;
};

const applyGdsRequiredQuestions = (operation: any, questions: ServiceQuestion[]) => {
  const gdsMeta = operation && typeof operation === 'object' ? (operation['x-gds'] as any) : undefined;

  if (!gdsMeta || typeof gdsMeta !== 'object' || !Array.isArray(gdsMeta.requiredQuestions)) {
    return;
  }

  const requiredIds = new Set(
    gdsMeta.requiredQuestions.filter((value: unknown): value is string => typeof value === 'string')
  );

  questions.forEach((question) => {
    if (requiredIds.has(question.id)) {
      question.required = true;
    }
  });
};

export const extractServicesFromOpenApi = (spec: any): ServiceDefinition[] => {
  if (!spec || typeof spec !== 'object' || !spec.paths) {
    return [];
  }

  const services = new Map<string, ServiceDefinition>();

  Object.entries(spec.paths).forEach(([path, pathItem]) => {
    if (!pathItem || typeof pathItem !== 'object') {
      return;
    }

    Object.entries(pathItem).forEach(([method, operation]) => {
      if (method.toLowerCase() === 'parameters') {
        return;
      }

      if (!operation || typeof operation !== 'object') {
        return;
      }

      if (!operation.requestBody) {
        return;
      }

      if (isStatusOperation(path, operation)) {
        return;
      }

      const schema = resolveRequestBodySchema(spec, operation.requestBody);
      if (!schema) {
        return;
      }

      const questions = extractQuestions(spec, schema);
      if (questions.length === 0) {
        return;
      }

      applyGdsRequiredQuestions(operation, questions);

      const originalOrder = new Map<string, number>();
      questions.forEach((question, index) => {
        if (!originalOrder.has(question.id)) {
          originalOrder.set(question.id, index);
        }
      });

      const uniqueQuestions = questions.filter(
        (question, index, array) => array.findIndex((candidate) => candidate.id === question.id) === index
      );

      const pages = extractGdsPages(operation, uniqueQuestions);
      const sortedQuestions = sortQuestions(uniqueQuestions, originalOrder);

      const name = deriveServiceName(path, operation);
      const slugSource = operation.operationId ?? name ?? path;
      const slug = slugify(slugSource) || slugify(name) || slugify(path) || `service-${services.size + 1}`;

      const summary = operation.description ?? schema.description;

      if (!services.has(slug)) {
        services.set(slug, {
          slug,
          name,
          summary,
          questions: sortedQuestions,
          pages,
          source: 'openapi'
        });
      }
    });
  });

  return Array.from(services.values()).sort((a, b) => a.name.localeCompare(b.name));
};

export const SERVICE_SPEC_URL = 'https://func-servicebuilder-api-int.azurewebsites.net/api/openapi/v31.yaml';
