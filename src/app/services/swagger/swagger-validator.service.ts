import * as S from '@swagger/swagger';
import { Injectable } from '@angular/core';
import { Swagger } from '@services/swagger/swagger.service';
import { isArray } from 'util';

export interface ValidationError {
	status?: string;
	errors?: Array<{
		model: string;
		error: string;
	}>;
}

@Injectable()
export class SwaggerValidator {
	private resolvedDev: S.Root;
	private actualSchema: string;

	constructor(private swagger: Swagger) {}

	public validateReply(call: S.Call, reply: string | any): ValidationError | undefined {
		if (reply.indexOf('{') === -1) {
			return { status: 'invalid reply', errors: [{model: this.actualSchema, error: 'reply is not a JSON'}] };
		}
		reply = JSON.parse(reply);
		if (!reply) {
			return { status: 'invalid reply', errors: [{model: this.actualSchema, error: 'reply is an invalid JSON'}] };
		}
		this.actualSchema = 'mainModel';
		const returnType = Swagger.extractReturnType(call);
		if (!returnType) {
			return { status: 'invalid reply', errors: [{model: this.actualSchema, error: 'return type not specified'}] };
		}

		this.resolvedDev = Swagger.resolveRef(this.swagger.def);

		const type = this.resolvedDev.definitions[returnType];
		return this.validateSchema(type, reply);
	}


	private validateSchema(schema: S.Schema, value: any): ValidationError | undefined {
		// hard errors throw en exception
		try {
			// type is a required field for the check
			if (!schema.type) {
				throw SyntaxError('missing type in schema');
			}
			// check if the value determents to the set type
			if (!this.compareTsDatatype(schema.type, value)) {
				throw TypeError('type is not matching to schema');
			}

			// check type dependent the value
			switch (schema.type) {
				case 'array':
					return this.checkArray(schema, value);
				case 'boolean':
					return undefined; // type check is already done
				case 'number':
				case 'integer':
				case 'float':
					return this.validateNumber(schema, value);
				case 'object':
					return this.validateObject(schema, value);
				case 'string':
					return this.checkString(schema, value);
				default:
					throw new TypeError('unsupported type');
			}
		} catch (e) {
			// return a ValidationError as return
			return {
				status: e.name,
				errors: [{
					error: e.message,
					model: this.actualSchema,
				}]
			};
		}
	}

	private checkArray(schema: S.Schema, array: Array<any>): ValidationError | undefined {
		if (schema.minItems && array.length < schema.minItems) {
			throw new Error(`array(${array}) length is less then minItems(${schema.minItems})`);
		}
		if (schema.maxItems && array.length > schema.maxItems) {
			throw new Error(`array(${array}) length is more then maxItems(${schema.maxItems})`);
		}
		if (schema.uniqueItems) {
			const items = array.map(i => JSON.stringify(i));
			items.forEach(i => {
				if (items.indexOf(i) !== items.lastIndexOf(i)) {
					throw new Error(`value ${i} do multiple exist in a uniqueItems array`);
				}
			});
		}
		if (array.length) {
			const model = this.actualSchema;
			this.actualSchema = `${this.actualSchema}[]`;
			const result = this.validateSchema(schema.items, array[0]);
			this.actualSchema = model;
			return result;
		}
		return undefined;
	}

	private validateNumber(schema: S.Schema, num: number): undefined {
		if (schema.minimum) {
			if (schema.exclusiveMinimum) {
				if (num <= schema.minimum) {
					throw new RangeError(`num(${num}) is <= then minimum(${schema.minimum})`);
				}
			} else {
				if (num < schema.minimum) {
					throw new RangeError(`num(${num}) is < then minimum(${schema.minimum})`);
				}
			}
		}
		if (schema.maximum) {
			if (schema.exclusiveMaximum) {
				if (num >= schema.maximum) {
					throw new RangeError(`num(${num}) is >= then maximum(${schema.maximum})`);
				}
			} else {
				if (num > schema.maximum) {
					throw new RangeError(`num(${num}) is > then maximum(${schema.maximum})`);
				}
			}
		}
		if (schema.multipleOf && (num /  schema.multipleOf).toString().indexOf('.') === -1) {
			throw new RangeError(`num(${num}) is a multiple of(${schema.multipleOf})`);
		}

		if (schema.format && schema.format === 'int32' && (num > 2147483647 || num < -2147483647)) {
			throw new RangeError(`num int32(${num}) should be between -2147483647 and  2147483647`);
		}
		if (schema.format && schema.format === 'int64' && (num > 9223372036854775807 || num < -9223372036854775807)) {
			throw new RangeError(`num int64(${num}) should be between -9223372036854775807 and  9223372036854775807`);
		}
		if (schema.type === 'integer' && num.toString().indexOf('.') !== -1) {
			throw new Error(`float or double(${num}) send for a integer`);
		}

		return undefined;
	}

