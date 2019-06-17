import Trigger from '../../models/trigger';
import constants from '../../constants';
import Config from '../config';
import { MessageObject } from 'webex/env';
import { Command } from '../../models/command';
import xmlMessageParser from '../parsers/xmlMessageParser';

export default class Rotation extends Trigger {
	config : Config;

	constructor(config : Config) {
		super();

		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		let parsedMessage = xmlMessageParser.parseNonPegMessage(message);
		return parsedMessage.botId === constants.botId && parsedMessage.command.toLowerCase() === Command.Rotation;
	}

	isToTriggerOnPM(message : MessageObject) : boolean {
		return message.text.toLowerCase().trim() === Command.Rotation;
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
