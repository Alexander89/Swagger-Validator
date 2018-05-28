import { Schema } from './swagger.models';

export interface SwaggerResponse {
	[ref: string]: {
		description: string;
		schema: Schema;
	};
}
