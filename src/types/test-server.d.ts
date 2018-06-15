import { Call } from '../app/models/swagger/swagger';

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
	interface CommandUpdateCallData {
		call: string;
		jsonData: CallData;
	}
	interface EventMessage {
		timestamp: number;
		lvl: MessageLvl;
		message: string;
	}

	interface ReturnSchema {
		name: string;
		type: 'object' | 'array' | 'integer' | 'number' | 'string' | 'boolean' | 'float';
		example: any;
		required: boolean;
		present: boolean;
		objectSchema?: Array<ReturnSchema>;
		arraySchema?: Array<ReturnSchema>;
	}
	interface CallConfigStructure {
		availableResponses: Array<string>;
		selectedResponse: string;
		returnStructures: {[returnState: string]: ReturnSchema};
	}
	interface CallData {
		id?: number;
		callName: string;
		method: string;
		call: Call;
		jsonData?: CallConfigStructure;
	}
}
export = TestServerApi;
