import QueryHandler from './query-handler';
import __logger from '../logger';
import { QueryResult, QueryConfig } from 'pg';
import { CiscoSpark, PersonObject } from 'ciscospark/env';
import dbConstants from '../db-constants';
import { UserRow } from '../../models/database';

export default class DbUsers {
	private readonly sqlUpdate : string;
	private readonly sqlGetUsers : string;
	private readonly sqlGetUser : string;
	private readonly sqlCreateUser : string;
	private readonly sqlExists : string;

	private spark : CiscoSpark;
	private queryHandler : QueryHandler;

	constructor(sparkService : CiscoSpark, queryHandler : QueryHandler) {
		this.spark = sparkService;
		this.queryHandler = queryHandler;

		this.sqlUpdate = this.queryHandler.readFile('../../database/queries/update_pocky_user.sql');
		this.sqlGetUsers = this.queryHandler.readFile('../../database/queries/select_all_users.sql');
		this.sqlGetUser = this.queryHandler.readFile('../../database/queries/select_user.sql');
		this.sqlCreateUser = this.queryHandler.readFile('../../database/queries/create_pocky_user.sql');
		this.sqlExists = this.queryHandler.readFile('../../database/queries/exists.sql');
	}


	async createUser(userid : string) : Promise<QueryResult> {
		let user : PersonObject;
		try {
			user = await this.spark.people.get(userid);
		} catch (error) {
			__logger.error(`Error getting user from userid:\n${error.message}`);
			throw new Error('Error getting user in createUser');
		}

		__logger.information(`Creating a new user with userid ${userid} and username ${user.displayName}`);
		let query : QueryConfig = {
			name: 'createUserQuery',
			text: this.sqlCreateUser,
			values: [userid, user.displayName]
		};

		try {
			return await this.queryHandler.executeNonQuery(query);
		} catch (error) {
			__logger.error(`Error creating new user:\n${error.message}`);
			throw new Error('Error creating new user');
		}
	}

	async updateUser(username : string, userid : string) : Promise<number> {
		__logger.information(`Updating user ${userid} with username ${username}`);

		try {
			await this.existsOrCanBeCreated(userid);
		} catch (error) {
			__logger.error(`Error after 'exists' in updateUser for ${userid}:\n${error.message}`);
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
			__logger.error(`Error after updateUserQuery in updateUser for ${userid}:\n${error.message}`);
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
			throw new Error(`No user entities returned by getUser ${userid}`);
		} else {
			// should NEVER occur but shouldn't be harmful if it does
			__logger.error(`More than one user returned by getUser ${userid}`);
			return user[0];
		}
	}

	async existsOrCanBeCreated(userid : string) : Promise<boolean> {
		let exists : boolean = await this.exists(userid);
		if (exists) {
			__logger.debug(`User ${userid} already exists`);
			return true;
		}

		let newUser : QueryResult;
		try {
			newUser = await this.createUser(userid);
		} catch (error) {
			__logger.error(`Error caught from createUser for user ${userid}:\n${error.message}`);
			throw new Error('Error caught from createUser');
		}

		__logger.information(`User ${userid} created`);
		__logger.debug(`Creation data for ${userid}: ${newUser}`);
		return true;
	}

	async exists(userid : string) : Promise<boolean> {
		let query : QueryConfig = {
			name: 'existsQuery',
			text: this.sqlExists,
			values: [userid]
		};

		__logger.debug(`Checking if user ${userid} exists`);
		let existingUser = await this.queryHandler.executeQuery(query);
		return existingUser[0]['exists'];
	}
}
