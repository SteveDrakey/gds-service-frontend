import type {
  QuestionWidth,
  ServiceDefinition,
  ServicePage,
  ServiceQuestion,
  ServiceQuestionOption
} from '../types/service';

const SPEC_STATUS_KEYWORDS = ['status', 'health', 'todo', 'ping'];

interface PageRegistryEntry extends ServicePage {
  order: number;
}

const toComparableKey = (value: string) => value.replace(/[^a-z0-9]+/gi, '-').toLowerCase();

const arrayFrom = <T = any>(value: unknown): T[] => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value as T[];
  }

  if (typeof value === 'object') {
    return Object.entries(value).map(([id, entry]) => ({ id, ...(entry as Record<string, unknown>) })) as T[];
  }

  return [];
};

const mergeMetas = (...metas: any[]) => {
  const filtered = metas.filter((meta) => meta && typeof meta === 'object');
  if (filtered.length === 0) {
    return undefined;
  }

  return filtered.reduce((accumulator, meta) => ({ ...accumulator, ...meta }), {} as Record<string, unknown>);
};

const normaliseWidth = (value: string): QuestionWidth | undefined => {
  const map: Record<string, QuestionWidth> = {
    full: 'full',
    '1/1': 'full',
    '100%': 'full',
    'three-quarters': 'three-quarters',
    '3/4': 'three-quarters',
    'three quarters': 'three-quarters',
    'two-thirds': 'two-thirds',
    'two thirds': 'two-thirds',
    '2/3': 'two-thirds',
    'two-of-three': 'two-thirds',
    'half': 'one-half',
    'one-half': 'one-half',
    'one half': 'one-half',
    '1/2': 'one-half',
    '50%': 'one-half',
    'one-third': 'one-third',
    'one third': 'one-third',
    '1/3': 'one-third',
    'one-quarter': 'one-quarter',
    'one quarter': 'one-quarter',
    '1/4': 'one-quarter',
    quarter: 'one-quarter'
  };

  return map[value.toLowerCase()] ?? undefined;
};

const parseQuestionWidth = (meta: any): QuestionWidth | undefined => {
  if (!meta || typeof meta !== 'object') {
    return undefined;
  }

  const candidate =
    meta.width ?? meta.size ?? meta.column ?? meta.columns ?? meta.widthClass ?? meta.widthModifier ?? meta.inputWidth;

  return typeof candidate === 'string' ? normaliseWidth(candidate) : undefined;
};

const parseQuestionTypeOverride = (meta: any): ServiceQuestion['type'] | undefined => {
  if (!meta || typeof meta !== 'object') {
    return undefined;
  }

  const candidate =
    meta.type ?? meta.control ?? meta.component ?? meta.input ?? meta.widget ?? meta.fieldType ?? meta.presentation;

  if (typeof candidate !== 'string') {
    return undefined;
  }

  const normalised = candidate.toLowerCase();

  if (['textarea', 'text-area', 'longtext', 'long-text', 'multiline', 'multiline-text'].includes(normalised)) {
    return 'textarea';
  }

  if (['select', 'dropdown', 'choice', 'choices', 'options', 'radio', 'radios'].includes(normalised)) {
    return normalised.startsWith('radio') ? 'select' : 'select';
  }

  if (['checkbox', 'checkboxes', 'boolean', 'bool', 'confirm', 'toggle', 'yesno', 'yes-no'].includes(normalised)) {
    return 'checkbox';
  }

  if (['date', 'datefield', 'date-input', 'dateinput'].includes(normalised)) {
    return 'date';
  }

  if (['number', 'numeric', 'integer', 'int', 'currency'].includes(normalised)) {
    return 'number';
  }

  if (['text', 'shorttext', 'short-text', 'string', 'input'].includes(normalised)) {
    return 'text';
  }

  return undefined;
};

