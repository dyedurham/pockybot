import Trigger from '../types/trigger';
import constants from '../../constants';
import PockyDB from '../PockyDB';
import Config from '../config';
import __logger from '../logger';
import { MessageObject, CiscoSpark } from 'ciscospark/env';

const updateCommand = '(?: )*update(?: )*';

export default class Update extends Trigger {
	spark : CiscoSpark;
	database : PockyDB;
	config : Config;

	constructor(sparkService, databaseService, config) {
		super();

		this.spark = sparkService;
		this.database = databaseService;
		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		if (!(this.config.checkRole(message.personId,'admin') || this.config.checkRole(message.personId,'update'))) {
			return false;
		}

		var pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + updateCommand + constants.optionalMarkdownEnding + '$', 'ui');
		return pattern.test(message.html);
	}

	async createMessage() : Promise<MessageObject> {
		let users;
		try {
			users = await this.database.getUsers();
		} catch (error) {
			__logger.error(`Error in getting users:\n${error.message}`);
			return {
				markdown: `Error occurred, some or all users may not have been updated.`
			};
		}

		try {
			await Promise.all(users.map(async (user) => {
				let username = await this.getUsername(user.userid);
				let response = await this.database.updateUser(username, user.userid);

				if (response === 0) {
					return 0;
				} else {
					__logger.error(`user ${username}, ${user.userid} failed to update`);
					return 1;
				}
			}));

			__logger.debug('Update completed. Returning markdown.');
			return {
				markdown: `Users successfully updated.`
			};
		} catch (error) {
			__logger.error(`Error in the createMessage promise.all:\n${error.message}`);
			return {
				markdown: `Error occurred, some or all users may not have been updated.`
			};
		}
	}

	private getUsername(personId) : Promise<string> {
		return this.spark.people.get(personId)
		.then((data) => {
			return data.displayName;
		}).catch((error) => {
			__logger.error(`Error getting username for ${personId}:\n${error.message}`);
			throw new Error("Error getting username");
		});
	}
}