	private validateObject(schema: S.Schema, obj: any): ValidationError {
		let error: ValidationError;
		const existingProperties = Object.getOwnPropertyNames(obj);
		error = this.combineErrors(error, this.checkProperties(existingProperties, schema));
		existingProperties.forEach((prop) => {
			const tempName = this.actualSchema;
			this.actualSchema = `${this.actualSchema}::${prop}`;
			error = this.combineErrors(error, this.validateSchema(schema.properties[prop], obj[prop]));
			this.actualSchema = tempName;
		});
		return error;
	}

	private checkString(schema: S.Schema, str: any): undefined {
		if (schema.minLength && str.length < schema.minLength) {
			throw new Error(`str(${str}) is shorter then minLength(${schema.minLength})`);
		}
		if (schema.maxLength && str.length > schema.maxLength) {
			throw new Error(`str(${str}) is longer then maxLength(${schema.maxLength})`);
		}
		if (schema.pattern && !RegExp(schema.pattern).test(str)) {
			throw new Error(`str(${str}) do not match the pattern(${schema.pattern})`);
		}
		return undefined;
	}

	private combineErrors(a: ValidationError, b: ValidationError): ValidationError | undefined {
		// if one is undefined, return the other, return undefined is allowed
		if (a === undefined) { return b; }
		if (b === undefined) { return a; }

		// combine error arrays
		const errors = [];
		if (a.errors) { errors.push(...a.errors); }
		if (b.errors) { errors.push(...b.errors); }

		// combine status
		let status = '';
		if (a.status.indexOf(b.status) !== -1 && b.status.indexOf(a.status)) {
			status = (a.status ? a.status + ' ' : '') + (b.status ? b.status : '');
		} else {
			status = a.status.length > b.status.length ? a.status : b.status;
		}

		if (status.length === 0) {
			status = undefined;
		}

		return {status, errors};
	}

	private compareTsDatatype(type: string, obj: any): boolean {
		let tsType: string;
		switch (type) {
			// types who are the same
			case 'object':
			case 'string':
			case 'boolean':
			tsType = type;
			break;
			// types to translate
			case 'array':
				return isArray(obj);
			case 'number':
			case 'integer':
			case 'float':
				tsType = 'number';
				break;
			default:
				// unknown types throw an error
				throw new TypeError(`unknown type ${type}`);
		}
		// check if type is correct

		return tsType === typeof obj;
	}

	private checkProperties(propNames: Array<string>, schema: S.Schema): ValidationError | undefined {
		// array to store not found properties
		const missingProps = [] as Array<string>;
		const addedProps = [] as Array<string>;

		// check if there is something required
		if (schema.required) {
			// check if all required properties are in the propName array
			schema.required.forEach(reqP => {
				if (propNames.indexOf(reqP) === -1) {
					missingProps.push(reqP);
				}
			});
		}
		// check if additional properties are added
		if (!schema.additionalProperties) {
			const allowedProperties = Object.getOwnPropertyNames(schema.properties);
			propNames.forEach(prop => {
				if (allowedProperties.indexOf(prop) === -1) {
					addedProps.push(prop);
				}
			});
		}

		let error: ValidationError;
		// if some Properties are missing
		if (missingProps.length) {
			// return error data as ValidationError
			error = this.combineErrors(error, {
				status: 'missing required fields',
				errors: missingProps.map(p => {
					return {
						error: p,
						model: this.actualSchema,
					};
				})
			});
		}
		// if some Properties are too much
		if (addedProps.length) {
			// return error data as ValidationError
			error = this.combineErrors(error, {
				status: 'additional Property found',
				errors: addedProps.map(p => {
					return { error: p, model: this.actualSchema };
				})
			});
		}
		// undefined means no error
		return error;
	}
}

