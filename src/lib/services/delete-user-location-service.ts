import { Argument } from '../../models/argument';
import { LocationAction } from '../../models/location-action';
import { DbLocation } from '../database/db-interfaces';
import { Logger } from '../logger';
import constants from '../../constants';
import { Command } from '../../models/command';

export interface DeleteUserLocationService {
	deleteUserLocationAdmin(args : Argument[], personId : string) : Promise<string>;
	deleteUserLocationNonAdmin(args : Argument[], personId : string) : Promise<string>;
}

export class DefaultDeleteUserLocationService implements DeleteUserLocationService {
	dbLocation : DbLocation;

	constructor(dbLocation : DbLocation) {
		this.dbLocation = dbLocation;
	}

	async deleteUserLocationAdmin(args : Argument[], personId : string) : Promise<string> {
		if (args.length < 4) {
			return 'Please specify a list of mentions/me';
		}

		const users = args.filter((item, index) => index > 2 );

		if (users.length === 1 && !users[0].isMention) {
			if (users[0].text !== 'me') {
				return `Invalid person ${users[0].text}. Either specify 'me' or mention a person`;
			}

			try {
				await this.dbLocation.deleteUserLocation(personId);
				return 'Location has been deleted';
			} catch (error) {
				Logger.error(`[UserLocation.setUserLocation] Error deleting location for user ${personId}: ${error.message}`);
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

	async deleteUserLocationNonAdmin(args : Argument[], personId : string) : Promise<string> {
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
}
