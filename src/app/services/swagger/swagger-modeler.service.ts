import * as S from '@swagger/swagger';
import { Injectable } from '@angular/core';
import { Swagger } from '@services/swagger/swagger.service';

export interface ModelInfo {
	name: string;
	type: 'object' | 'array' | 'integer' | 'number' | 'string' | 'boolean' | 'float';
	subModelData?: Array<ModelInfo>;
	required: boolean;
	description: string;
	example: any;
	info: Array<string>;
}

@Injectable()
export class SwaggerModeler {

	constructor(private swagger: Swagger) {}

	public createExample(modelName: string): string {
		return JSON.stringify(this.createExampleForSchema(this.swagger.def.definitions[modelName]), null, 4);
	}
	public createExampleBySchema(schema: S.Schema): string {
		return JSON.stringify(this.createExampleForSchema(schema), null, 4);
	}

	private createExampleForSchema(schema: S.Schema): any {
		switch (schema.type) {
			case 'boolean':
				return schema.example ? !!schema.example : true;
			case 'integer':
			case 'number':
				return schema.example ? parseInt(schema.example, 10) : 0;
			case 'float':
				return schema.example ? parseFloat(schema.example) : 0.0;
			case 'string':
				return schema.example ? schema.example : 'string';
			case 'object':
				const obj = {};
				Object.getOwnPropertyNames(schema.properties).forEach(
					p => obj[p] = this.createExampleForSchema(schema.properties[p])
				);
				return obj;
			case 'array':
				return [this.createExampleForSchema(schema.items)];
		}
		return null;
	}

	public createInfo(modelName: string): ModelInfo {
		const schema = this.swagger.def.definitions[modelName];
		return this.createInfoForSchema(modelName, false, schema);
	}
	public createInfoBySchema(schema: S.Schema): ModelInfo {
		return this.createInfoForSchema(schema.name, false, schema);
	}

	private createInfoForSchema(name: string, required: boolean, schema: S.Schema): any {
		const entry = {
			name: name,
			type: schema.type,
			required,
			description: schema.description,
			example: schema.example,
			info: this.buildInfo(schema)
		} as ModelInfo;

		switch (schema.type) {
			case 'string':
				entry.example = `"${schema.example}"`;
				return entry;
			case 'object':
				entry.subModelData = Object.getOwnPropertyNames(schema.properties).map(
					p => this.createInfoForSchema(p, schema.required && schema.required.indexOf(p) === -1 ? false : true, schema.properties[p])
				);
				return entry;
			case 'array':
				entry.subModelData = [this.createInfoForSchema('Array', false, schema.items)];
				return entry;
			default:
				return entry;
		}
	}

	private buildInfo(schema: S.Schema): Array<string> {
		const info = [] as Array<string>;
		switch (schema.type) {
			case 'number':
			case 'integer':
			case 'float':
				if (schema.minimum) { info.push(`minimum: ${schema.minimum}`); }
				if (schema.exclusiveMinimum) { info.push(`exclusiveMinimum: ${schema.exclusiveMinimum}`); }
				if (schema.maximum) { info.push(`maximum: ${schema.maximum}`); }
				if (schema.exclusiveMaximum) { info.push(`exclusiveMaximum: ${schema.exclusiveMaximum}`); }
				if (schema.multipleOf) { info.push(`multipleOf: ${schema.multipleOf}`); }
				if (schema.format) { info.push(`format: ${schema.format}`); }
				return info;
			case 'string':
				if (schema.minLength) { info.push(`minLength: ${schema.minLength}`); }
				if (schema.maxLength) { info.push(`maxLength: ${schema.maxLength}`); }
				if (schema.pattern) { info.push(`pattern: ${schema.pattern}`); }
				return info;
			case 'array':
				if (schema.minItems) { info.push(`minItems: ${schema.minItems}`); }
				if (schema.maxItems) { info.push(`maxItems: ${schema.maxItems}`); }
				if (schema.uniqueItems) { info.push(`uniqueItems: ${schema.uniqueItems ? 'true' : 'false'}`); }
				return info;
			default:
				return info;
		}
	}
}