const parseQuestionOptionsFromMeta = (meta: any): ServiceQuestionOption[] | undefined => {
  if (!meta || typeof meta !== 'object') {
    return undefined;
  }

  const candidates = meta.options ?? meta.choices ?? meta.items ?? meta.values;
  if (!candidates) {
    return undefined;
  }

  const arrayCandidates = Array.isArray(candidates)
    ? candidates
    : Object.entries(candidates).map(([value, label]) => ({ value, label }));

  const options: ServiceQuestionOption[] = [];

  arrayCandidates.forEach((entry: any) => {
    if (!entry) {
      return;
    }

    if (typeof entry === 'string') {
      options.push({ value: entry, label: sentenceCase(entry) });
      return;
    }

    if (typeof entry === 'object') {
      const value =
        entry.value ??
        entry.id ??
        entry.code ??
        entry.key ??
        entry.name ??
        entry.slug ??
        entry.ref ??
        entry.reference;

      if (value === undefined) {
        return;
      }

      const label = entry.label ?? entry.text ?? entry.title ?? entry.name ?? entry.description;
      options.push({
        value: String(value),
        label: label ? String(label) : sentenceCase(String(value))
      });
    }
  });

  return options.length > 0 ? options : undefined;
};

const matchesFieldKey = (candidate: string, key: string, fullKey: string) => {
  const comparable = toComparableKey(candidate);
  const keyComparable = toComparableKey(key);
  const fullComparable = toComparableKey(fullKey);
  const dashedComparable = toComparableKey(fullKey.replace(/\./g, '-'));
  const keyDashedComparable = toComparableKey(key.replace(/\./g, '-'));

  return (
    comparable === keyComparable ||
    comparable === fullComparable ||
    comparable === dashedComparable ||
    comparable === keyDashedComparable
  );
};

const resolveFieldMeta = (contexts: any[], key: string, fullKey: string) => {
  for (const context of contexts) {
    if (!context || typeof context !== 'object') {
      continue;
    }

    const directKeys = [key, fullKey, key.replace(/\./g, '_'), fullKey.replace(/\./g, '_')];
    for (const candidate of directKeys) {
      if (!candidate) {
        continue;
      }

      const value = context[candidate];
      if (value && typeof value === 'object') {
        return value;
      }
    }

    const collectionKeys = ['fields', 'field', 'questions', 'inputs', 'properties', 'items'];

    for (const collectionKey of collectionKeys) {
      const collection = context[collectionKey];
      if (!collection) {
        continue;
      }

      if (Array.isArray(collection)) {
        for (const entry of collection) {
          if (!entry) {
            continue;
          }

          if (typeof entry === 'string') {
            if (matchesFieldKey(entry, key, fullKey)) {
              return {};
            }
            continue;
          }

          if (typeof entry === 'object') {
            const identifier =
              entry.id ??
              entry.field ??
              entry.name ??
              entry.key ??
              entry.code ??
              entry.path ??
              entry.property ??
              entry.questionId;

            if (typeof identifier === 'string' && matchesFieldKey(identifier, key, fullKey)) {
              return entry;
            }
          }
        }

        continue;
      }

      if (typeof collection === 'object') {
        for (const [entryKey, entryValue] of Object.entries(collection)) {
          if (matchesFieldKey(entryKey, key, fullKey) && entryValue && typeof entryValue === 'object') {
            return entryValue;
          }
        }
      }
    }
  }

  return undefined;
};

const registerPageFromRef = (
  registry: Map<string, PageRegistryEntry>,
  ref: any,
  fallbackTitle?: string,
  fallbackOrder?: number,
  overrides?: Partial<ServicePage>
): PageRegistryEntry | undefined => {
  if (!ref) {
    return undefined;
  }

  const applyOverrides = (entry: PageRegistryEntry) => {
    const next: PageRegistryEntry = {
      ...entry,
      title:
        overrides?.title && overrides.title.trim().length > 0
          ? overrides.title
          : entry.title ?? sentenceCase(entry.id),
      description: overrides?.description ?? entry.description,
      order: entry.order
    };
    registry.set(next.id, next);
    return next;
  };

  if (typeof ref === 'string') {
    const slug = slugify(ref);
    const id = slug.length > 0 ? slug : `page-${registry.size + 1}`;
    const existing = registry.get(id);

    if (existing) {
      return applyOverrides(existing);
    }

    const entry: PageRegistryEntry = {
      id,
      title:
        (overrides?.title && overrides.title.trim().length > 0
          ? overrides.title
          : ref.trim().length > 0
          ? ref
          : sentenceCase(id)) ?? sentenceCase(id),
      description: overrides?.description,
      order: typeof fallbackOrder === 'number' ? fallbackOrder : registry.size
    };

    registry.set(id, entry);
    return entry;
  }

  if (typeof ref === 'object') {
    const idSource =
      ref.id ??
      ref.slug ??
      ref.key ??
      ref.code ??
      ref.name ??
      ref.title ??
      ref.page ??
      ref.step ??
      ref.section ??
      ref.group;

    const slug = idSource ? slugify(String(idSource)) : '';
    const id = slug.length > 0 ? slug : `page-${registry.size + 1}`;
    const existing = registry.get(id);
    const titleCandidate =
      overrides?.title ??
      ref.title ??
      ref.name ??
      ref.heading ??
      ref.question ??
      (typeof idSource === 'string' && idSource.length > 0 ? idSource : undefined) ??
      fallbackTitle;
    const descriptionCandidate = overrides?.description ?? ref.description ?? ref.summary ?? ref.hint ?? ref.text;
    const orderCandidate = ref.order ?? ref.position ?? ref.index ?? ref.weight ?? fallbackOrder;

    const entry: PageRegistryEntry = {
      id,
      title: existing?.title ?? (titleCandidate ? String(titleCandidate) : sentenceCase(id)),
      description: existing?.description ?? (descriptionCandidate ? String(descriptionCandidate) : undefined),
      order:
        typeof (existing?.order ?? orderCandidate) === 'number'
          ? (existing?.order ?? Number(orderCandidate))
          : registry.size
    };

    registry.set(id, entry);
    return entry;
  }

  return undefined;
};

