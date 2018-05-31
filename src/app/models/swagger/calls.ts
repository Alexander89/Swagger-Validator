import { Schema } from './swagger.models';

export interface Calls {
	[name: string]: {
		[type: string]: Call;
	};
}

export interface Call {
	tags: Array<string>;
	summary: string;
	description: string;
	operationId: string;
	parameters: [Parameter];
	responses: {
		[code: string]: Response;
	};

	callName?: string;
	method?: string;
	values?: {[key: string]: any};
}

export interface Parameter {
	name: string;
	in: string;
	description: string;
	required: boolean;
	type: string;
	default: string;
	schema: Schema;
}

export interface Response {
	description: string;
	schema: Schema;

	refName?: string;
}
