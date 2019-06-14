import Trigger from '../../models/trigger';
import constants from '../../constants';
import { MessageObject } from 'ciscospark/env';
import xmlMessageParser from '../parsers/xmlMessageParser';

export default class Default extends Trigger {
	isToTriggerOn(message : MessageObject) : boolean {
		let parsedMessage = xmlMessageParser.parseXmlMessage(message);
		return parsedMessage[0].name() === 'spark-mention' && message.mentionedPeople[0] === constants.botId;
	}

	isToTriggerOnPM() : boolean {
		return true;
	}

	async createMessage() : Promise<MessageObject> {
		return {
				markdown:
`## I'm sorry, I didn't understand that, here's what I can do:
1. To give someone a peg type: \`@${constants.botName} peg @bob {comment}\`.
1. For a full list of commands type \`@${constants.botName} help\`.

I am still being worked on, so [more features to come : )] (${constants.todoUrl})` };
	}
};
