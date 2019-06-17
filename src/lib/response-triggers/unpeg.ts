import Trigger from '../../models/trigger';
import constants from '../../constants';
import XmlMessageParser from '../parsers/xmlMessageParser';
import { ParsedMessage } from '../../models/parsed-message';
import { DbUsers } from '../database/db-interfaces';
import Utilities from '../utilities';
import __logger from '../logger';
import { MessageObject, Webex } from 'webex/env';
import { UserRow } from '../../models/database';
import { Command } from '../../models/command';

// A joke option. Tells users pegs have been removed, but no pegs will actually be taken.
export default class  Unpeg extends Trigger {
	webex : Webex;
	database : DbUsers;
	utilities : Utilities;

	constructor(webex : Webex, database : DbUsers, utilities : Utilities) {
		super();

		this.webex = webex;
		this.database = database;
		this.utilities = utilities;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		__logger.debug('entering the unpeg isToTriggerOn');
		let parsedMessage : ParsedMessage = XmlMessageParser.parsePegMessage(message);
		return this.validateTrigger(parsedMessage);
	}

	async createMessage(message : MessageObject, room : string) : Promise<MessageObject> {
		if (!this.validateMessage(message)) {
			return {
				markdown:
`I'm sorry, I couldn't understand your unpeg request. Please use the following format:
@${constants.botName} unpeg @Person this is the reason for giving you a peg`
			};
		}

		let parsedMessage = XmlMessageParser.parsePegMessage(message);
		let fromPersonId = message.personId;

		try {
			let toPerson = await this.getToPerson(parsedMessage);
			let fromData : UserRow = await this.database.getUser(fromPersonId);
			if (!fromData.userid) {
				throw new Error('No from person was obtained');
			}

			return await this.returnRandomResponse(toPerson, fromData.username, room);
		} catch (error) {
			return {
				markdown: 'User could not be found or created. No peg removed.'
			};
		}
	}

	validateTrigger(message : ParsedMessage) : boolean {
		if (message.botId !== constants.botId) {
			return false;
		}

		return message.children[1].text().toLowerCase().trim().startsWith(Command.Unpeg);
	}

	validateMessage(message : MessageObject) : boolean {
		try {
			let parsedMessage = XmlMessageParser.parsePegMessage(message);
			if (parsedMessage.botId !== constants.botId) {
				__logger.warn('First person mentioned in unpeg candidate message is not bot');
				return false;
			}

			if (parsedMessage.children.length < 2) {
				__logger.warn('Unpeg candidate message does not contain 2 or more xml parts.')
				return false;
			}

			if (parsedMessage.children[1].text().toLowerCase().trim().startsWith(Command.Unpeg)) {
				return true;
			} else {
				__logger.warn(`Unpeg candidate message child 1 does not contain unpegCommand: ${parsedMessage.children[1].text()}`);
				return false;
			}
		} catch (e) {
			__logger.error(`Error in unpeg validateMessage:\n${e.message}`);
			throw new Error('Error in unpeg validateMessage');
		}
	}

	private async getToPerson(message: ParsedMessage) : Promise<string> {
		if (message.toPersonId) {
			let data : UserRow = await this.database.getUser(message.toPersonId);

			if (!data.userid) {
				throw new Error('No to person was obtained');
			}

			return data.username;
		} else {
			const pattern = new RegExp('^' + Command.Unpeg, 'ui');
			const text = message.children.reduce((a, child, index) => {
				// first child should be mention
				if (index > 0) {
					return a + child.text();
				}
				return a;
			}, '').trim().replace(pattern, '').trim();


			const index = text.indexOf(' for');

			if (index < 0) {
				return text.split(' ')[0];
			} else {
				return text.split(' for')[0];
			}
		}
	}

	async returnRandomResponse(toUser : string, fromUser : string, room : string) : Promise<MessageObject> {
		let num = this.utilities.getRandomInt(7);
		toUser = (toUser || 'someone');
		fromUser = (fromUser || 'Dave');
		switch(num) {
			case 0:
				return await this.sendFollowUpResponse(`Peg removed from ${toUser}.`, 'Kidding!', room);
			case 1:
				return this.sendResponse(`It looks like ${toUser} has hidden their pegs too well for me to find them!`);
			case 2:
				return await this.sendFollowUpResponse(`${toUser}'s peg has been removed...`, `But ${toUser} stole it back!`, room);
			case 3:
				return await this.sendFollowUpResponse(`Peg given to ${toUser}`, `But ${toUser} didn't want it!`, room);
			case 4:
				return this.sendResponse(`I'm sorry ${fromUser}, I'm afraid I can't do that.`);
			case 5:
				return this.sendResponse(
`### HTTP Status Code 418: I'm a teapot.
Unable to brew coffee. Or pegs.`);
			case 6:
				let nonAlphanumericRegex = new RegExp('[^0-9a-z]', 'gi');
				let safeName = fromUser.replace(nonAlphanumericRegex, '');
				if (safeName.length === 0) {
					safeName = 'ThatPerson';
				}

				return this.sendResponse(
`\`\`\`
Error: Access Denied user ${fromUser} does not have the correct privileges
	at UnPeg (unpeg.js:126)
	at EveryoneBut${safeName} (unpeg.js:4253)
	at ExecuteBadCode (pockybot.js:1467)
	at DecrementPegs (pockybot.js:1535)
\`\`\``
				);
			default:
				return {
					markdown: `Whoops, looks like RNGesus did not smile upon you today.`
				};
		}
	}

	private sendResponse(response : string) : MessageObject {
		return {
			markdown: response
		}
	}

	private async sendFollowUpResponse(initialResponse : string, followUp : string, room : string) : Promise<MessageObject> {
		this.webex.messages.create({
			markdown: initialResponse,
			roomId: room
		});
		await this.utilities.sleep(30);
		return {
			markdown: followUp
		};
	}
};
