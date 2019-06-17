import { MessageObject } from 'webex/env';

export default class Trigger {
	isToTriggerOn(message : MessageObject) : boolean {
		return false;
	}

	isToTriggerOnPM(message : MessageObject) : boolean {
		return false;
	}

	async createMessage(message ?: MessageObject, room ?: string) : Promise<MessageObject> {
		return {
			markdown: ''
		}
	}
}
