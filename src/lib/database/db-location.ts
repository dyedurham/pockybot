import { DbLocation as DbLocationInterface } from './db-interfaces';
import { UserLocationRow, UserRow } from '../../models/database';
import QueryHandler from './query-handler-interface';
import { QueryConfig } from 'pg';

export default class DbLocation implements DbLocationInterface {
	private readonly sqlGetUserLocation : string;
	private readonly sqlGetAllUserLocations : string;
	private readonly sqlGetLocations : string;
	private readonly sqlGetUsersWithoutLocation : string;
	private readonly sqlSetUserLocation : string;
	private readonly sqlSetLocation : string;
	private readonly sqlDeleteUserLocation : string;
	private readonly sqlDeleteLocation : string;

	private queryHandler : QueryHandler;

	constructor(queryHandler : QueryHandler) {
		this.queryHandler = queryHandler;

		this.sqlGetUserLocation = this.queryHandler.readFile('../../../database/queries/get_user_location.sql');
		this.sqlGetAllUserLocations = this.queryHandler.readFile('../../../database/queries/get_all_user_locations.sql');
		this.sqlGetLocations = this.queryHandler.readFile('../../../database/queries/get_locations.sql');
		this.sqlGetUsersWithoutLocation = this.queryHandler.readFile('../../../database/queries/get_users_without_location.sql');
		this.sqlSetUserLocation = this.queryHandler.readFile('../../../database/queries/set_user_location.sql');
		this.sqlSetLocation = this.queryHandler.readFile('../../../database/queries/set_location.sql');
		this.sqlDeleteUserLocation = this.queryHandler.readFile('../../../database/queries/delete_user_location.sql');
		this.sqlDeleteLocation = this.queryHandler.readFile('../../../database/queries/delete_location.sql');
	}

	async getUserLocation(userid : string) : Promise<UserLocationRow> {
		let query : QueryConfig = {
			name: 'getUserLocationQuery',
			text: this.sqlGetUserLocation,
			values: [userid]
		};

		let result = await this.queryHandler.executeQuery(query);
		return result[0];
	}

	async getAllUserLocations() : Promise<UserLocationRow[]> {
		let query : QueryConfig = {
			name: 'getAllUserLocationsQuery',
			text: this.sqlGetAllUserLocations,
			values: []
		};

		return await this.queryHandler.executeQuery(query);
	}

	async getLocations() : Promise<string[]> {
		let query : QueryConfig = {
			name: 'getLocationsQuery',
			text: this.sqlGetLocations,
			values: []
		};

		let result : any[] = await this.queryHandler.executeQuery(query);
		return result.map(x => x.name);
	}

	async getUsersWithoutLocation() : Promise<UserRow[]> {
		let query : QueryConfig = {
			name: 'getUsersWithoutLocationQuery',
			text: this.sqlGetUsersWithoutLocation,
			values: []
		};

		return await this.queryHandler.executeQuery(query);
	}

	async setUserLocation(userid: string, location : string) : Promise<void> {
		let query : QueryConfig = {
			name: 'setUserLocationQuery',
			text: this.sqlSetUserLocation,
			values: [userid, location]
		};

		await this.queryHandler.executeNonQuery(query);
	}

	async setLocation(name : string) : Promise<void> {
		let query : QueryConfig = {
			name: 'setLocationQuery',
			text: this.sqlSetLocation,
			values: [name]
		};

		await this.queryHandler.executeNonQuery(query);
	}

	async deleteUserLocation(userid : string) : Promise<void> {
		let query : QueryConfig = {
			name: 'deleteUserLocationQuery',
			text: this.sqlDeleteUserLocation,
			values: [userid]
		};

		await this.queryHandler.executeNonQuery(query);
	}

	async deleteLocation(name : string) : Promise<void> {
		let query : QueryConfig = {
			name: 'deleteLocationQuery',
			text: this.sqlDeleteLocation,
			values: [name]
		};

		await this.queryHandler.executeNonQuery(query);
	}
}