const buildPageRegistry = (meta: any) => {
  const registry = new Map<string, PageRegistryEntry>();

  if (!meta || typeof meta !== 'object') {
    return registry;
  }

  const candidateKeys = ['pages', 'steps', 'sections', 'groups'];

  candidateKeys.forEach((key) => {
    const entries = arrayFrom(meta[key]);
    entries.forEach((entry, index) => {
      registerPageFromRef(
        registry,
        entry,
        `${sentenceCase(key.replace(/s$/, ''))} ${index + 1}`,
        index,
        typeof meta === 'object' && typeof meta.page === 'object' ? meta.page : undefined
      );
    });
  });

  return registry;
};

const resolvePageReference = (meta: any, contexts: any[], inherited?: any) => {
  const candidates = [meta?.page, meta?.pageId, meta?.step, meta?.section, meta?.group, inherited];
  for (const candidate of candidates) {
    if (candidate) {
      return candidate;
    }
  }

  for (const context of contexts) {
    if (!context || typeof context !== 'object') {
      continue;
    }

    const contextCandidate = context.page ?? context.pageId ?? context.step ?? context.section ?? context.group;
    if (contextCandidate) {
      return contextCandidate;
    }
  }

  return undefined;
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
  required: boolean,
  meta: any,
  pageRegistry: Map<string, PageRegistryEntry> | undefined,
  contexts: any[],
  inheritedPageRef?: any
): ServiceQuestion | undefined => {
  if (!schema) {
    return undefined;
  }

  const explicitType = parseQuestionTypeOverride(meta);
  let type = explicitType ?? inferQuestionType(schema);

  const labelCandidate =
    meta?.label ?? meta?.question ?? meta?.title ?? meta?.text ?? schema.title ?? sentenceCase(key);
  const label = typeof labelCandidate === 'string' && labelCandidate.trim().length > 0 ? labelCandidate : sentenceCase(key);

  const requiredOverride =
    typeof meta?.required === 'boolean'
      ? meta.required
      : typeof meta?.mandatory === 'boolean'
      ? meta.mandatory
      : typeof meta?.optional === 'boolean'
      ? !meta.optional
      : undefined;
  const finalRequired = requiredOverride ?? required;

  const hintCandidate =
    meta?.hint ??
    meta?.help ??
    meta?.caption ??
    meta?.supportingText ??
    meta?.explanation ??
    meta?.helper ??
    meta?.description ??
    schema.description;
  const hint = typeof hintCandidate === 'string' ? hintCandidate : undefined;

  const longDescription =
    typeof meta?.longDescription === 'string' ? meta.longDescription : hint !== meta?.description ? meta?.description : undefined;

  const headingCandidate = meta?.heading ?? meta?.legend ?? meta?.titleHeading ?? meta?.questionHeading;
  const heading = typeof headingCandidate === 'string' ? headingCandidate : undefined;

  const prefaceCandidate =
    meta?.preface ??
    meta?.intro ??
    meta?.introduction ??
    meta?.lead ??
    meta?.lede ??
    meta?.textBefore ??
    meta?.summary;
  const preface = typeof prefaceCandidate === 'string' ? prefaceCandidate : undefined;

  const optionsFromMeta = parseQuestionOptionsFromMeta(meta);
  const optionsFromSchema = buildOptions(schema);
  const options = optionsFromMeta ?? optionsFromSchema;

  if (type === 'select' && (!options || options.length === 0)) {
    if (!explicitType) {
      return undefined;
    }
  }

  if (explicitType === 'select' && (!options || options.length === 0)) {
    return undefined;
  }

  const width = parseQuestionWidth(meta);

  const pageOverrides = {
    title: meta?.pageTitle ?? meta?.sectionTitle ?? meta?.groupTitle,
    description: meta?.pageDescription ?? meta?.sectionDescription ?? meta?.groupDescription ?? meta?.pageSummary
  } satisfies Partial<ServicePage>;

  const pageRef = resolvePageReference(meta ?? {}, contexts, inheritedPageRef);
  const pageEntry = pageRegistry ? registerPageFromRef(pageRegistry, pageRef, undefined, undefined, pageOverrides) : undefined;

  const orderCandidate =
    typeof meta?.order === 'number'
      ? meta.order
      : typeof meta?.position === 'number'
      ? meta.position
      : typeof meta?.index === 'number'
      ? meta.index
      : typeof meta?.weight === 'number'
      ? meta.weight
      : typeof meta?.sortOrder === 'number'
      ? meta.sortOrder
      : undefined;

  const question: ServiceQuestion = {
    id,
    label,
    type,
    required: finalRequired
  };

  if (hint) {
    question.hint = hint;
  }

  if (longDescription && longDescription !== hint) {
    question.description = longDescription;
  }

  if (heading) {
    question.heading = heading;
  }

  if (preface) {
    question.preface = preface;
  }

  if (options && options.length > 0 && type === 'select') {
    question.options = options;
  }

  if (width) {
    question.width = width;
  }

  if (typeof orderCandidate === 'number') {
    question.order = orderCandidate;
  }

  if (pageEntry) {
    question.pageId = pageEntry.id;
  } else if (!pageRef && pageRegistry && pageRegistry.size === 1) {
    const [singlePageId] = Array.from(pageRegistry.keys());
    if (singlePageId) {
      question.pageId = singlePageId;
    }
  }

  if (explicitType) {
    type = explicitType;
    question.type = explicitType;
  }

  return question;
};

