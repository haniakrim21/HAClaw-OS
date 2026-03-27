import { Language } from '../../types';
import { getTooltip } from '../../locales/tooltips';

/**
 * Resolve a schema node by dotted config path.
 * e.g. "agents.defaults.maxConcurrent" → walk schema.properties.agents.properties.defaults.properties.maxConcurrent
 */
function resolveSchemaNode(schema: Record<string, any> | null | undefined, dottedPath: string): Record<string, any> | null {
  if (!schema) return null;
  const root = schema.schema || schema;
  const parts = dottedPath.split('.');
  let node = root;
  for (const p of parts) {
    node = node?.properties?.[p];
    if (!node) return null;
  }
  return node;
}

/**
 * Build a range/enum suffix string from a schema node.
 * Examples:
 *   { minimum: 1, maximum: 64 }          → " [1–64]"
 *   { minimum: 0 }                        → " [≥0]"
 *   { maximum: 100 }                      → " [≤100]"
 *   { enum: ["off","on","ask"] }           → " (off | on | ask)"
 *   { type: "boolean" }                    → "" (no suffix needed)
 */
function schemaConstraintSuffix(node: Record<string, any>): string {
  const parts: string[] = [];

  // enum values
  if (Array.isArray(node.enum) && node.enum.length > 0 && node.enum.length <= 12) {
    parts.push(`(${node.enum.join(' | ')})`);
  }

  // numeric range
  const min = node.minimum;
  const max = node.maximum;
  if (min != null && max != null) {
    parts.push(`[${min}–${max}]`);
  } else if (min != null) {
    parts.push(`[≥${min}]`);
  } else if (max != null) {
    parts.push(`[≤${max}]`);
  }

  // default value
  if (node.default !== undefined && node.default !== null && node.default !== '') {
    const def = typeof node.default === 'object' ? JSON.stringify(node.default) : String(node.default);
    if (def.length <= 30) {
      parts.push(`Default: ${def}`);
    }
  }

  return parts.length > 0 ? '\n' + parts.join('  ') : '';
}

/**
 * Schema-aware tooltip resolver.
 *
 * Priority:
 * 1. Hand-written locale tooltip (from tooltips.json)
 * 2. Schema description fallback (from OpenClaw config schema)
 *
 * In both cases, range/enum info from schema is appended.
 */
export function schemaTooltip(
  key: string,
  language: Language,
  schema?: Record<string, any> | null,
): string {
  const handWritten = getTooltip(key, language);
  const node = resolveSchemaNode(schema, key);
  const suffix = node ? schemaConstraintSuffix(node) : '';

  if (handWritten) {
    return handWritten + suffix;
  }

  // Fallback to schema description
  if (node?.description) {
    return node.description + suffix;
  }

  return '';
}
