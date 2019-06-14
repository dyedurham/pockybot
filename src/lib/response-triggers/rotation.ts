import Trigger from '../../models/trigger';
import constants from '../../constants';
import Config from '../config';
import { MessageObject } from 'ciscospark/env';
import { Command } from '../../models/command';
import xmlMessageParser from '../parsers/xmlMessageParser';

export default class Rotation extends Trigger {
	config : Config;

	constructor(config : Config) {
		super();

		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		let parsedMessage = xmlMessageParser.parseXmlMessage(message);
		return parsedMessage.length === 2 && parsedMessage[0].name() === 'spark-mention'
		&& xmlMessageParser.getPersonId(parsedMessage[0].attr('data-object-id').value()) === constants.botId
			&& parsedMessage[1].text().trim().toLowerCase() === Command.Rotation;
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