const extractQuestions = (
  doc: any,
  schema: any,
  prefix: string[] = [],
  parentRequired?: string[],
  gdsContexts: any[] = [],
  pageRegistry?: Map<string, PageRegistryEntry>,
  inheritedPageRef?: any
): ServiceQuestion[] => {
  const resolved = resolveSchema(doc, schema);
  if (!resolved) {
    return [];
  }

  const ownContext = resolved?.['x-gds'] && typeof resolved['x-gds'] === 'object' ? resolved['x-gds'] : undefined;
  const contexts = ownContext ? [ownContext, ...gdsContexts] : gdsContexts;

  if (resolved.type !== 'object' || !resolved.properties) {
    if (prefix.length === 0) {
      return [];
    }
    const key = prefix[prefix.length - 1];
    const fullKey = prefix.join('.');
    const meta = mergeMetas(resolveFieldMeta(contexts, key, fullKey));
    const question = createQuestion(
      fullKey,
      key,
      resolved,
      Boolean(parentRequired?.includes(key)),
      meta,
      pageRegistry,
      contexts,
      inheritedPageRef
    );
    return question ? [question] : [];
  }

  const questions: ServiceQuestion[] = [];
  const requiredList: string[] = resolved.required ?? [];

  Object.entries(resolved.properties).forEach(([key, propertySchema]: [string, any]) => {
    const propertyResolved = resolveSchema(doc, propertySchema);
    const nestedPrefix = [...prefix, key];
    const isRequired = requiredList.includes(key);
    const fullKey = nestedPrefix.join('.');

    const fieldMetaFromContext = resolveFieldMeta(contexts, key, fullKey);
    const propertyOwnMeta =
      propertyResolved && typeof propertyResolved === 'object' && propertyResolved['x-gds'] && typeof propertyResolved['x-gds'] === 'object'
        ? propertyResolved['x-gds']
        : undefined;
    const fieldMeta = mergeMetas(fieldMetaFromContext, propertyOwnMeta);

    const nextContexts = [
      ...(fieldMeta && typeof fieldMeta === 'object' ? [fieldMeta] : []),
      ...(propertyOwnMeta && typeof propertyOwnMeta === 'object' ? [propertyOwnMeta] : []),
      ...contexts
    ];

    const nextInheritedPageRef =
      fieldMeta?.page ??
      fieldMeta?.pageId ??
      fieldMeta?.step ??
      fieldMeta?.section ??
      fieldMeta?.group ??
      inheritedPageRef;

    if (propertyResolved?.type === 'object' && propertyResolved.properties) {
      questions.push(
        ...extractQuestions(
          doc,
          propertyResolved,
          nestedPrefix,
          propertyResolved.required,
          nextContexts,
          pageRegistry,
          nextInheritedPageRef
        )
      );
      return;
    }

    if (propertyResolved?.type === 'array' && propertyResolved.items) {
      const arrayItems = resolveSchema(doc, propertyResolved.items);
      if (arrayItems?.type === 'object' && arrayItems.properties) {
        questions.push(
          ...extractQuestions(
            doc,
            arrayItems,
            nestedPrefix,
            arrayItems.required,
            nextContexts,
            pageRegistry,
            nextInheritedPageRef
          )
        );
        return;
      }
    }

    const question = createQuestion(
      fullKey,
      key,
      propertyResolved,
      isRequired,
      fieldMeta,
      pageRegistry,
      nextContexts,
      nextInheritedPageRef
    );
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

      const gdsMeta = schema['x-gds'] && typeof schema['x-gds'] === 'object' ? schema['x-gds'] : undefined;
      const pageRegistry = buildPageRegistry(gdsMeta);
      const contexts = gdsMeta ? [gdsMeta] : [];
      const questions = extractQuestions(spec, schema, [], undefined, contexts, pageRegistry);
      if (questions.length === 0) {
        return;
      }

      const originalOrder = new Map<ServiceQuestion, number>();
      questions.forEach((question, index) => originalOrder.set(question, index));

      const sortedQuestions = [...questions].sort((a, b) => {
        const pageA = a.pageId ? pageRegistry.get(a.pageId) : undefined;
        const pageB = b.pageId ? pageRegistry.get(b.pageId) : undefined;
        const pageOrderA = pageA ? pageA.order ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
        const pageOrderB = pageB ? pageB.order ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;

        if (pageOrderA !== pageOrderB) {
          return pageOrderA - pageOrderB;
        }

        const questionOrderA = typeof a.order === 'number' ? a.order : originalOrder.get(a) ?? Number.MAX_SAFE_INTEGER;
        const questionOrderB = typeof b.order === 'number' ? b.order : originalOrder.get(b) ?? Number.MAX_SAFE_INTEGER;

        if (questionOrderA !== questionOrderB) {
          return questionOrderA - questionOrderB;
        }

        return (originalOrder.get(a) ?? 0) - (originalOrder.get(b) ?? 0);
      });

      const usedPageIds = new Set(sortedQuestions.map((question) => question.pageId).filter(Boolean) as string[]);
      const pages = Array.from(pageRegistry.values())
        .filter((page) => usedPageIds.has(page.id))
        .sort((a, b) => {
          const orderA = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
          const orderB = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
          if (orderA !== orderB) {
            return orderA - orderB;
          }
          return a.title.localeCompare(b.title);
        });

      const name = deriveServiceName(path, operation);
      const slugSource = operation.operationId ?? name ?? path;
      const slug = slugify(slugSource) || slugify(name) || slugify(path) || `service-${services.size + 1}`;

      const summary = operation.description ?? schema.description;

      if (!services.has(slug)) {
        services.set(slug, {
          slug,
          name,
          summary,
          questions: sortedQuestions.filter((question, index, array) =>
            array.findIndex((candidate) => candidate.id === question.id) === index
          ),
          pages: pages.length > 0 ? pages : undefined,
          source: 'openapi'
        });
      }
    });
  });

  return Array.from(services.values()).sort((a, b) => a.name.localeCompare(b.name));
};

export const SERVICE_SPEC_URL = 'https://func-servicebuilder-api-int.azurewebsites.net/api/openapi/v31.yaml';
