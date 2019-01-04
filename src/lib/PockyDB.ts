import dbConstants from './db-constants';
import { QueryResult, QueryConfig } from 'pg';
import Config from './config';
import __logger from './logger';
import * as path from 'path';
import { CiscoSpark, PersonObject } from 'ciscospark/env';
import * as fs from 'fs';
import { ConfigRow, StringConfigRow, RolesRow, PegGiven, ResultRow, UserRow, Role } from '../models/database';
import QueryHandler from './database/query-handler';

export default class PockyDB {
	private readonly sqlCreateUser : string;
	private readonly sqlExists : string;
	private readonly sqlGivePegWithComment : string;
	private readonly sqlPegsGiven : string;
	private readonly sqlReset : string;
	private readonly sqlReturnResults : string;
	private readonly sqlReturnWinners : string;
	private readonly sqlReturnGives : string;
	private readonly sqlUpdate : string;
	private readonly sqlGetUsers : string;
	private readonly sqlGetUser : string;

	private readonly sqlGetConfig : string;
	private readonly sqlGetStringConfig : string;
	private readonly sqlGetRoles : string;
	private readonly sqlSetConfig : string;
	private readonly sqlSetStringConfig : string;
	private readonly sqlSetRoles : string;

	private spark : CiscoSpark;
	private config : Config;
	private queryHandler : QueryHandler;

	constructor(sparkService : CiscoSpark, queryHandler : QueryHandler) {
		this.spark = sparkService;
		this.queryHandler = queryHandler;

		this.sqlCreateUser = this.queryHandler._readFile('../../database/queries/create_pocky_user.sql');
		this.sqlExists = this.queryHandler._readFile('../../database/queries/exists.sql');
		this.sqlGivePegWithComment = this.queryHandler._readFile('../../database/queries/give_peg_with_comment.sql');
		this.sqlPegsGiven = this.queryHandler._readFile('../../database/queries/pegs_given.sql');
		this.sqlReset = this.queryHandler._readFile('../../database/queries/reset.sql');
		this.sqlReturnResults = this.queryHandler._readFile('../../database/queries/return_results.sql');
		this.sqlReturnWinners = this.queryHandler._readFile('../../database/queries/return_winners.sql');
		this.sqlReturnGives = this.queryHandler._readFile('../../database/queries/return_gives.sql');
		this.sqlUpdate = this.queryHandler._readFile('../../database/queries/update_pocky_user.sql');
		this.sqlGetUsers = this.queryHandler._readFile('../../database/queries/select_all_users.sql');
		this.sqlGetUser = this.queryHandler._readFile('../../database/queries/select_user.sql');

		this.sqlGetConfig = this.queryHandler._readFile('../../database/queries/get_config.sql');
		this.sqlGetStringConfig = this.queryHandler._readFile('../../database/queries/get_string_config.sql');
		this.sqlGetRoles = this.queryHandler._readFile('../../database/queries/get_roles.sql');
		this.sqlSetConfig = this.queryHandler._readFile('../../database/queries/set_config.sql');
		this.sqlSetStringConfig = this.queryHandler._readFile('../../database/queries/set_string_config.sql');
		this.sqlSetRoles = this.queryHandler._readFile('../../database/queries/set_roles.sql');
	}

	loadConfig(config : Config) {
		this.config = config;
	}

