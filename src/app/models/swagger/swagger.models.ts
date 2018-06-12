/**
 * represent all models in a API definition
 */
export interface SwaggerModels {
	/** undefined name of the Model with contains all data */
	[name: string]: Schema;
}

/**
 * Schema to represent data in models, Properties or responses
 */
export interface Schema {
	/** model name */
	name?: string;

	/** reference to an other model */
	$ref?: string;
	value?: any;
	present?: boolean;

	/** data type */
	type?: 'object' | 'array' | 'integer' | 'number' | 'string' | 'boolean' | 'float';
	/** description what this value is containing */
	description?: string;
	/** enumeration definition of this value */
	enum?: Array<any>;
	/** format of the value, user by number and string, this value is an open value */
	format?: 'int32' | 'int64' | 'Date' | 'date-time' | 'password' | 'byte' | 'binary' | string;

	// integer
	/** minimum value for the number */
	minimum?: number;
	/** is the given minimum number included or excluded */
	exclusiveMinimum?: boolean;
	/** maximum value vor the number */
	maximum?: number;
	/** is the given maximum number included or excluded */
	exclusiveMaximum?: boolean;
	/** the value is an multiple of this. can be used like modulo */
	multipleOf?: number;

	// string
	/** minimum length of the string */
	minLength: number;
	/** maximum length of the string */
	maxLength: number;
	/** regEx pattern to validate the string */
	pattern: string;

	// object
	/** array of all required properties */
	required?: Array<string>;
	/** Structure with all properties of this object */
	properties?: SwaggerModels;
	/** example structure for this object */
	example?: string;
	/** additional properties are allowed to be send in this object or is it an error */
	additionalProperties?: boolean;
	/** default value for this string, object, number, ... */
	default?: string;

	// array
	/** minimum count of Items in the array */
	minItems?: number;
	/** maximum count of items in the array */
	maxItems?: number;
	/** every item have to be unique in the array */
	uniqueItems?: boolean;
	/** schema of the items */
	items?: Schema;
}
