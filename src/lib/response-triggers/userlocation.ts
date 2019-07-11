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
import { Logger } from '../logger';
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
		let parsedMessage = xmlMessageParser.parseNonPegMessage(message);
		return parsedMessage.botId === constants.botId && parsedMessage.command.toLowerCase().startsWith(Command.UserLocation);
	}

	async createMessage(message : MessageObject) : Promise<MessageObject> {
		let args : Argument[];
		try {
			args = xmlMessageParser.parseOutArgs(message);
		} catch(error) {
			Logger.error(`[UserLocation.createMessage] Error parsing args: ${error.message}`);
			return { markdown: `Error parsing request: ${error.message}` };
		}

		if (args.length < 3 || args[2].isMention) {
			return { markdown: `Please specify a command. Possible values are ${Object.values(LocationAction).join(', ')}` };
		}

		let response : string;

		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.UserLocation)) {
			response = await this.createMessageAdmin(args, message);
		} else {
			response = await this.createMessageNonAdmin(args, message);
		}

		return {
			markdown: response
		};
	}

	private async createMessageAdmin(args : Argument[], message : MessageObject) : Promise<string> {
		switch(args[2].text.toLowerCase()) {
			case LocationAction.Get:
				return await this.getUserLocation(args, message.personId);
			case LocationAction.Set:
				return await this.setUserLocationAdmin(args, message);
			case LocationAction.Delete:
				return await this.deleteUserLocationAdmin(args, message);
			default:
				return `Unknown command. Possible values are ${Object.values(LocationAction).join(', ')}`;
		}
	}

	private async createMessageNonAdmin(args : Argument[], message : MessageObject) : Promise<string> {
		switch(args[2].text.toLowerCase()) {
			case LocationAction.Get:
				return await this.getUserLocation(args, message.personId);
			case LocationAction.Set:
				return await this.setUserLocationNonAdmin(args, message.personId);
			case LocationAction.Delete:
				return await this.deleteUserLocationNonAdmin(args, message.personId);
			default:
				return `Unknown command. Possible values are ${Object.values(LocationAction).join(', ')}`;
		}
	}

	private async getUserLocation(args : Argument[], personId : string) : Promise<string> {
		if (args.length !== 4) {
			return 'Please specify who you want to get the location for. This can be \'all\', \'me\', \'unset\', or mention a person';
		}

		if (args[3].isMention) {
			const userLocation = await this.dbLocation.getUserLocation(args[3].userId);
			if (userLocation) {
				return `User ${args[3].text}'s location is: '${userLocation.location}'`;
			}

			return `User ${args[3].text}'s location is not set`;
		}

		if (args[3].text.toLowerCase() === 'all') {
			return await this.getAllUserLocationMessage();
		} else if (args[3].text.toLowerCase() === 'me') {
			const userLocation = await this.dbLocation.getUserLocation(personId);
			if (userLocation) {
				return `Your location is: '${userLocation.location}'`;
			}

			return 'Your location is not set';
		} else if (args[3].text.toLowerCase() === 'unset') {
			const unsetUsers = await this.dbLocation.getUsersWithoutLocation();
			if (unsetUsers.length === 0) {
				return 'There are no users without a location set';
			}

			return `Here are the users without a location set:

${unsetUsers.map(x => `'${x.username}'`).join(', ')}`;
		}

		return 'Unknown command. Please specify \'me\', \'all\', \'unset\', or mention a user.';
	}

	private async setUserLocationAdmin(args : Argument[], message : MessageObject) : Promise<string> {
		if (args.length < 5 || args[3].isMention) {
			return 'Please specify the name of a location and a list of mentions/me';
		}

		const locations = await this.dbLocation.getLocations();
		if (!locations.map(x => x.toLowerCase()).includes(args[3].text.toLowerCase())) {
			return `Location ${args[3].text} does not exist. Valid values are: ${locations.join(', ')}`;
		}

		const location = locations.filter(x => x.toLowerCase() === args[3].text.toLowerCase())[0];
		const users = args.filter((item, index) => index > 3 );

		if (users.length === 1 && !users[0].isMention) {
			if (users[0].text !== 'me') {
				return `Invalid person ${users[0].text}. Either specify 'me' or mention a person`;
			}

			try {
				await this.setUserLocation(message.personId, location);
				return 'Location has been set';
			} catch (error) {
				Logger.error(`[UserLocation.setUserLocation] Error setting location for user ${message.personId}: ${error.message}`);
				return 'Error setting location';
			}
		}

		if (users.some(x => !x.isMention)) {
			return 'Mixed mentions and non mentions not allowed';
		}

		const usersPromise = users.map(async x => {
			try {
				await this.setUserLocation(x.userId, location);
				return {
					user: x.text,
					success: true
				};
			} catch (error) {
				Logger.error(`[UserLocation.setUserLocation] Error setting location for user ${x.userId}: ${error.message}`);
				return {
					user: x.text,
					success: false
				}
			}
		});

		const result = await Promise.all(usersPromise);
		if (result.some(x => !x.success)) {
			return `Location setting was unsuccessful for user(s): ${result.filter(x => !x.success).map(x => `'${x.user}'`).join(', ')}`;
		}

		return 'Location has been set';
	}

	private async setUserLocationNonAdmin(args : Argument[], personId : string) : Promise<string> {
		if (args.length !== 5) {
			return `Usage: \`@${constants.botName} ${Command.UserLocation} ${LocationAction.Set} <location> me\``;
		}

		const locations = await this.dbLocation.getLocations();
		if (!locations.map(x => x.toLowerCase()).includes(args[3].text.toLowerCase())) {
			return `Location ${args[3].text} does not exist. Valid values are: ${locations.join(', ')}`;
		}

		if (args[4].isMention || args[4].text.toLowerCase() !== 'me') {
			return 'Permission denied. You are only allowed to set the location for yourself (use \'me\')';
		}

		const location = locations.filter(x => x.toLowerCase() === args[3].text.toLowerCase())[0];

		try {
			await this.setUserLocation(personId, location);
			return 'Location has been set';
		} catch (error) {
			Logger.error(`[UserLocation.setUserLocation] Error setting location for user ${personId}: ${error.message}`);
			return 'Error setting location';
		}
	}

	private async setUserLocation(userId : string, location : string) : Promise<void> {
		try {
			let exists = await this.dbUsers.existsOrCanBeCreated(userId);
			if (!exists) {
				throw new Error(`User ${userId} could not be found or created.`);
			}
		} catch (error) {
			Logger.error(`[UserLocation.setUserLocation] Error finding or creating user ${userId}: ${error.message}`);
			throw new Error(`Error: User ${userId} could not be found or created.`);
		}

		await this.dbLocation.setUserLocation(userId, location);
	}

	private async deleteUserLocationAdmin(args : Argument[], message : MessageObject) : Promise<string> {
		if (args.length < 4) {
			return 'Please specify a list of mentions/me';
		}

		const users = args.filter((item, index) => index > 2 );

		if (users.length === 1 && !users[0].isMention) {
			if (users[0].text !== 'me') {
				return `Invalid person ${users[0].text}. Either specify 'me' or mention a person`;
			}

			try {
				await this.dbLocation.deleteUserLocation(message.personId);
				return 'Location has been deleted';
			} catch (error) {
				Logger.error(`[UserLocation.setUserLocation] Error deleting location for user ${message.personId}: ${error.message}`);
				return 'Error deleting location';
			}
		}

		if (users.some(x => !x.isMention)) {
			return 'Mixed mentions and non mentions not allowed';
		}

		const usersPromise = users.map(async x => {
			try {
				await this.dbLocation.deleteUserLocation(x.userId);
				return {
					user: x.text,
					success: true
				};
			} catch (error) {
				Logger.error(`[UserLocation.setUserLocation] Error deleting location for user ${x.userId}: ${error.message}`);
				return {
					user: x.text,
					success: false
				}
			}
		});

		const result = await Promise.all(usersPromise);
		if (result.some(x => !x.success)) {
			return `Location deleting was unsuccessful for user(s): ${result.filter(x => !x.success).map(x => `'${x.user}'`).join(', ')}`;
		}

		return 'Location has been deleted';
	}

	private async deleteUserLocationNonAdmin(args : Argument[], personId : string) : Promise<string> {
		if (args.length !== 4) {
			return `Usage: \`@${constants.botName} ${Command.UserLocation} ${LocationAction.Delete} me\``;
		}

		if (args[3].isMention || args[3].text.toLowerCase() !== 'me') {
			return 'Permission denied. You are only allowed to delete the location for yourself (use \'me\')';
		}

		try {
			await this.dbLocation.deleteUserLocation(personId);
			return 'Location has been deleted';
		} catch (error) {
			Logger.error(`[UserLocation.setUserLocation] Error deleting location for user ${personId}: ${error.message}`);
			return 'Error deleting location';
		}
	}

	private async getAllUserLocationMessage() : Promise<string> {
		let userLocations : UserLocationRow[];
		try {
			userLocations = await this.dbLocation.getAllUserLocations();
		} catch(e) {
			Logger.error(`[UserLocation.getUserLocationMessage] Error getting user locations: ${e.message}`);
			return 'Error getting user locations';
		}

		if (userLocations.length === 0) {
			return 'No user locations set';
		}

		const mappedPromise = userLocations.map(async x => {
			const user = await this.dbUsers.getUser(x.userid);
			return {
				username: user.username,
				location: x.location
			};
		});

		const mapped = await Promise.all(mappedPromise);

		const columnWidths = tableHelper.getColumnWidths(
			mapped, [x => x.username, x => x.location], ['Username', 'Location']);

		let message = 'Here is the current config:\n```\n';

		message += tableHelper.padString('Username', columnWidths[0]) + ' | Location\n';
		message += ''.padEnd(columnWidths[0], '-') + '-+-' + ''.padEnd(columnWidths[1], '-') + '\n';

		for (const config of userLocations) {
			const user = await this.dbUsers.getUser(config.userid);
			message += user.username.padEnd(columnWidths[0]) + ' | ' + config.location + '\n';
		}

		message += '```';

		return message;
	}
}
