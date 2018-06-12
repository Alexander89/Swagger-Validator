declare namespace TestServerApi {
	type AvailableCommands =  'open' | 'close' | 'getCalls' | 'getCallData' | 'updatePath' | 'updateCallData' | 'event' ;
	type AvailableDataTypes = CommandOpen | ReplyOpen | CommandUpdatePath | CallData | CallData[] | CommandUpdateCallData | EventMessage | undefined;
	type EventTypes = 'close' | 'client' | 'server' | undefined;
	type MessageLvl = 'debug' | 'info' | 'warning' | 'error';

	interface Command {
		command: AvailableCommands;
		eventType?: EventTypes;
		data?: AvailableDataTypes;
		replyState?: 'ok' | 'error';
	}


	interface CommandOpen {
		path: string;
	}
	interface ReplyOpen {
		sessionID: number;
	}
	interface CommandUpdatePath {
		path: string;
	}
	interface CallData {
		id?: number;
		callName: string;
		method: string;
		jsonData?: string;
		data?: any;
	}
	interface CommandUpdateCallData {
		call: string;
		jsonData: CallData;
	}
	interface EventMessage {
		timestamp: number;
		lvl: MessageLvl;
		message: string;
	}
}
export = TestServerApi;
