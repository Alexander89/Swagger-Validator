import {
	Info,
	Tag,
	Calls,
	SwaggerModels,
	SwaggerResponse,
} from './swagger';

/** root element for swagger interpretation */
export interface Root {
	/** swagger version */
	swagger?: string;
	/** Info block about the API */
	info?: Info;
	/** Host to connect to */
	host?: string;
	/** USR base path for the calls */
	basePath?: string;
	/** Tags to gif the calls a usage structure */
	tags?: Array<Tag>;
	/** call schemes like http or https... */
	schemes?: Array<string>;
	/** all calls from the api */
	paths?: Calls;
	/** all models for the API */
	definitions?: SwaggerModels;
	/** all responses for the calls */
	responses?: {[respName: string]: SwaggerResponse};
}
