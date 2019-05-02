import constants from '../../constants';
import Trigger from '../../models/trigger';
import { MessageObject } from 'ciscospark/env';
import * as pjson from 'pjson';
import { Command } from '../../models/command';

const pingCommand = `(?: )*${Command.Ping}(?: )*`;

export default class Ping extends Trigger {
	isToTriggerOn(message : MessageObject) : boolean {
		let pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + pingCommand, 'ui');
		return pattern.test(message.html);
	}

	isToTriggerOnPM(message : MessageObject) : boolean {
		return message.text.toLowerCase().trim() === Command.Ping;
	}

	async createMessage() : Promise<MessageObject> {
		return {
			markdown: `pong. I'm alive! (version ${pjson.version}) (build ${process.env.BUILD_NUMBER})`
		};
	}
}
