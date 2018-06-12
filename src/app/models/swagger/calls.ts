import { Schema } from './swagger.models';

/**
 * interface for all calls with unspecified name and method
 */
export interface Calls {
	/** call path */
	[name: string]: {
		/** http method */
		[method: string]: Call;
	};
}
/**
 * call information to be send over
 */
export interface Call {
	/** array of connected use cases */
	tags: Array<string>;
	/** short summary text, what this call is doing */
	summary: string;
	/** long description what this call should do */
	description: string;
	/** function name on generated APIs */
	operationId: string;
	/** array of parameters */
	parameters: [Parameter];
	/** array of unspecified responses */
	responses: {
		[code: string]: Response;
	};

	/** id for the test server to reference the call */
	id?: number;
	/** generated name for this call (path) */
	callName?: string;
	/** generated method name for this call (method) */
	method?: string;
	/** generated values from UI to represent the user input */
	values?: {[key: string]: any};
}

/**
 * parameter structure for the calls
 */
export interface Parameter {
	/** parameter name */
	name: string;
	/** placement, body, query, header, ... */
	in: string;
	/** description for the parameter */
	description: string;
	/** is the parameter required */
	required: boolean;
	/** type of the parameter like number, string, boolean... */
	type: string;
	/** default value */
	default: string;
	/** schema when the parameter are send a data structure */
	schema: Schema;
}

/**
 * Response structure for the calls
 */
export interface Response {
	/** name of the response */
	name?: string;

	/** description when the response will be received */
	description: string;
	/** content schema of the response */
	schema: Schema;

	/** ref name when the response is a Model */
	refName?: string;
}
