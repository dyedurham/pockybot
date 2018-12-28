import constants from '../../constants';
import Trigger from '../types/trigger';
import { MessageObject } from 'ciscospark/env';

const commandText = 'ping';
const pingCommand = `(?: )*${commandText}(?: )*`;

export default class Ping extends Trigger {
	isToTriggerOn(message : MessageObject) : boolean {
		var pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + pingCommand, 'ui');
		return pattern.test(message.html);
	}

	isToTriggerOnPM(message : MessageObject) : boolean {
		return message.text.toLowerCase().trim() === commandText;
	}

	async createMessage() : Promise<MessageObject> {
		return {
			markdown: `pong. I'm alive!`
		};
	}
}
