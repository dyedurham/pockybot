import Trigger from '../../models/trigger';
import constants from '../../constants';
import DbUsers from '../database/db-users';
import Config from '../config';
import __logger from '../logger';
import { MessageObject, CiscoSpark } from 'ciscospark/env';
import { UserRow, Role } from '../../models/database';
import { Command } from '../../models/command';
import xmlMessageParser from '../parsers/xmlMessageParser';

export default class Update extends Trigger {
	spark : CiscoSpark;
	database : DbUsers;
	config : Config;

	constructor(sparkService : CiscoSpark, databaseService : DbUsers, config : Config) {
		super();

		this.spark = sparkService;
		this.database = databaseService;
		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		if (!(this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Update))) {
			return false;
		}

		let parsedMessage = xmlMessageParser.parseXmlMessage(message);
		return parsedMessage.length === 2 && parsedMessage[0].name() === 'spark-mention' && message.mentionedPeople[0] === constants.botId
			&& parsedMessage[1].text().trim().toLowerCase() === Command.Update;
	}

	async createMessage() : Promise<MessageObject> {
		let users : UserRow[];
		try {
			users = await this.database.getUsers();
		} catch (error) {
			__logger.error(`[Update.createMessage] Error in getting users: ${error.message}`);
			return {
				markdown: `Error occurred, some or all users may not have been updated.`
			};
		}

		try {
			let usersUpdated = await Promise.all(users.map(async (user : UserRow) : Promise<number> => {
				let username = await this.getUsername(user.userid);
				let response = await this.database.updateUser(username, user.userid);

				if (response === 0) {
					return 0;
				} else {
					__logger.error(`[Update.createMessage] User ${username}, ${user.userid} failed to update`);
					return 1;
				}
			}));

			if (usersUpdated.includes(1)) {
				return {
					markdown: 'Error occurred, some or all users may not have been updated'
				};
			}

			return {
				markdown: `Users successfully updated.`
			};
		} catch (error) {
			__logger.error(`[Update.createMessage] Error mapping users into usernames: ${error.message}`);
			return {
				markdown: `Error occurred, some or all users may not have been updated.`
			};
		}
	}

	private async getUsername(personId : string) : Promise<string> {
		try {
			const data = await this.spark.people.get(personId);
			return data.displayName;
		}
		catch (error) {
			__logger.error(`[Update.getUsername] Error getting username for ${personId}: ${error.message}`);
			throw new Error('Error getting username');
		}
	}
}
