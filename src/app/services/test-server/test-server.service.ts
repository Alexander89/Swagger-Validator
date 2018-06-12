import { Injectable } from '@angular/core';
import * as TestServerApi from 'types/test-server';
import * as S from '@swagger/swagger';

interface Calls {
	command: TestServerApi.Command;
	resolve?: (value?: Calls) => void;
	reject?: (reason?: any) => void;
	reply?: TestServerApi.AvailableDataTypes;
	replyState?: 'ok' | 'error';
	timeStamp?: number;
	duration?: number;
}

@Injectable()
export class TestServer {
	private _address: string;
	private _sessionID: number;
	private s: WebSocket;
	private calls = [] as Array<Calls>;
	private _log = [] as Array<TestServerApi.EventMessage>;
	constructor() {

	}
	private receiveMessage(ev: MessageEvent) {
		if (ev.data === 'o') {
			return;
		}
		const msg = JSON.parse(ev.data) as TestServerApi.Command;
		console.log(`msg.command ${msg.command}`);

		let call: Calls;
		if (msg.command !== 'event') {
			call = this.calls[0];
			this.calls.splice(0, 1);
			call.duration = (Date.now() - call.timeStamp);
		}

		switch (msg.command) {
			case 'open':
			case 'close':
			case 'getCalls':
			case 'getCallData':
			case 'updatePath':
			case 'updateCallData':
				if (call.command.command !== msg.command) {
					return this.receiveMessage(ev);
				}
				call.reply = msg.data;
				call.replyState = msg.replyState;
				if (call.replyState && call.replyState === 'error') {
					call.reject(call);
				}
				call.resolve(call);
				break;
			case 'event':
				this.addEventToLog(msg.data as TestServerApi.EventMessage);
				break;
			default:
				break;
		}
	}
	private errorEvent(ev: Event) {
	}
	private closeEvent() {
	}

	/**
	 * disconnect websocket and inform the server
	 */
	public disconnect(): Promise<Calls> {
		if (this.s) {
			return new Promise<Calls>((resolve, reject) => {
				this.call('close').then(call => {
					setTimeout(() => this.s.close(), 1000);
					resolve(call);
				}).catch(r => reject(r));
			});
		}
		return new Promise<Calls>((resolve, reject) => resolve());
	}
	/**
	 * set the server data and try to connect to this
	 * @param address address of the server
	 * @param path path for the JSON definition
	 */
	public setServer(address: string, path: string): Promise<number> {
		this._address = address;
		this.s = new WebSocket(address);

		this.s.addEventListener('message', ev => this.receiveMessage(ev));
		this.s.addEventListener('error', ev => this.errorEvent(ev));
		this.s.addEventListener('close', () => this.closeEvent());

		return new Promise<number>((resolve, reject) => {
			this.s.addEventListener('open', (ev: Event) => {
				this.call('open', { path }).then(call => {
					this._sessionID = (call.reply as TestServerApi.ReplyOpen).sessionID;
					resolve(this._sessionID);
				}).catch(r => reject(r));
			});
		});
	}
	/**
	 * get all available calls from the server
	 */
	public getAvailableCalls(): Promise<Array<TestServerApi.CallData>>  {
		return new Promise<Array<TestServerApi.CallData>>((resolve, reject) => {
			this.call('getCalls').then(
				call => resolve(call.reply as TestServerApi.CallData[])
			).catch(
				r => reject(r)
			);
		});
	}
	/**
	 * prepare and send a command to the server via the websocket
	 * @param command command that should be sent
	 * @param data data to send with the command
	 */
	public call(command: TestServerApi.AvailableCommands, data?: TestServerApi.AvailableDataTypes): Promise<Calls> {
		const call: Calls = {
			command: {
				command: command,
				data: data
			}
		};
		return this.doCall(call);
	}
	/**
	 * send the command and deliver a promise to handle the result of this call
	 * @todo: add Timeout
	 * @param call call to be send over
	 */
	private doCall(call: Calls): Promise<Calls> {
		return new Promise((resolve, reject) => {
			call.resolve = resolve;
			call.reject = reject;
			call.timeStamp = Date.now();
			this.calls.push(call);
			this.s.send(JSON.stringify(call.command));
		});
	}

	/**
	 * add an eventMessage to the loss
	 * @param msg message received from the Server
	 */
	private addEventToLog(msg: TestServerApi.EventMessage) {
		msg.timestamp = Date.now();
		this._log.push(msg);
	}
	/**
	 * clear the log
	 */
	public clearLog() { this._log = []; }
	/** getter for the log entries */
	get log(): Array<TestServerApi.EventMessage> { return this._log; }
}