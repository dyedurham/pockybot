import Trigger from '../../models/trigger';
import Config from '../config';
import constants from '../../constants';
import { MessageObject } from 'ciscospark/env';
import { Command } from '../../models/command';

export default class Keywords extends Trigger {
	readonly keywordsCommand : string = `(?: )*${Command.Keywords}(?: )*`;

	config : Config;

	constructor(config : Config) {
		super();

		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		let pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + this.keywordsCommand, 'ui');
		return pattern.test(message.html);
	}

	isToTriggerOnPM(message : MessageObject) : boolean {
		return message.text.toLowerCase().trim() === Command.Keywords;
	}

	async createMessage() : Promise<MessageObject> {
		let newMessage = '## Here is the list of possible keywords to include in your message\n\n';

		this.config.getStringConfig('keyword').forEach(item => {
			newMessage += `* ${item}\n`;
		});

		return {
				markdown: newMessage
		};
	}
}
