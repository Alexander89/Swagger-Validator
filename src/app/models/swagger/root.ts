import {
	Info,
	Tag,
	Calls,
	SwaggerModels,
	SwaggerResponse,
} from './swagger';

/** root element for swagger interpretation */
export interface Root {
	/**  */
	swagger?: string;
	/**  */
	info?: Info;
	/**  */
	host?: string;
	/**  */
	basePath?: string;
	/**  */
	tags?: Array<Tag>;
	/**  */
	schemes?: Array<string>;
	/**  */
	paths?: Calls;
	/**  */
	definitions?: SwaggerModels;
	/**  */
	responses?: {[respName: string]: SwaggerResponse};
}
