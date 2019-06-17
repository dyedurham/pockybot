import constants from '../../constants';
import Trigger from '../../models/trigger';
import { MessageObject } from 'webex/env';
import * as pjson from 'pjson';
import { Command } from '../../models/command';
import xmlMessageParser from '../parsers/xmlMessageParser';

export default class Ping extends Trigger {
	isToTriggerOn(message : MessageObject) : boolean {
		let parsedMessage = xmlMessageParser.parseNonPegMessage(message);
		return parsedMessage.botId === constants.botId && parsedMessage.command.toLowerCase() === Command.Ping;
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
