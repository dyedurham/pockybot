import { Argument } from '../../models/argument';
import { DbLocation, DbUsers } from '../database/db-interfaces';
import { Logger } from '../logger';
import constants from '../../constants';
import { Command } from '../../models/command';
import { LocationAction } from '../../models/location-action';

export interface SetUserLocationService {
	setUserLocationAdmin(args : Argument[], personId : string) : Promise<string>;
	setUserLocationNonAdmin(args : Argument[], personId : string) : Promise<string>;
}

export class DefaultSetUserLocationService implements SetUserLocationService {
	dbLocation : DbLocation;
	dbUsers : DbUsers;

	constructor(dbLocation : DbLocation, dbUsers : DbUsers) {
		this.dbLocation = dbLocation;
		this.dbUsers = dbUsers;
	}

	async setUserLocationAdmin(args : Argument[], personId : string) : Promise<string> {
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
				await this.setUserLocation(personId, location);
				return 'Location has been set';
			} catch (error) {
				Logger.error(`[UserLocation.setUserLocation] Error setting location for user ${personId}: ${error.message}`);
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

	async setUserLocationNonAdmin(args : Argument[], personId : string) : Promise<string> {
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
}
