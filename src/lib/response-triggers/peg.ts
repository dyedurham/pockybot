import Trigger from '../../models/trigger';
import constants from '../../constants';
import dbConstants from '../db-constants';
import xmlMessageParser from '../parsers/xmlMessageParser';
import { ParsedMessage } from "../../models/parsed-message";
import PockyDB from '../PockyDB';
import Config from '../config';
import __logger from '../logger';
import { MessageObject, CiscoSpark } from 'ciscospark/env';
import { UserRow } from '../../models/database';

export default class Peg extends Trigger {
	readonly pegCommand : string;
	readonly pegComment : string;

	spark : CiscoSpark;
	database : PockyDB;
	config : Config;

	constructor(sparkService : CiscoSpark, databaseService : PockyDB, config : Config) {
		super();

		this.spark = sparkService;
		this.database = databaseService;
		this.config = config;

		// match peg, to, at, for with optional spaces between them, and no other words.
		// Require at least one keyword match if pegsWithoutKeyword is false
		let s = constants.optionalSpace;
		this.pegCommand = `^${s}(?:(?:${s}(?:peg|to|at|for)${s})+)${s}$`;
		this.pegComment = '( (?!<spark-mention)(?:(?!<\/p>).)' + (config.getConfig('commentsRequired') ? '+){1}' : '*)?');
	}

	isToTriggerOn(message : MessageObject) : boolean {
		__logger.debug('entering the peg isToTriggerOn');
		let parsedMessage : ParsedMessage = xmlMessageParser.parseMessage(message);
		return this.validateTrigger(parsedMessage);
	}

	// <spark-mention data-object-type="person" data-object-id="aoeu">BotName</spark-mention>
	//  peg <spark-mention data-object-type="person" data-object-id="aoei">PersonName</spark-mention>
	//  for some reasons
	async createMessage(message : MessageObject) : Promise<MessageObject> {
		let parsedMessage : ParsedMessage = xmlMessageParser.parseMessage(message);

		if (!this.validateMessage(parsedMessage)) {
			return {
				markdown:
`I'm sorry, I couldn't understand your peg request. Please use the following format:
@` + constants.botName + ` peg @Person this is the reason for giving you a peg`
			};
		}

		if (this.config.getConfig('requireValues') && !this.validateValues(parsedMessage)) {
			return {
				markdown:
`I'm sorry, you have to include a keyword in your comment. Please include one of the below keywords in your comment: \n`
 + this.config.getStringConfig('keyword').join(', ')
			};
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
		for (let i = 0; i < keywords.length; i++) {
			if (message.comment.includes(keywords[i])) {
				return true;
			}
		}
		return false
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
			__logger.error(`Error in validateMessage peg:\n${e.message}`);
			throw new Error('Error in validateMessage peg');
		}
	}

	async givePegWithComment(comment : string, toPersonId : string, fromPerson : string) : Promise<MessageObject> {
		let result : number;
		try {
			result = await this.database.givePegWithComment(comment, toPersonId, fromPerson);
		} catch(e) {
			__logger.error(`Uncaught error in give peg:\n${e.message}`);
			return {
				markdown: `Exception encountered, peg not given`
			};
		}

		if (result === dbConstants.pegSuccess) {
			try {
				await this.pmReceiver(comment, toPersonId, fromPerson);
			} catch (error) {
				__logger.error(`Error messaging receiver ${toPersonId} about peg from ${fromPerson}:\n${error.message}`);
			}

			return await this.pmSender(toPersonId, fromPerson);
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

	async pmSender(toPersonId : string, fromPerson : string) : Promise<MessageObject>{
		let count : number;

		try {
			count = await this.database.countPegsGiven(fromPerson);
		} catch (error) {
			__logger.error(`Error counting pegsGiven from ${fromPerson}:\n${error.message}`);
			return {
				markdown: 'Giving user\'s count of previously given pegs could not be found. Peg not given.'
			};
		}

		let data : UserRow;
		try {
			data = await this.database.getUser(toPersonId);
		} catch (error) {
			__logger.error(`Error in getting receiver in pmSender:\n${error.message}`);
			return {
				markdown: 'User could not be found or created. Peg not given.'
			}
		}

		if (!data.userid) {
			throw new Error('No person was obtained');
		}

		return {
			markdown: 'Peg given to ' + (data.username || 'someone') + '. You have given ' + count + ' ' + (count === 1 ? 'peg' : 'pegs') + ' this fortnight.',
			toPersonId: fromPerson,
			roomId: null
		};
	}

	async pmReceiver(comment : string, toPersonId : string, fromPerson : string) : Promise<void> {
		let data : UserRow;
		try {
			data = await this.database.getUser(fromPerson);
		} catch (error) {
			__logger.error(`Error in creating PM notifying user ${toPersonId} of peg from ${fromPerson}:\n${error.message}`);
		}

		__logger.debug('sending pm to: ' + toPersonId);

		let msg : string;
		if (comment.startsWith('for ')) {
			msg = `You have received a new peg from ${data.username}: "${comment}"`;
		} else {
			msg = `You have received a new peg from ${data.username} for: "${comment}"`;
		}

		this.spark.messages.create(
		{
			markdown: msg,
			toPersonId: toPersonId
		});
	}
};
