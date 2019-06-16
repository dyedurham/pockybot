import Trigger from '../../models/trigger';
import constants from '../../constants';
import Config from '../config';
import { MessageObject } from 'webex/env';
import { Command } from '../../models/command';

export default class Rotation extends Trigger {
	readonly rotationCommand : string = `(?: )*${Command.Rotation}(?: )*`;

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
		return message.text.toLowerCase().trim() === Command.Rotation;
	}

	async createMessage() : Promise<MessageObject> {
		const data = this.config.getStringConfig('rotation')[0];

		let newMessage = `## Here's the snack buying rotation:\n\n`;

		data.split(',').forEach(item => {
			const name = item.charAt(0).toUpperCase() + item.substring(1);
			newMessage += `* ${name}\n`;
		});

		return {
			markdown: newMessage
		};
	}
};
