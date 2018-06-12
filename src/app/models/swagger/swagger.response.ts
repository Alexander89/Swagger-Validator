import { Schema } from './swagger.models';

/**
 * Represent all existing responses in the API definition
 */
export interface SwaggerResponse {
	/** response code (200, 204, 401, ...) */
	[ref: string]: {
		/** description like Data Returned, Data Not Found, ... */
		description: string;
		/** model with contains de data */
		schema?: Schema;
	};
}
