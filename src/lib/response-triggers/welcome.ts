import Trigger from '../../models/trigger';
import constants from '../../constants';
import Config from '../config';
import { MessageObject } from 'ciscospark/env';
import { Command } from '../../models/command';
import xmlMessageParser from '../parsers/xmlMessageParser';

export default class Welcome extends Trigger {
	config : Config;
	constructor(config : Config) {
		super();

		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		let parsedMessage = xmlMessageParser.parseXmlMessage(message);
		return parsedMessage.length >= 2 && parsedMessage[0].name() === 'spark-mention' && message.mentionedPeople[0] === constants.botId
			&& parsedMessage[1].text().trim().toLowerCase().startsWith(Command.Welcome);
	}

	isToTriggerOnPM(message : MessageObject) : boolean {
		return message.text.toLowerCase().trim() === Command.Welcome;
	}

	async createMessage() : Promise<MessageObject> {
		let markdown = `## Hello world!
I'm ${constants.botName}. I help you spread the word about the great work that your team mates are doing! I hand out pegs to everyone you tell me about.`;

		if (this.config.getConfig('requireValues')) {
			markdown += ` Tell us why you’re giving them a peg and include the relevant company values in your description: ${this.config.getStringConfig('keyword').join(', ')}.`;
		} else {
			markdown += ` Make sure to tell us why you’re giving them a peg.`;
		}

		markdown += `\n\nBut also... if you spot someone shaming our PC security by leaving their desktop unlocked - you can award them a shame peg!

Find out how I work by typing @${constants.botName} help`;

		return {
			markdown: markdown
		};
	}
}
