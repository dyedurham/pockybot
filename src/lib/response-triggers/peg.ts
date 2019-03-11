import Trigger from '../../models/trigger';
import constants from '../../constants';
import dbConstants from '../db-constants';
import xmlMessageParser from '../parsers/xmlMessageParser';
import { ParsedMessage } from '../../models/parsed-message';
import { PockyDB, DbUsers } from '../database/db-interfaces';
import Config from '../config-interface';
import __logger from '../logger';
import { MessageObject, CiscoSpark } from 'ciscospark/env';
import { UserRow } from '../../models/database';

export default class Peg extends Trigger {
	readonly pegCommand : string;
	readonly pegComment : string;

	spark : CiscoSpark;
	database : PockyDB;
	dbUsers : DbUsers;
	config : Config;

	constructor(sparkService : CiscoSpark, databaseService : PockyDB, dbUsers : DbUsers, config : Config) {
		super();

		this.spark = sparkService;
		this.database = databaseService;
		this.dbUsers = dbUsers;
		this.config = config;

		// match peg, to, at, for with optional spaces between them, and no other words.
		// Require at least one keyword match if pegsWithoutKeyword is false
		let s = constants.optionalSpace;
		this.pegCommand = `^${s}(?:(?:${s}(?:peg|to|at|for)${s})+)${s}$`;
		this.pegComment = '( (?!<spark-mention)(?:(?!<\/p>).)' + (config.getConfig('commentsRequired') ? '+){1}' : '*)?');
	}

	isToTriggerOn(message : MessageObject) : boolean {
		let parsedMessage : ParsedMessage = xmlMessageParser.parsePegMessage(message);
		return this.validateTrigger(parsedMessage);
	}

	// <spark-mention data-object-type="person" data-object-id="aoeu">BotName</spark-mention>
	//  peg <spark-mention data-object-type="person" data-object-id="aoei">PersonName</spark-mention>
	//  for some reasons
	async createMessage(message : MessageObject) : Promise<MessageObject> {
		let parsedMessage : ParsedMessage = xmlMessageParser.parsePegMessage(message);

		if (!this.validateMessage(parsedMessage)) {
			return {
				markdown:
`I'm sorry, I couldn't understand your peg request. Please use the following format:
@` + constants.botName + ` peg @Person this is the reason for giving you a peg`
			};
		}

		if (this.config.getConfig('requireValues') && !this.validateValues(parsedMessage)) {
			this.pmKeywordCorrection(parsedMessage.toPersonId, parsedMessage.fromPerson, parsedMessage.comment);
			return undefined;
		}

		return await this.givePegWithComment(parsedMessage.comment, parsedMessage.toPersonId, parsedMessage.fromPerson);
	}

	validateTrigger(message : ParsedMessage) : boolean {
		if (message.toPersonId == null || message.botId !== constants.botId) {
			return false;
		}

		let pattern = new RegExp(this.pegCommand, 'ui');
		return pattern.test(message.children[1].text());
	}

	validateValues(message : ParsedMessage) : boolean {
		let keywords = this.config.getStringConfig('keyword');
		return keywords.some(keyword =>
			message.comment.toLowerCase().includes(keyword.toLowerCase())
		);
	}

	validateMessage(message : ParsedMessage) : boolean {
		try {
			if (message.children.length < 4) {
				return false;
			}

			if (message.children[0].name() !== 'spark-mention' || message.children[2].name() !== 'spark-mention'
					|| message.children[0].attr('data-object-type').value() !== 'person'
					|| message.children[2].attr('data-object-type').value() !== 'person') {
				return false;
			}

			if (message.children[message.children.length - 1].text().trim() === '') {
				return false;
			}

			return this.validateTrigger(message);
		} catch (e) {
			__logger.error(`[Peg.validateMessage] Error validating peg message: ${e.message}`);
			throw new Error('Error validating peg message');
		}
	}

