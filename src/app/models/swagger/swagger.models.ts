export interface SwaggerModels {
	[name: string]: Schema;
}

export interface Schema {
	$ref?: string;

	type?: 'object' | 'array' | 'integer' | 'number' | 'string' | 'boolean' | 'float';
	description?: string;
	enum?: Array<any>;
	format?: 'int32' | 'int64' | 'Date' | 'date-time' | 'password' | 'byte' | 'binary' | string;

	// integer
	minimum?: number;
	exclusiveMinimum?: boolean;
	maximum?: number;
	exclusiveMaximum?: boolean;
	multipleOf?: number;

	// string
	minLength: number;
	maxLength: number;
	pattern: string;

	// object
	required?: Array<string>;
	properties?: SwaggerModels;
	example?: string;
	default?: string;

	// array
	minItems?: number;
	maxItems?: number;
	uniqueItems?: boolean;
	items?: Schema;
}
