import * as S from '@swagger/swagger';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable()
export class Swagger {
	public _def: S.Root;
	public selectedRequestSchema: string;

	constructor(protected httpClient: HttpClient) {}

	public static splitRef(ref: string): string {
		const split = ref.lastIndexOf('/') + 1;
		return ref.substr(split);
	}
	public static extractType(param: S.Parameter): string {
		if (param.in === 'body') {
			if (param.schema && param.schema.$ref) {
				return Swagger.splitRef(param.schema.$ref);
			}
		}
		return param.type;
	}
	public static extractReturnType(call: S.Call): string | undefined {
		if (!call.responses || !call.responses[200] || !call.responses[200].schema || !call.responses[200].schema.$ref) {
			return undefined;
		}
		return splitRef(call.responses[200].schema.$ref);
	}

	get def() { return this._def; }
	set def(value: S.Root) {
		this._def = value;
		if (value !== undefined && value.paths) {
			// add callName and method to the call
			this.pathArray.forEach(callGroup => {
				callGroup.methods.forEach(method => {
					method.call.callName = callGroup.callName;
					method.call.method = method.method;
					method.call.values = {};
					method.call.parameters.forEach(p => {
						if (!method.call.values[p.name]) {
							method.call.values[p.name] = p.default || '';
						}
					});
				});
			});
		}
	}

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

	public getCall(callName: string, method: string): S.Call {
		const callGroup = this.def.paths[callName];
		if (!callGroup) {
			return undefined;
		}
		return callGroup[method];
	}
	public resetCall(call: S.Call) {
		if (call && call.parameters) {
			call.parameters.forEach(p => call.values[p.name] = p.default || '');
		}
	}

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
				ob.error(JSON.stringify(e));
			});
		});
	}
	protected sendRequest(call: S.Call, req: any): Observable<any> {
		const headers = req.header;
		headers.append('Access-Control-Allow-Origin', '*');

		switch (call.method) {
			case 'get':
				return this.httpClient.get<any>(
					req.src,
					{
						headers,
						observe: 'body',
						reportProgress: false
					}
				);
			case 'put':
				return this.httpClient.put<any>(
					req.src,
					req.body,
					{
						headers,
						observe: 'body',
						reportProgress: false
					}
				);
			case 'post':
				return this.httpClient.post<any>(
					req.src,
					req.body,
					{
						headers,
						observe: 'body',
						reportProgress: false
					}
				);
		}
	}
	private makeRequest(call: S.Call) {
		const def = this.def;
		const base = `${this.selectedRequestSchema}://${def.host}${def.basePath}`;
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
export const splitRef = (ref: string): string => {
	return Swagger.splitRef(ref);
};

export const extractType = (param: S.Parameter): string => {
	return Swagger.extractType(param);
};

export const extractReturnType = (call: S.Call): string | undefined => {
	return Swagger.extractReturnType(call);
};
