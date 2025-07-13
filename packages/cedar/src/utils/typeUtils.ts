// @ts-ignore: allow missing module declaration for typescript-json-schema
import * as TJS from 'typescript-json-schema';
import { JSONSchema7 } from 'json-schema';
import { z, ZodTypeAny } from 'zod';

/**
 * Generate JSON Schema for a given TypeScript type.
 * @param filePaths Array of file paths (absolute or relative) where the type is defined.
 * @param typeName Name of the TypeScript type to convert.
 * @returns JSONSchema7 object or null if generation fails.
 */
export function tsTypeToJsonSchema(
	filePaths: string[],
	typeName: string
): JSONSchema7 | null {
	const settings = {
		required: true,
		noExtraProps: true,
		strictNullChecks: true,
	};
	const program = TJS.getProgramFromFiles(filePaths, {
		strictNullChecks: true,
	});
	const schema = TJS.generateSchema(program, typeName, settings);
	return (schema as JSONSchema7) || null;
}

/**
 * Recursively convert JSONSchema7 to a Zod schema.
 * @param schema JSONSchema7 definition.
 * @returns ZodTypeAny schema.
 */
export function jsonSchemaToZod(schema: JSONSchema7): ZodTypeAny {
	if (Array.isArray(schema.type)) {
		// multiple types -> union
		const zodTypes = schema.type.map((t) =>
			jsonSchemaToZod({ type: t } as JSONSchema7)
		);
		return z.union(zodTypes as [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]]);
	}
	switch (schema.type) {
		case 'string':
			return z.string();
		case 'number':
		case 'integer':
			return z.number();
		case 'boolean':
			return z.boolean();
		case 'array':
			if (schema.items) {
				const itemSchema = Array.isArray(schema.items)
					? (schema.items[0] as JSONSchema7)
					: (schema.items as JSONSchema7);
				return z.array(jsonSchemaToZod(itemSchema));
			}
			return z.array(z.any());
		case 'object': {
			const props = schema.properties || {};
			const requiredKeys = schema.required || [];
			const shape: Record<string, ZodTypeAny> = {};
			for (const key in props) {
				const prop = props[key] as JSONSchema7;
				let propSchema = jsonSchemaToZod(prop);
				if (!requiredKeys.includes(key)) {
					propSchema = propSchema.optional();
				}
				shape[key] = propSchema;
			}
			let zodObj: ZodTypeAny = z.object(shape);
			if (schema.additionalProperties === false) {
				zodObj = zodObj.strict();
			} else if (schema.additionalProperties) {
				if (schema.additionalProperties === true) {
					zodObj = zodObj.catchall(z.any());
				} else if (typeof schema.additionalProperties === 'object') {
					zodObj = zodObj.catchall(
						jsonSchemaToZod(schema.additionalProperties as JSONSchema7)
					);
				}
			}
			return zodObj;
		}
		default:
			if (schema.oneOf) {
				const opts = (schema.oneOf as JSONSchema7[]).map(jsonSchemaToZod);
				return z.union(opts as [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]]);
			}
			if (schema.anyOf) {
				const opts = (schema.anyOf as JSONSchema7[]).map(jsonSchemaToZod);
				return z.union(opts as [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]]);
			}
			if (schema.allOf) {
				const schemas = (schema.allOf as JSONSchema7[]).map(jsonSchemaToZod);
				return schemas.reduce(
					(acc, sch) => acc.and(sch) as ZodTypeAny,
					schemas[0]
				);
			}
			return z.any();
	}
}

/**
 * Generate Zod schema for a given TypeScript type.
 * @param filePaths Array of file paths where the type is defined.
 * @param typeName Name of the TypeScript type to convert.
 * @returns ZodTypeAny schema or null if generation fails.
 */
export function tsTypeToZod(
	filePaths: string[],
	typeName: string
): ZodTypeAny | null {
	const jsonSchema = tsTypeToJsonSchema(filePaths, typeName);
	if (!jsonSchema) {
		return null;
	}
	return jsonSchemaToZod(jsonSchema);
}

/**
 * Utility type to extract the static TypeScript type from a Zod schema.
 * @example
 * type Player = zodToTS<typeof Player>;
 */
export type zodToTS<S extends ZodTypeAny> = z.infer<S>;
