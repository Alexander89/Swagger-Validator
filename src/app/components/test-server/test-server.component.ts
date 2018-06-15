import { Component, OnInit, Input } from '@angular/core';
import { TestServer } from '@services/test-server/test-server.service';
import { EventMessage, CallData } from 'types/test-server';
import { Call, Response } from '@app/models/swagger/calls';

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
	public currentCall: Call;
	private _availableCalls = [] as Array<CallData>;

	constructor(private readonly server: TestServer) {}

	ngOnInit() {
	}

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
	/** clear the local log storage */
	public clearLog() { this.server.clearLog(); }
	/** get all log data */
	get log(): Array<EventMessage> { return this.server.log; }
	get availableCalls(): Array<CallData> { return this._availableCalls; }

	get selectedCall(): number { return this._selectedCall; }
	set selectedCall(value) {
		this._selectedCall = +value;
		const data = this.availableCalls.find(c => c.id === this._selectedCall);
		if (data) {
			try {
				this.currentCall = data.call;
			} catch (e) {
				console.error('can not parse JSON ' + e);
			}
		}
	}

	get responses(): Array<Response> {
		const names = Object.getOwnPropertyNames(this.currentCall.responses);
		return names.map(name => this.currentCall.responses[name]);
	}
	public trackAvCalls(index, call: Call) { return call.id; }
	public trackResponses(index, resp: Response) { return resp.name; }
}
