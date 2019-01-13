import constants from '../../constants';
import Trigger from '../../models/trigger';
import { MessageObject } from 'ciscospark/env';
import * as pjson from 'pjson';

const commandText = 'ping';
const pingCommand = `(?: )*${commandText}(?: )*`;

export default class Ping extends Trigger {
	isToTriggerOn(message : MessageObject) : boolean {
		let pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + pingCommand, 'ui');
		return pattern.test(message.html);
	}

	isToTriggerOnPM(message : MessageObject) : boolean {
		return message.text.toLowerCase().trim() === commandText;
	}

	async createMessage() : Promise<MessageObject> {
		return {
			markdown: `pong. I'm alive! (version ${pjson.version})`
		};
	}
}
