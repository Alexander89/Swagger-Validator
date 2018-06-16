import { Component, OnInit, Input } from '@angular/core';
import { TestServer } from '@services/test-server/test-server.service';
import { EventMessage, CallData, ReturnSchema } from 'types/test-server';
import { Call, Response } from '@app/models/swagger/calls';
import { isArray } from 'util';

@Component({
  selector: 'app-test-server',
  templateUrl: './test-server.component.html',
  styleUrls: ['./test-server.component.css']
})
export class TestServerComponent implements OnInit {
	@Input() source: string;
	@Input() path: string;
	public sessionId: number;
	public _connected: boolean;

	public _selectedCall: number;
	private _availableCalls = [] as Array<CallData>;
	public currentCall: CallData;

	constructor(private readonly server: TestServer) {}

	ngOnInit() {
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
		this.server.setCallData(this.currentCall).catch(e => alert('it is not possible to set the call data'));
	}
	/** clear the local log storage */
	public clearLog() { this.server.clearLog(); }

	get connect() { return this._connected; }
	@Input('connect') set connect(value: boolean) {
		if (value) {
			this.server.setServer('ws://' + this.source, this.path).then(id => {
				this.sessionId = id;
				this._connected = true;
				this.server.getAvailableCalls().then(calls => {
					this._availableCalls = calls;
					this._availableCalls.forEach(call => {
						Object.getOwnPropertyNames(call.call.responses).forEach(res => call.call.responses[res].name = res);
					});
				});
			});
		} else {
			this.server.disconnect().then((c) => this._connected = false);
		}
	}
	/** get all log data */
	get log(): Array<EventMessage> { return this.server.log; }
	get availableCalls(): Array<CallData> { return this._availableCalls; }

	get selectedCall(): number { return this._selectedCall; }
	set selectedCall(value) {
		this._selectedCall = +value;
		const data = this.availableCalls.find(c => c.id === this._selectedCall);
		if (data) {
			try {
				this.currentCall = data;
			} catch (e) {
				console.error('can not parse JSON ' + e);
			}
		}
	}

	get responses(): Array<Response> {
		const names = Object.getOwnPropertyNames(this.currentCall.call.responses);
		return names.map(name => this.currentCall.call.responses[name]);
	}
	public trackAvCalls(index, call: Call) { return call.id; }
	public trackResponses(index, resp: Response) { return resp.name; }

	get selectedResult(): string { return this._availableCalls[this.selectedCall].jsonData.selectedResponse; }
	set selectedResult(call: string) { this._availableCalls[this.selectedCall].jsonData.selectedResponse = call; }
}
