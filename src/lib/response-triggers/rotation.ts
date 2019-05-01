import Trigger from '../../models/trigger';
import constants from '../../constants';
import Config from '../config';
import { MessageObject } from 'ciscospark/env';

export default class Rotation extends Trigger {
	readonly commandText : string = 'rotation';
	readonly rotationCommand : string = `(?: )*${this.commandText}(?: )*`;

	config : Config;

	constructor(config : Config) {
		super();

		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		let pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + this.rotationCommand, 'ui');
		return pattern.test(message.html);
	}

	isToTriggerOnPM(message : MessageObject) : boolean {
		return message.text.toLowerCase().trim() === this.commandText;
	}

	async createMessage() : Promise<MessageObject> {
		const data = this.config.getStringConfig('rotation')[0];

		let newMessage = `## Here's the snack buying rotation:\n\n`;

		data.split(',').forEach(item => {
			newMessage += `* ${item}\n`;
		});

		return {
			markdown: newMessage
		};
	}
};
