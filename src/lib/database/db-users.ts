import QueryHandler from './query-handler-interface';
import __logger from '../logger';
import { QueryResult, QueryConfig } from 'pg';
import { Webex, PersonObject } from 'webex/env';
import dbConstants from '../db-constants';
import { UserRow } from '../../models/database';
import { DbUsers as DbUsersInterface } from './db-interfaces';

export default class DbUsers implements DbUsersInterface {
	private readonly sqlUpdate : string;
	private readonly sqlGetUsers : string;
	private readonly sqlGetUser : string;
	private readonly sqlCreateUser : string;
	private readonly sqlExists : string;
	private readonly sqlDeleteUser : string;

	private webex : Webex;
	private queryHandler : QueryHandler;

	constructor(webexService : Webex, queryHandler : QueryHandler) {
		this.webex = webexService;
		this.queryHandler = queryHandler;

		this.sqlUpdate = this.queryHandler.readFile('../../../database/queries/update_pocky_user.sql');
		this.sqlGetUsers = this.queryHandler.readFile('../../../database/queries/select_all_users.sql');
		this.sqlGetUser = this.queryHandler.readFile('../../../database/queries/select_user.sql');
		this.sqlCreateUser = this.queryHandler.readFile('../../../database/queries/create_pocky_user.sql');
		this.sqlExists = this.queryHandler.readFile('../../../database/queries/exists.sql');
		this.sqlDeleteUser = this.queryHandler.readFile('../../../database/queries/delete_pocky_user.sql');
	}

	async createUser(userid : string) : Promise<QueryResult> {
		let user : PersonObject;
		try {
			user = await this.webex.people.get(userid);
		} catch (error) {
			__logger.error(`[DbUsers.createUser] Error getting user from userid ${userid}: ${error.message}`);
			throw new Error(`Error getting ${userid} user in createUser`);
		}

		__logger.information(`[DbUsers.createUser] Creating a new user with userid ${userid} and username ${user.displayName}`);
		let query : QueryConfig = {
			name: 'createUserQuery',
			text: this.sqlCreateUser,
			values: [userid, user.displayName]
		};

		try {
			return await this.queryHandler.executeNonQuery(query);
		} catch (error) {
			__logger.error(`[DbUsers.createUser] Error creating new user ${user.displayName}: ${error.message}`);
			throw new Error(`Error creating new user ${user.displayName}`);
		}
	}

	async updateUser(username : string, userid : string) : Promise<number> {
		try {
			await this.existsOrCanBeCreated(userid);
		} catch (error) {
			__logger.error(`[DbUsers.updateUser] Error checking if user exists or can be created for ${userid}: ${error.message}`);
			return dbConstants.updateUserError;
		}

		let query : QueryConfig = {
			name: 'updateUserQuery',
			text: this.sqlUpdate,
			values: [username, userid]
		};

		try {
			await this.queryHandler.executeNonQuery(query);
			return dbConstants.updateUserSuccess;
		} catch (error) {
			__logger.error(`[DbUsers.updateUser] Error executing update query for ${userid}: ${error.message}`);
			return dbConstants.updateUserError;
		}
	}

	async getUsers() : Promise<UserRow[]> {
		let query = {
			name: 'getUsersQuery',
			text: this.sqlGetUsers
		};

		return await this.queryHandler.executeQuery(query);
	}

	async getUser(userid : string) : Promise<UserRow> {
		let query : QueryConfig = {
			name: 'getUserQuery',
			text: this.sqlGetUser,
			values: [userid]
		};

		let user : UserRow[] = await this.queryHandler.executeQuery(query);

		if (user.length === 1) {
			return user[0];
		} else if (user.length === 0) {
			// should not occur in normal circumstances
			__logger.error(`[DbUsers.getUser] Query returned no users for userid ${userid}`);
			throw new Error(`No user entities returned by getUser ${userid}`);
		} else {
			// should NEVER occur but shouldn't be harmful if it does
			__logger.warn(`[DbUsers.getUser] More than one user returned by getUser ${userid}`);
			return user[0];
		}
	}

	async existsOrCanBeCreated(userid : string) : Promise<boolean> {
		let exists : boolean = await this.exists(userid);
		if (exists) {
			__logger.debug(`[DbUsers.existsOrCanBeCreated] User ${userid} already exists`);
			return true;
		}

		let newUser : QueryResult = await this.createUser(userid);

		__logger.information(`[DbUsers.existsOrCanBeCreated] User ${userid} created`);
		__logger.debug(`[DbUsers.existsOrCanBeCreated] Created user ${userid} with data: ${newUser}`);
		return true;
	}

	async exists(userid : string) : Promise<boolean> {
		let query : QueryConfig = {
			name: 'existsQuery',
			text: this.sqlExists,
			values: [userid]
		};

		__logger.debug(`[DbUsers.exists] Checking if user ${userid} exists`);
		let existingUser = await this.queryHandler.executeQuery(query);
		return existingUser[0]['exists'];
	}

	async deleteUser(userid : string) : Promise<void> {
		let query : QueryConfig = {
			name: 'deleteUserQuery',
			text: this.sqlDeleteUser,
			values: [userid]
		};

		__logger.debug(`[DbUsers.deleteUser] Deleting user ${userid}`);
		await this.queryHandler.executeNonQuery(query);
	}
}
