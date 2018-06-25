import { Component, OnInit, DoCheck, Input, ChangeDetectorRef } from '@angular/core';
import { TestServer } from '@services/test-server/test-server.service';
import { EventMessage, CallData, ReturnSchema } from 'types/test-server';
import { Call, Response } from '@app/models/swagger/calls';
import { isArray } from 'util';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import * as S from '../../models/swagger/swagger';
import { Swagger } from '@app/services/swagger';

@Component({
  selector: 'app-test-server',
  templateUrl: './test-server.component.html',
  styleUrls: ['./test-server.component.css']
})
export class TestServerComponent implements OnInit, DoCheck {
	@Input() path: string;	// JSON path
	private _source: string;
	private _scheme: string;
	public sessionId: string;
	private _connected = false;
	public connectError = '';

	public newSessionName: string;
	public selectedSessionName: string;

	public _selectedCall = -1;
	private _availableCalls = [] as Array<CallData>;
	public currentCall: CallData;

	private lastUpdate: string;
	private autoSaveTimer: number;

	public showSchemePopup = false;
	public showSessionConfig = false;
	public sessionManagerMode = '';
	public manageRouteError = '';
	public updateCall = -1;
	public newCalls = [] as Array<CallData>;

	constructor(
		private readonly server: TestServer,
		private readonly cD: ChangeDetectorRef,
		private readonly httpClient: HttpClient,
		private readonly cd: ChangeDetectorRef
	) {
		this._source = localStorage.getItem('testServer') || '';
		this._scheme = localStorage.getItem('testScheme') || 'https://';
	}

	ngOnInit() {
		this.server.closeConnection.subscribe(state => {
			if (state === true) {
				this.connectError = 'connection closed by server.';
				this._connected = false;
				this.cd.detectChanges();
			}
		});
	}

	ngDoCheck() {
		if (this.currentCall) {
			const checksum = JSON.stringify(this.currentCall.jsonData);
			if (this.lastUpdate !== checksum) {
				this.lastUpdate = checksum;
				window.clearTimeout(this.autoSaveTimer);
				this.autoSaveTimer = window.setTimeout(() => {
					this.applyCall();
				}, 3000);
			}
		}
	}

	public setSessionName() {
		this.server.setSessionName(this.newSessionName).then(
			() => this.sessionId = this.newSessionName
		).catch(
			() => alert('it is not possible make a permanent session')
		);
	}
	public changeSession() {
		this.server.changeSession(this.selectedSessionName).then(
			data => {
				this.selectedCall = undefined;
				this.sessionId = this.selectedSessionName;
				this.applyAvailableCalls(data);
				this.cD.markForCheck();
			}
		).catch(
			() => alert(`Session ${this.selectedSessionName} was not found`)
		);
	}

	public newSession() {

	}
	public copySession() {

	}
	public openUpdateCall() {
		this.manageRouteError = '';
		const headers = new HttpHeaders();
		headers.append('Access-Control-Allow-Origin', '*');
		this.httpClient.get<S.Root>(
			this.path,
			{ headers, observe: 'body', reportProgress: false }
		).subscribe(resp => {
			try {
				const sw = new Swagger(this.httpClient);
				sw.def = resp;
				this.newCalls = [];
				let id = 0;
				sw.pathArray.forEach(p => {
					p.methods.forEach(m => {
						this.newCalls.push({
							id: id++,
							callName: p.callName,
							method: m.method,
							call: m.call
						});
					});
				});
				this.sessionManagerMode = 'update';
			} catch (e) {
				this.manageRouteError = 'Definition is in the wrong format';
			}
		}, error => {
			this.manageRouteError = 'can not read Definition from path';
		});
	}

	public updateCallNow() {
		if (this.updateCall !== -1) {
			this.server.upgradeCall(this.path, this.newCalls[this.updateCall]).catch(() => alert('it is not possible to set the call data'));
		}
	}

	public getCurrentReturnSchema(type: string): ReturnSchema { return this.currentCall.jsonData.returnStructures[type]; }

