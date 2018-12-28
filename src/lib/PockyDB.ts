import dbConstants from './db-constants';
import { Client, QueryResult, QueryConfig } from 'pg';
import Config from './config';
import __logger from './logger';
import * as path from 'path';
import { CiscoSpark, PersonObject } from 'ciscospark/env';
import * as fs from 'fs';

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

	private client : Client;
	private spark : CiscoSpark;
	private config : Config;

	constructor(Client, sparkService) {
		this.client = Client;
		this.spark = sparkService;

		this.client.connect()
		.catch(function(e) {
			__logger.error(`Error connecting to database:\n${e.message}`);
		});

		this.sqlCreateUser = this._readFile('../../database/queries/create_pocky_user.sql');
		this.sqlExists = this._readFile('../../database/queries/exists.sql');
		this.sqlGivePegWithComment = this._readFile('../../database/queries/give_peg_with_comment.sql');
		this.sqlPegsGiven = this._readFile('../../database/queries/pegs_given.sql');
		this.sqlReset = this._readFile('../../database/queries/reset.sql');
		this.sqlReturnResults = this._readFile('../../database/queries/return_results.sql');
		this.sqlReturnWinners = this._readFile('../../database/queries/return_winners.sql');
		this.sqlReturnGives = this._readFile('../../database/queries/return_gives.sql');
		this.sqlUpdate = this._readFile('../../database/queries/update_pocky_user.sql');
		this.sqlGetUsers = this._readFile('../../database/queries/select_all_users.sql');
		this.sqlGetUser = this._readFile('../../database/queries/select_user.sql');

		this.sqlGetConfig = this._readFile('../../database/queries/get_config.sql');
		this.sqlGetStringConfig = this._readFile('../../database/queries/get_string_config.sql');
		this.sqlGetRoles = this._readFile('../../database/queries/get_roles.sql');
		this.sqlSetConfig = this._readFile('../../database/queries/set_config.sql');
		this.sqlSetStringConfig = this._readFile('../../database/queries/set_string_config.sql');
		this.sqlSetRoles = this._readFile('../../database/queries/set_roles.sql');
	}

	loadConfig(config) {
		this.config = config;
	}

	/**
	 * Returns 0 on success,
	 *         1 on "you have no more pegs left to give" failure
	 *         2 on error
	 */
	async givePegWithComment(comment : string, receiver : string, sender = "default_user") {
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

		var query : QueryConfig = {
			name: 'givePegWithCommentQuery',
			text: this.sqlGivePegWithComment,
			values: [sender, receiver, comment]
		};

		try {
			await this.executeNonQuery(query);
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
		var query : QueryConfig = {
			name: 'createUserQuery',
			text: this.sqlCreateUser,
			values: [userid, user.displayName]
		};

		try {
			return await this.executeNonQuery(query);
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

		var query : QueryConfig = {
			name: 'updateUserQuery',
			text: this.sqlUpdate,
			values: [username, userid]
		};

		try {
			await this.executeNonQuery(query);
			return dbConstants.updateUserSuccess;
		} catch (error) {
			__logger.error(`Error after updateUserQuery in updateUser for ${userid}:\n${error.message}`);
			return dbConstants.updateUserError;
		}
	}

	async getUsers() : Promise<any[]> {
		var query = {
			name: 'getUsersQuery',
			text: this.sqlGetUsers
		};

		return await this.executeQuery(query);
	}

	async getUser(userid : string) : Promise<any> {
		var query : QueryConfig = {
			name: 'getUserQuery',
			text: this.sqlGetUser,
			values: [userid]
		};

		let user = await this.executeQuery(query);

		if (user.rowCount === 1) {
			return user[0];
		} else if (user.rowCount === 0) {
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

		let newUser : any;
		try {
			newUser = await this.createUser(userid);
		} catch (error) {
			__logger.error(`Error caught from createUser for user ${userid}:\n${error.message}`);
			throw new Error("Error caught from createUser");
		}

		__logger.information(`User ${userid} created`);
		__logger.debug(`Creation data for ${userid}: ${newUser}`);
		return true;
	}

	async exists(userid : string) : Promise<boolean> {
		var query : QueryConfig = {
			name: 'existsQuery',
			text: this.sqlExists,
			values: [userid]
		};

		__logger.debug(`Checking if user ${userid} exists`);
		let existingUser = await this.executeQuery(query);
		return existingUser[0]['exists'];
	}

	async countPegsGiven(user : string) : Promise<number> {
		var query : QueryConfig = {
			name: 'pegsGiven',
			text: this.sqlPegsGiven,
			values: [user]
		};

		let data : any = await this.executeQuery(query);
		return data[0]['count'];
	}

	async hasSparePegs(user : string) : Promise<boolean> {
		__logger.debug(`Checking if user ${user} has spare pegs`);
		if (user === 'default_user' || this.config.checkRole(user, 'unmeteredUsers')) {
			return true;
		}

		var query : QueryConfig = {
			name: 'pegsGiven',
			text: this.sqlPegsGiven,
			values: [user]
		};

		let data : any = await this.executeQuery(query);
		let count : number = data[0]['count'];
		if (count < this.config.getConfig('limit')) {
			return true;
		}

		return false;
	}

	async reset() : Promise<QueryResult> {
		var query = {
			name: 'resetQuery',
			text: this.sqlReset
		};

		return await this.executeNonQuery(query);
	}

	async returnResults() : Promise<any> {
		var query = {
			name: 'returnResultsQuery',
			text: this.sqlReturnResults,
		};

		let results : any = await this.executeQuery(query);
		__logger.debug("returning results: " + JSON.stringify(results));
		return results;
	}

	async returnWinners() : Promise<any> {
		var query : QueryConfig = {
			name: 'returnWinnersQuery',
			text: this.sqlReturnWinners,
			values: [this.config.getConfig('minimum'), this.config.getConfig('winners')]
		};

		let winners : any = await this.executeQuery(query);
		__logger.debug("returning winners: " + JSON.stringify(winners));
		return winners;
	}

	async getPegsGiven(user) : Promise<any> {
		var query : QueryConfig = {
			name: 'returnGivesQuery',
			text: this.sqlReturnGives,
			values: [user]
		};

		return await this.executeQuery(query);
	}

	async getRoles() : Promise<any> {
		var query : QueryConfig = {
			name: 'returnRolesQuery',
			text: this.sqlGetRoles,
			values: []
		};

		return await this.executeQuery(query);
	}

	async getConfig() : Promise<any> {
		var query : QueryConfig = {
			name: 'returnConfigQuery',
			text: this.sqlGetConfig,
			values: []
		};

		return await this.executeQuery(query);
	}

	async getStringConfig() : Promise<any> {
		var query : QueryConfig = {
			name: 'returnStringConfigQuery',
			text: this.sqlGetStringConfig,
			values: []
		};

		return await this.executeQuery(query);
	}

	async setRoles(userid : string, role : string) : Promise<void> {
		var query : QueryConfig = {
			name: 'setRolesQuery',
			text: this.sqlSetRoles,
			values: [userid, role]
		};

		await this.executeNonQuery(query);
	}

	async setConfig(config : string, value : number) : Promise<void> {
		var query : QueryConfig = {
			name: 'setConfigQuery',
			text: this.sqlSetConfig,
			values: [config, value]
		};

		await this.executeNonQuery(query);
	}

	async setStringConfig(config : string, value : string) : Promise<void> {
		var query : QueryConfig = {
			name: 'setStringConfigQuery',
			text: this.sqlSetStringConfig,
			values: [config, value]
		};

		await this.executeNonQuery(query);
	}

	private _readFile(filename : string) : string {
		let filePath : string = path.resolve(__dirname, filename);
		return fs.readFileSync(filePath, 'utf8');
	}

	private async executeQuery(query : QueryConfig) : Promise<any> {
		try {
			let data = await this.client.query(query);
			return data['rows'];
		} catch (error) {
			__logger.error(`Error executing query ${query.name}:\n${error.message}`);
			throw new Error("Error executing query");
		}
	}

	private async executeNonQuery(query : QueryConfig) : Promise<QueryResult> {
		try {
			return await this.client.query(query);
		} catch (error) {
			__logger.error(`Error executing non query ${query.name}:\n${error.message}`);
			throw new Error("Error executing non query");
		}
	}
}