	/**
	 * Returns 0 on success,
	 *         1 on 'you have no more pegs left to give' failure
	 *         2 on error
	 */
	async givePegWithComment(comment : string, receiver : string, sender = 'default_user') : Promise<number> {
		try {
			await Promise.all([this.existsOrCanBeCreated(sender), this.existsOrCanBeCreated(receiver)]);
		} catch (error) {
			__logger.error(`Error in one of the sender/receiver exists queries:\n${error.message}`);
			return dbConstants.pegError;
		}

		let senderHasPegs : boolean;
		try {
			senderHasPegs = await this.hasSparePegs(sender);
		} catch (error) {
			__logger.error(`Error after hasSparePegs ${sender}:\n${error.message}`);
			return dbConstants.pegError;
		}

		if (!senderHasPegs) {
			__logger.information(`Sender ${sender} has no spare pegs`);
			return dbConstants.pegAllSpent;
		}

		let query : QueryConfig = {
			name: 'givePegWithCommentQuery',
			text: this.sqlGivePegWithComment,
			values: [sender, receiver, comment]
		};

		try {
			await this.queryHandler.executeNonQuery(query);
			return dbConstants.pegSuccess;
		} catch (e) {
			__logger.error(`Error after givePegWithCommentQuery:\n${e.message}`);
			return dbConstants.pegError;
		}
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

	async countPegsGiven(user : string) : Promise<number> {
		let query : QueryConfig = {
			name: 'pegsGiven',
			text: this.sqlPegsGiven,
			values: [user]
		};

		let data = await this.queryHandler.executeQuery(query);
		return data[0]['count'];
	}

	async hasSparePegs(user : string) : Promise<boolean> {
		let count = this.countPegsGiven(user);
		__logger.debug(`Checking if user ${user} has spare pegs`);

		if (user === 'default_user' || this.config.checkRole(user, Role.Unmetered)) {
			return true;
		}

		if (await count < this.config.getConfig('limit')) {
			return true;
		}

		return false;
	}

	async reset() : Promise<QueryResult> {
		let query = {
			name: 'resetQuery',
			text: this.sqlReset
		};

		return await this.queryHandler.executeNonQuery(query);
	}

	async returnResults() : Promise<ResultRow[]> {
		let query = {
			name: 'returnResultsQuery',
			text: this.sqlReturnResults,
		};

		let results : ResultRow[] = await this.queryHandler.executeQuery(query);
		__logger.debug('returning results: ' + JSON.stringify(results));
		return results;
	}

	async returnWinners() : Promise<ResultRow[]> {
		let query : QueryConfig = {
			name: 'returnWinnersQuery',
			text: this.sqlReturnWinners,
			values: [this.config.getConfig('minimum'), this.config.getConfig('winners')]
		};

		let winners : ResultRow[] = await this.queryHandler.executeQuery(query);
		__logger.debug('returning winners: ' + JSON.stringify(winners));
		return winners;
	}

	async getPegsGiven(user : string) : Promise<PegGiven[]> {
		let query : QueryConfig = {
			name: 'returnGivesQuery',
			text: this.sqlReturnGives,
			values: [user]
		};

		return await this.queryHandler.executeQuery(query);
	}

	async getRoles() : Promise<RolesRow[]> {
		let query : QueryConfig = {
			name: 'returnRolesQuery',
			text: this.sqlGetRoles,
			values: []
		};

		return await this.queryHandler.executeQuery(query);
	}

	async getConfig() : Promise<ConfigRow[]> {
		let query : QueryConfig = {
			name: 'returnConfigQuery',
			text: this.sqlGetConfig,
			values: []
		};

		return await this.queryHandler.executeQuery(query);
	}

	async getStringConfig() : Promise<StringConfigRow[]> {
		let query : QueryConfig = {
			name: 'returnStringConfigQuery',
			text: this.sqlGetStringConfig,
			values: []
		};

		return await this.queryHandler.executeQuery(query);
	}

	async setRoles(userid : string, role : Role) : Promise<void> {
		let query : QueryConfig = {
			name: 'setRolesQuery',
			text: this.sqlSetRoles,
			values: [userid, role]
		};

		await this.queryHandler.executeNonQuery(query);
	}

	async setConfig(config : string, value : number) : Promise<void> {
		let query : QueryConfig = {
			name: 'setConfigQuery',
			text: this.sqlSetConfig,
			values: [config, value]
		};

		await this.queryHandler.executeNonQuery(query);
	}

	async setStringConfig(config : string, value : string) : Promise<void> {
		let query : QueryConfig = {
			name: 'setStringConfigQuery',
			text: this.sqlSetStringConfig,
			values: [config, value]
		};

		await this.queryHandler.executeNonQuery(query);
	}
}