	async givePegWithComment(comment : string, toPersonId : string, fromPerson : string) : Promise<MessageObject> {
		let result : number = await this.database.givePegWithComment(comment, toPersonId, fromPerson);

		if (result === dbConstants.pegSuccess) {
			try {
				let pms = await Promise.all([
					this.pmReceiver(comment, toPersonId, fromPerson),
					this.pmSender(toPersonId, fromPerson)
				]);

				return pms[1];
			} catch (error) {
				__logger.error(`[Peg.givePegWithComment] Error in pmReceiver or pmSender: ${error.message}`);
				return {
					markdown: 'Peg has been given but I was unable to successfully send PMs acknowledging this to both the sender and receiver.'
				};
			}
		} else if (result === dbConstants.pegAllSpent) {
			return {
				markdown: 'Sorry, but you have already spent all of your pegs for this fortnight.'
			};
		} else {
			return {
				markdown: 'Error encountered, peg not given'
			};
		}
	}

	async pmKeywordCorrection(toPersonId : string, fromPerson : string, message : string) : Promise<MessageObject> {

		//TODO generate one time key
		let data = {
				"toPerson" : toPersonId,
				"fromPerson" : fromPerson,
				"message" : message,
		}
		let key = new Buffer(JSON.stringify(data)).toString("base64");
		//add key to object in keyword service? need the service to be single instance?
		let markdown = "Unfortunately I couldn't find a keyword in your recent peg request. If you select the keyword below I'll fix up your message for you :)\n\n";
		let keywords = this.config.getStringConfig('keyword');
		keywords.forEach(keyword => {
				markdown += `[${keyword}](${constants.serverUrl}/keyword?keyword=${keyword}&sender=${fromPerson}&receiver=${toPersonId}&message=${message})`
				markdown += `[${keyword}](${constants.serverUrl}/keyword?keyword=${keyword}&key=${key}) \n`
		});

		return {
			markdown: markdown,
			toPersonId: fromPerson,
			roomId: null
		};
	}

	async pmSender(toPersonId : string, fromPerson : string) : Promise<MessageObject> {
		let count : number;

		try {
			count = await this.database.countPegsGiven(fromPerson);
		} catch (error) {
			__logger.error(`[Peg.pmSender] Error counting pegsGiven from ${fromPerson}: ${error.message}`);
			return {
				markdown: 'Giving user\'s count of previously given pegs could not be found. Peg not given.'
			};
		}

		let data : UserRow;
		try {
			data = await this.dbUsers.getUser(toPersonId);
		} catch (error) {
			__logger.error(`[Peg.pmSender] Error in getting receiver in pmSender: ${error.message}`);
			return {
				markdown: 'User could not be found or created. Peg not given.'
			}
		}

		return {
			markdown: 'Peg given to ' + (data.username || 'someone') + '. You have given ' + count + ' ' + (count === 1 ? 'peg' : 'pegs') + ' this fortnight.',
			toPersonId: fromPerson,
			roomId: null
		};
	}

	async pmReceiver(comment : string, toPersonId : string, fromPerson : string) : Promise<void> {
		let fromUser : UserRow;
		try {
			fromUser = await this.dbUsers.getUser(fromPerson);
		} catch (error) {
			__logger.error(`[Peg.pmReceiver] Error getting username of user ${fromPerson} to send peg to ${toPersonId}: ${error.message}`);
			fromUser = {
				userid: '',
				username: 'someone'
			};
		}

		let msg : string;
		if (comment.startsWith('for ')) {
			msg = `You have received a new peg from ${fromUser.username}: "${comment}"`;
		} else {
			msg = `You have received a new peg from ${fromUser.username} for: "${comment}"`;
		}

		try {
			this.spark.messages.create(
			{
				markdown: msg,
				toPersonId: toPersonId
			});
		} catch (error) {
			__logger.error(`[Peg.pmReceiver] Sending PM to ${toPersonId} with message ${msg} failed`);
			throw error;
		}
	}
};
