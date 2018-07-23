import { Injectable } from '@angular/core';
import * as TestServerApi from 'types/test-server';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

/** interface for calls to the testServer */
interface Calls {
	/** requested command to execute on the server */
	command: TestServerApi.Command;
	/** callback, when command was executed */
	resolve?: (value?: Calls) => void;
	/** callback, when commend was failed */
	reject?: (reason?: any) => void;
	/** data, send back from Test-Server */
	reply?: TestServerApi.AvailableDataTypes;
	/** status of the reply ok or error */
	replyState?: 'ok' | 'error';
	/** time, when the request was send */
	timeStamp?: number;
	/** duration how long the request toke */
	duration?: number;
}

@Injectable()
export class TestServer {
	private _address: string;
	private _sessionID: string;
	private s: WebSocket;
	private calls = [] as Array<Calls>;
	private _log = [] as Array<TestServerApi.EventMessage>;

	private readonly _closeConnectionSource = new BehaviorSubject<boolean>(false);
	/** observable to subscribe to new server connection closed */
	public closeConnection = this._closeConnectionSource.asObservable();

	constructor() {

	}
	/**
	 * handle the incoming messages for the websocket
	 * @param ev Message event with the data
	 */
	private receiveMessage(ev: MessageEvent) {
		if (ev.data === 'o') {
			return;
		}
		const msg = JSON.parse(ev.data) as TestServerApi.Command;

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
			case 'setSessionName':
			case 'changeSession':
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
	/**
	 * Event handler, when something bad happend on the socked
	 * @param ev error event
	 */
	private errorEvent(ev: Event) {
	}
	/**
	 * event handler, when the socket closed the connection
	 */
	private closeEvent() {
		this._closeConnectionSource.next(true);
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
	public setServer(address: string, path: string): Promise<string> {
		this._address = address;
		this.s = new WebSocket(address);

		this.s.addEventListener('message', ev => this.receiveMessage(ev));
		this.s.addEventListener('error', ev => this.errorEvent(ev));
		this.s.addEventListener('close', () => this.closeEvent());

		return new Promise<string>((resolve, reject) => {
			this.s.addEventListener('open', (ev: Event) => {
				this.call('open', { path }).then(call => {
					this._sessionID = (call.reply as TestServerApi.ReplyOpen).sessionID;
					resolve(this._sessionID);
				}).catch(r => reject(r));
			});
			this.s.addEventListener('close', () => {
				reject('socket closed');
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
	 * Send the new configured call to the test-Server
	 * @param data data to set on the server
	 */
	public setCallData(call: TestServerApi.CallData): Promise<TestServerApi.CallData> {
		return new Promise<TestServerApi.CallData>((resolve, reject) => {
			this.call('updateCallData', {config: call.jsonData, callId: call.id}).then(
				rep => resolve(rep.reply as TestServerApi.CallData)
			).catch(
				r => reject(r)
			);
		});
	}

	/**
	 * update the name of an permanent session by sending the setSessionName command to the server
	 * @param newName new session name to store it in the database
	 */
	public setSessionName(newName: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.call('setSessionName', newName).then(
				() => resolve()
			).catch(
				r => reject(r)
			);
		});
	}

	/**
	 * send the changeSession to the server, to switch to an other session
	 * @param name session to switch to
	 */
	public changeSession(name: string): Promise<Array<TestServerApi.CallData>> {
		return new Promise<Array<TestServerApi.CallData>>((resolve, reject) => {
			this.call('changeSession', name).then(
				rep => resolve(rep.reply as Array<TestServerApi.CallData>)
			).catch(
				r => reject(r)
			);
		});
	}

	/**
	 * update a call on the Test-Server
	 * @param path Path to he JSON file to load the data from
	 * @param call call to be updated
	 */
	public upgradeCall(path: string, call: TestServerApi.CallData) {
		const data = {
			path,
			callName: call.callName,
			method: call.method
		} as TestServerApi.UpgradeCallData;
		return new Promise<Array<TestServerApi.CallData>>((resolve, reject) => {
			this.call('upgradeCall', data).then(
				rep => resolve(rep.reply as Array<TestServerApi.CallData>)
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
