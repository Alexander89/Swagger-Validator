import * as S from '@swagger/swagger';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class Swagger {
	/** swagger definition */
	public _def: S.Root;
	/** selected request scheme */
	public selectedRequestScheme: string;

	constructor(protected httpClient: HttpClient) {}

	/**
	 * resolve all reference tags and set the models in the calls and Responses
	 * @param def Rood for the swagger definition
	 */
	public static resolveRef(def: S.Root): S.Root {
		let strDef = JSON.stringify(def);
		const replaced = new Array<string>(); // for cycle detection

		// helper functions
		const trimObj = (json: string): string => {
			if (json.length < 2) {
				return '';
			}
			return json.substr(1, json.length - 2);
		};
		const getModelAsString = (name: string): string => {
			const model = def.definitions[name];
			if (!model) {
				throw new ReferenceError(`ref to undefined Model ${name}`);
			}
			return trimObj(JSON.stringify(model));
		};
		const getResponseAsString = (name: string): string => {
			const response = def.responses[name];
			if (!response) {
				throw new ReferenceError(`ref to undefined Responses ${name}`);
			}
			return trimObj(JSON.stringify(response));
		};
		const replaceAll = (placeHolder: string, replace: string): void => {
			if (replaced.indexOf(placeHolder) !== -1) {
				throw new SyntaxError(`STOP! A ref cycle is detected in ${placeHolder}`);
			}
			while (true) {
				if (strDef.indexOf(placeHolder) === -1) {
					return;
				}
				strDef = strDef.replace(placeHolder, replace);
			}
		};

		// task to replace $ref
		while (true) {
			const refPos = strDef.indexOf('"$ref"');
			if (refPos === -1) {
				break;
			}
			// fix positions in ref string
			const defPos = strDef.indexOf('#', refPos) + 2;
			const slashPos = strDef.indexOf('/', defPos);
			const modelPos = slashPos + 1;
			const endPos = strDef.indexOf('"', slashPos);

			// extract strings
			const refType = strDef.substr(defPos, slashPos - defPos);
			const name = strDef.substr(modelPos, endPos - modelPos);
			const fullRefString = strDef.substr(refPos, endPos + 1 - refPos); // +1 for the last "

			// replace with Model or response
			if (refType === 'definitions') {
				replaceAll(fullRefString, getModelAsString(name));
			} else if (refType === 'responses') {
				replaceAll(fullRefString, getResponseAsString(name));
			}
		}
		return JSON.parse(strDef);
	}

	/**
	 * return the Model in the reference string
	 * @param ref reference string
	 */
	public static splitRef(ref: string): string {
		const split = ref.lastIndexOf('/') + 1;
		return ref.substr(split);
	}
	/**
	 * return the type of an Parameter from the definition
	 * @param param Swagger parameter definition
	 */
	public static extractType(param: S.Parameter): string {
		if (param.in === 'body') {
			if (param.schema && param.schema.name) {
				return param.schema.name;
			}
		}
		return param.type;
	}
	/**
	 * return the type for the status 200 response
	 * @param call Call to get the return type
	 */
	public static extractReturnType(call: S.Call): string | undefined {
		if (!call.responses || !call.responses[200] || !call.responses[200].schema) {
			return undefined;
		}
		return this.splitRef(call.responses[200].refName);
	}

	/** getter for the swagger definition */
	get def() { return this._def; }
	/** set a new swagger definition, resolve all Models and set the method and callName for each call */
	set def(value: S.Root) {
		this._def = value;
		if (this._def !== undefined && this._def.paths) {
			// add callName and method to the call
			Object.getOwnPropertyNames(this._def.definitions).forEach(model => this._def.definitions[model].name = model);

			this.pathArray.forEach(callGroup => {
				callGroup.methods.forEach(method => {
					method.call.callName = callGroup.callName;
					method.call.method = method.method;
					method.call.values = {};
					method.call.parameters.forEach(p => method.call.values[p.name] = p.default || '');
					Object.getOwnPropertyNames(method.call.responses).forEach(r => {
						if (method.call.responses[r].schema && method.call.responses[r].schema.$ref) {
							method.call.responses[r].refName = method.call.responses[r].schema.$ref;
						} else {
							method.call.responses[r].refName = method.call.responses[r].schema ? 'inline' : '';
						}
					});
				});
			});
			this._def = Swagger.resolveRef(this._def);
		}
	}
	/** get a array of all calls with callName and methode */
	get pathArray(): Array<{callName: string, methods: Array<{method: string, call: S.Call}>}> {
		if (!this.def) {
			return [{callName: '', methods: []}];
		}
		const paths = this.def.paths as any;
		return Object.getOwnPropertyNames(paths).map(key => {
			const methods = Object.getOwnPropertyNames(paths[key]).map(method => {
				return {method, call: paths[key][method] as S.Call};
			});
			return {
				callName: key,
				methods
			};
		});
	}

	/**
	 * get a call from the paths with the given name and method.
	 * can return undefined
	 * @param callName call name to pick up
	 * @param method method type to pick up
	 */
	public getCall(callName: string, method: string): S.Call | undefined {
		const callGroup = this.def.paths[callName];
		if (!callGroup) {
			return undefined;
		}
		return callGroup[method];
	}
	/**
	 * set the parameter values for the call to the default value or to ''
	 * @param call call to reset the parameter values
	 */
	public resetCall(call: S.Call) {
		if (call && call.parameters) {
			call.parameters.forEach(p => call.values[p.name] = p.default || '');
		}
	}

	/**
	 * do the call with the definition and the set values
	 * @param call call to send the process Request
	 */
	public procRequest(call: S.Call): Observable<string> {
		return new Observable<string>(ob => {
			ob.next('build Request');
			const req = this.makeRequest(call);
			ob.next('send Request');
			this.sendRequest(call, req).subscribe(res => {
				ob.next('received success');
				ob.next(JSON.stringify(res));
				ob.complete();
			}, e => {
				ob.error({error: JSON.stringify(e), status: e.status});
			});
		});
	}
	/**
	 * Send a predefined request over the network and return an observable for the reply
	 * @param call swagger call to be send
	 * @param req pre designed request to send
	 */
	protected sendRequest(call: S.Call, req: any): Observable<any> {
		let headers = req.header;
		headers = headers.append('access-control-allow-origin', '*');
		headers = headers.append('content-type', 'application/json');
		headers = headers.append('accept', 'application/json');

		const options = {
			headers,
			observe: 'body' as 'body',
			reportProgress: false
		};

		switch (call.method) {
			case 'get':
				return this.httpClient.get<any>(
					req.src,
					options
				);
			case 'put':
				return this.httpClient.put<any>(
					req.src,
					req.body,
					options
				);
			case 'post':
				return this.httpClient.post<any>(
					req.src,
					req.body,
					options
				);
		}
	}
	/**
	 * make request. create parameters in the query, header and body values
	 * @param call Swagger defined call to do the request
	 */
	private makeRequest(call: S.Call) {
		const def = this.def;
		const base = `${this.selectedRequestScheme}://${def.host}${def.basePath}`;
		let body = null;
		let header = new HttpHeaders('test = 1');
		let query = '';

		let request = call.callName;
		call.parameters.forEach(p => {
			if (p.in === 'query') {
				query += `${query.length === 0 ? '?' : '&'}${p.name}=${call.values[p.name]}`;
			} else if (p.in === 'path') {
				request = request.replace(`{${p.name}}`, call.values[p.name]);
			} else if (p.in === 'header') {
				header = header.set(p.name, call.values[p.name]);
			} else if (p.in === 'body') {
				body = call.values[p.name];
			} else {
				console.error(`${p.name} is not supported`);
			}
		});
		request = request.replace('{', '');
		request = request.replace('}', '');
		return {
			src: base + request + query,
			body,
			header
		};
	}
}

// shortcut for static functions
/**
 * use the Swagger service to split the reference
 * @param ref reference to get the model
 */
export const splitRef = (ref: string): string => {
	return Swagger.splitRef(ref);
};

/**
 * use the Swagger service to extract the parameter type
 * @param ref parameter to get the return type
 */
export const extractType = (param: S.Parameter): string => {
	return Swagger.extractType(param);
};

/**
 * use the Swagger service to extract the return type
 * @param call Call to extract the return type
 */
export const extractReturnType = (call: S.Call): string | undefined => {
	return Swagger.extractReturnType(call);
};
