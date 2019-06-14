import Trigger from '../../models/trigger';
import Config from '../config';
import constants from '../../constants';
import { MessageObject } from 'ciscospark/env';
import { Command } from '../../models/command';
import xmlMessageParser from '../parsers/xmlMessageParser';

export default class Keywords extends Trigger {
	config : Config;

	constructor(config : Config) {
		super();

		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		let parsedMessage = xmlMessageParser.parseXmlMessage(message);
		return parsedMessage.length === 2 && parsedMessage[0].name() === 'spark-mention' && message.mentionedPeople[0] === constants.botId
			&& parsedMessage[1].text().trim().toLowerCase() === Command.Keywords;
	}

	isToTriggerOnPM(message : MessageObject) : boolean {
		return message.text.toLowerCase().trim() === Command.Keywords;
	}

	async createMessage() : Promise<MessageObject> {
		let newMessage = '## Here is the list of possible keywords to include in your message\n\n';

		this.config.getStringConfig('keyword').forEach(item => {
			newMessage += `* ${item}\n`;
		});

		const penaltyKeywords = this.config.getStringConfig('penaltyKeyword');
		if (penaltyKeywords.length > 0) {
			newMessage += '\n## Here is the list of keywords that can be used to apply a penalty to the sender\n\n';
			newMessage += 'Penalty keywords do not count against the peg limit, and are *not* applied to messages that also include standard keywords.\n\n';
			newMessage += penaltyKeywords.map(keyword => `* ${keyword}\n`);
		}

		return {
			markdown: newMessage
		};
	}
}
