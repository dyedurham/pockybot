import Trigger from '../../models/trigger';
import { DbLocation, DbUsers } from '../database/db-interfaces';
import Config from '../config-interface';
import { MessageObject } from 'webex/env';
import { Role, UserLocationRow } from '../../models/database';
import { Command } from '../../models/command';
import constants from '../../constants';
import xmlMessageParser from '../parsers/xmlMessageParser';
import { LocationAction } from '../../models/location-action';
import { Argument } from '../../models/argument';
import __logger from '../logger';
import tableHelper from '../parsers/tableHelper';
const stringWidth = require('string-width');

export default class UserLocation extends Trigger {
	dbUsers : DbUsers;
	dbLocation : DbLocation;
	config : Config;

	constructor(dbUsers : DbUsers, dbLocation : DbLocation, config : Config) {
		super();

		this.dbUsers = dbUsers;
		this.dbLocation = dbLocation;
		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		if (!(this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.UserLocation))) {
			return false;
		}

		let parsedMessage = xmlMessageParser.parseNonPegMessage(message);
		return parsedMessage.botId === constants.botId && parsedMessage.command.toLowerCase().startsWith(Command.UserLocation);
	}

	async createMessage(message : MessageObject) : Promise<MessageObject> {
		let args : Argument[];
		try {
			args = xmlMessageParser.parseOutArgs(message);
		} catch(error) {
			__logger.error(`[UserLocation.createMessage] Error parsing args: ${error.message}`);
			return { markdown: `Error parsing request: ${error.message}` }
		}

		let response : string;

		if (args.length < 3 || args[2].isMention) {
			return { markdown: `Please specify a command. Possible values are ${Object.values(LocationAction).join(', ')}` };
		}

		switch(args[2].text.toLowerCase()) {
			case LocationAction.Get:
				if (args.length !== 4) {
					response = 'Please specify who you want to get the location for. This can be \'all\', \'me\' or mention a person';
					break;
				}

				if (args[3].text.toLowerCase() === 'all') {
					response = await this.getUserLocationMessage();
				} else if (args[3].text.toLowerCase() === 'me') {
					const userLocation = await this.dbLocation.getUserLocation(message.personId);
					if (userLocation) {
						response = `Your location is: '${userLocation.location}'`;
					} else {
						response = 'Your location is not set';
					}
				} else if (args[3].isMention) {
					const userLocation = await this.dbLocation.getUserLocation(args[3].userId);
					const user = await this.dbUsers.getUser(args[3].userId);
					if (userLocation) {
						response = `User ${user.username}'s location is: '${userLocation.location}'`;
					} else {
						response = `User ${user.username}'s location is not set`;
					}
				} else {
					response = 'Unknown command. Please specify \'me\', \'all\', or mention a user.';
				}
				break;
			case LocationAction.Set:
				break;
			case LocationAction.Delete:
				break;
			default:
				response = 'Unknown command';
		}

		return {
			markdown: response
		};
	}

	private async getUserLocationMessage() : Promise<string> {
		let userLocations : UserLocationRow[];
		try {
			userLocations = await this.dbLocation.getAllUserLocations();
		} catch(e) {
			__logger.error(`[UserLocation.getUserLocationMessage] Error getting user locations: ${e.message}`);
			return 'Error getting user locations';
		}

		const mappedPromise = userLocations.map(async x => {
			const user = await this.dbUsers.getUser(x.userid);
			return {
				username: user.username,
				location: x.location
			};
		});

		const mapped = await Promise.all(mappedPromise);

		const columnWidths = this.getColumnWidths(mapped);

		let message = 'Here is the current config:\n```\n';

		message += tableHelper.padString('Username', columnWidths.username) + ' | Location\n';
		message += ''.padEnd(columnWidths.username, '-') + '-+-' + ''.padEnd(columnWidths.location, '-') + '\n';

		for (const config of userLocations) {
			const user = await this.dbUsers.getUser(config.userid);
			message += config.location.padEnd(columnWidths.username) + ' | ' + user.username + '\n';
		}

		message += '```';

		return message;
	}

	private getColumnWidths(values : { username: string; location: string; }[]) : { username : number, location : number } {
		let longestname = stringWidth('username');
		let longestlocation = stringWidth('location');

		values.forEach((value : { username: string; location: string; }) => {
			if (stringWidth(value.username) > longestname) {
				longestname = stringWidth(value.username);
			}

			if (stringWidth(value.location) > longestlocation) {
				longestlocation = stringWidth(value.location);
			}
		});

		return {
			username: longestname,
			location: longestlocation
		}
	}
}