	public removeArrayItem(schema: ReturnSchema, index: number) {
		if (schema.arraySchema.length === 1) {
			schema.arraySchema[0].present = false;
		} else {
			schema.arraySchema.splice(index, 1);
		}
	}
	public addArrayItem(schema: ReturnSchema) {
		schema.arraySchema.push(this.deepCopy(schema.arraySchema[schema.arraySchema.length - 1]));
	}

	private deepCopy(obj) {
		// Copy Date
		if (obj instanceof Date) {
			return new Date(obj.getTime());
		}

		// Copy Array
		if (isArray(obj)) {
			return obj.map(el => this.deepCopy(el));
		}

		// Copy Object
		if (typeof obj === 'object') {
			const copy = {} as any;
			Object.getOwnPropertyNames(obj).forEach(prop => copy[prop] = this.deepCopy(obj[prop]));
			return copy;
		}

		return obj;
	}
	/**
	 * send the set data to the Test-Server
	 */
	public applyCall() {
		this.server.setCallData(this.currentCall).catch(() => alert('it is not possible to set the call data'));
	}

	public applyAvailableCalls(calls: Array<CallData>) {
		this._availableCalls = calls;
		this._availableCalls.forEach(call => {
			Object.getOwnPropertyNames(call.call.responses).forEach(res => call.call.responses[res].name = res);
		});
	}

	/** clear the local log storage */
	public clearLog() { this.server.clearLog(); }

	/**
	 * connect to the Web-Socket server, set the _connect flag and the connectError
	 */
	public connect() {
		this.connectError = '';
		if (this.connected) {
			this.server.disconnect().then((c) => this._connected = false);
		} else {
			const address = (this._scheme === 'http' ? 'ws://' : 'wss://') + this.source;
			this.server.setServer(address, this.path).then(id => {
				this.sessionId = id;
				this._connected = true;
				this.server.getAvailableCalls().then(calls => this.applyAvailableCalls(calls)).catch(() => this._connected = false);
			}).catch(e => {
				this.connectError = 'Could not connect to Server';
			});
		}
	}


	/** get all log data */
	get log(): Array<EventMessage> { return this.server.log; }
	/** return an array with all available calls. This will be used for the UI */
	get availableCalls(): Array<CallData> { return this._availableCalls; }

	/** return the id of the selected call */
	get selectedCall(): number { return this._selectedCall; }
	/** set the id for the selected call and set the currentCall */
	set selectedCall(value) {
		this._selectedCall = +value;
		this.currentCall = this.availableCalls.find(c => c.id === this._selectedCall);
	}

	/** return all available responses */
	get responses(): Array<Response> {
		const names = Object.getOwnPropertyNames(this.currentCall.call.responses);
		return names.map(name => this.currentCall.call.responses[name]);
	}
	/** tracker for the AvailableCall array */
	public trackAvCalls(index, call: Call) { return call.id; }
	/** tracker for the Response array */
	public trackResponses(index, resp: Response) { return resp.name; }

	/** return the response of the current selected call */
	get selectedResult(): string { return this._availableCalls[this.selectedCall].jsonData.selectedResponse; }
	/** set the call data for the response of the current selected call */
	set selectedResult(call: string) { this._availableCalls[this.selectedCall].jsonData.selectedResponse = call; }

	/** getter for the connection state to the Web-Socket-Server */
	get connected(): boolean { return this._connected; }

	/** set the source to the template and update the localStore */
	set source(src: string) {
		src = src.replace('http://', '').replace('https://', '');
		localStorage.setItem('testServer', src);
		this._source = src;
	}
	/** set the JSON source */
	get source(): string { return this._source; }

	/** set the source to the template and update the localStore */
	set scheme(scheme: string) {
		localStorage.setItem('testScheme', scheme);
		this._scheme = scheme;
	}
	/** set the JSON scheme */
	get scheme(): string { return this._scheme; }
	/** returns true if the current session in an permanent saved session */
	get isPermanent(): boolean { return this.sessionId.match(/^[a-z][a-z0-9-_]{0,}/i) as any; }
}
