/**
 * info block to give more information for this API
 */
export interface Info {
	/** Version of this API definition */
	version?: string;
	/** Name of the API */
	title?: string;
	/** description for the API */
	description?: string;
	/** contact who is working on the API */
	contact?: {[key: string]: string};
}
