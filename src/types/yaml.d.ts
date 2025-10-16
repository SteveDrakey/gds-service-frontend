declare module 'yaml' {
  export function parse<T = unknown>(src: string, options?: unknown): T;
  export function stringify(value: unknown, options?: unknown): string;
  const YAML: {
    parse: typeof parse;
    stringify: typeof stringify;
  };
  export default YAML;
}
