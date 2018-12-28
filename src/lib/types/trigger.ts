import { MessageObject } from "ciscospark/env";

export default class Trigger {
	isToTriggerOn(message : MessageObject) : boolean {
		return false;
	}

	isToTriggerOnPM(message : MessageObject) : boolean {
		return false;
	}

	async createMessage(message ?: MessageObject, room ?: any) : Promise<MessageObject> {
		return {
			markdown: ""
		}
	}
}
