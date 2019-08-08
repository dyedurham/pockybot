import { Argument } from '../../models/argument';
import { DbLocation, DbUsers } from '../database/db-interfaces';
import { UserLocationRow } from '../../models/database';
import { Logger } from '../logger';
import tableHelper from '../parsers/tableHelper';

export interface GetUserLocationService {
	getUserLocation(args : Argument[], personId : string) : Promise<string>;
}

export class DefaultGetUserLocationService implements GetUserLocationService {
	dbLocation : DbLocation
	dbUsers : DbUsers;

	constructor(dbLocation : DbLocation, dbUsers : DbUsers) {
		this.dbLocation = dbLocation;
		this.dbUsers = dbUsers;
	}

	async getUserLocation(args : Argument[], personId : string) : Promise<string> {
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
