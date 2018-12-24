import dbConstants from './db-constants';
import { Client } from 'pg';
import Config from '../lib/config';
import __logger from '../lib/logger';

export default class PockyDB {
	readonly sqlCreateUser : string;
	readonly sqlExists : string;
	readonly sqlGivePegWithComment : string;
	readonly sqlPegsGiven : string;
	readonly sqlReset : string;
	readonly sqlReturnResults : string;
	readonly sqlReturnWinners : string;
	readonly sqlReturnGives : string;
	readonly sqlUpdate : string;
	readonly sqlGetUsers : string;
	readonly sqlGetUser : string;

	readonly sqlGetConfig : string;
	readonly sqlGetStringConfig : string;
	readonly sqlGetRoles : string;
	readonly sqlSetConfig : string;
	readonly sqlSetStringConfig : string;
	readonly sqlSetRoles : string;

	client : Client;
	spark : any;
	fs : any;
	config : Config;

	constructor(Client, sparkService) {
		this.client = Client;
		this.spark = sparkService;
		this.fs = require('fs');

		this.client.connect()
		.catch(function(e) {
			__logger.error(`Error connecting to database:\n${e.message}`);
		});

		this.sqlCreateUser = this._readFile('./database/create_pocky_user.sql');
		this.sqlExists = this._readFile('./database/exists.sql');
		this.sqlGivePegWithComment = this._readFile('./database/give_peg_with_comment.sql');
		this.sqlPegsGiven = this._readFile('./database/pegs_given.sql');
		this.sqlReset = this._readFile('./database/reset.sql');
		this.sqlReturnResults = this._readFile('./database/return_results.sql');
		this.sqlReturnWinners = this._readFile('./database/return_winners.sql');
		this.sqlReturnGives = this._readFile('./database/return_gives.sql');
		this.sqlUpdate = this._readFile('./database/update_pocky_user.sql');
		this.sqlGetUsers = this._readFile('./database/select_all_users.sql');
		this.sqlGetUser = this._readFile('./database/select_user.sql');

		this.sqlGetConfig = this._readFile('./database/get_config.sql');
		this.sqlGetStringConfig = this._readFile('./database/get_string_config.sql');
		this.sqlGetRoles = this._readFile('./database/get_roles.sql');
		this.sqlSetConfig = this._readFile('./database/set_config.sql');
		this.sqlSetStringConfig = this._readFile('./database/set_string_config.sql');
		this.sqlSetRoles = this._readFile('./database/set_roles.sql');
	}

	loadConfig(config) {
		this.config = config;
	}

	/**
	 * Returns 0 on success,
	 *         1 on "you have no more pegs left to give" failure
	 *         2 on error
	 */
	async givePegWithComment(comment, receiver, sender = "default_user") {
		try {
			await Promise.all([this.existsOrCanBeCreated(sender), this.existsOrCanBeCreated(receiver)]);
		} catch (error) {
			__logger.error(`Error in one of the sender/receiver exists queries:\n${error.message}`);
			return dbConstants.pegError;
		}

		let senderHasPegs;
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

		var query = {
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

	async createUser(userid) {
		let user;
		try {
			user = await this.spark.people.get(userid);
		} catch (error) {
			__logger.error(`Error getting user from userid:\n${error.message}`);
			throw new Error('Error getting user in createUser');
		}

		__logger.information(`Creating a new user with userid ${userid} and username ${user.displayName}`);
		var query = {
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

	async updateUser(username, userid) {
		__logger.information(`Updating user ${userid} with username ${username}`);

		try {
			await this.existsOrCanBeCreated(userid);
		} catch (error) {
			__logger.error(`Error after 'exists' in updateUser for ${userid}:\n${error.message}`);
			return dbConstants.updateUserError;
		}

		var query = {
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

	async getUsers() {
		var query = {
			name: 'getUsersQuery',
			text: this.sqlGetUsers
		};

		return await this.executeQuery(query);
	}

	async getUser(userid) {
		var query = {
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

	async existsOrCanBeCreated(userid) {
		let exists = await this.exists(userid);
		if (exists) {
			__logger.debug(`User ${userid} already exists`);
			return true;
		}

		let newUser;
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

	async exists(userid) {
		var query = {
			name: 'existsQuery',
			text: this.sqlExists,
			values: [userid]
		};

		__logger.debug(`Checking if user ${userid} exists`);
		let existingUser = await this.executeQuery(query);
		return existingUser[0]['exists'];
	}

	async countPegsGiven(user) {
		var query = {
			name: 'pegsGiven',
			text: this.sqlPegsGiven,
			values: [user]
		};

		let data = await this.executeQuery(query);
		return data[0]['count'];
	}

	async hasSparePegs(user) {
		__logger.debug(`Checking if user ${user} has spare pegs`);
		if (user === 'default_user' || this.config.checkRole(user,'unmeteredUsers')) {
			return true;
		}

		var query = {
			name: 'pegsGiven',
			text: this.sqlPegsGiven,
			values: [user]
		};

		let data = await this.executeQuery(query);
		let count = data[0]['count'];
		if (count < this.config.getConfig('limit')) {
			return true;
		}

		return false;
	}

	async reset() {
		var query = {
			name: 'resetQuery',
			text: this.sqlReset
		};

		return await this.executeNonQuery(query);
	}

	async returnResults() {
		var query = {
			name: 'returnResultsQuery',
			text: this.sqlReturnResults,
		};

		let results = await this.executeQuery(query);
		__logger.debug("returning results: " + JSON.stringify(results));
		return results;
	}

	async returnWinners() {
		var query = {
			name: 'returnWinnersQuery',
			text: this.sqlReturnWinners,
			values: [this.config.getConfig('minimum'), this.config.getConfig('winners')]
		};

		let winners = await this.executeQuery(query);
		__logger.debug("returning winners: " + JSON.stringify(winners));
		return winners;
	}

	async getPegsGiven(user) {
		var query = {
			name: 'returnGivesQuery',
			text: this.sqlReturnGives,
			values: [user]
		};

		return await this.executeQuery(query);
	}

	async getRoles() {
		var query = {
			name: 'returnRolesQuery',
			text: this.sqlGetRoles,
			values: []
		};

		return await this.executeQuery(query);
	}

	async getConfig() {
		var query = {
			name: 'returnConfigQuery',
			text: this.sqlGetConfig,
			values: []
		};

		return await this.executeQuery(query);
	}

	async getStringConfig() {
		var query = {
			name: 'returnStringConfigQuery',
			text: this.sqlGetStringConfig,
			values: []
		};

		return await this.executeQuery(query);
	}

	async setRoles(userid, role) {
		var query = {
			name: 'setRolesQuery',
			text: this.sqlSetRoles,
			values: [userid, role]
		};

		await this.executeNonQuery(query);
	}

	async setConfig(config, value) {
		var query = {
			name: 'setConfigQuery',
			text: this.sqlSetConfig,
			values: [config, value]
		};

		await this.executeNonQuery(query);
	}

	async setStringConfig(config, value) {
		var query = {
			name: 'setStringConfigQuery',
			text: this.sqlSetStringConfig,
			values: [config, value]
		};

		await this.executeNonQuery(query);
	}

	_readFile(filename) {
		return this.fs.readFileSync(filename, 'utf8');
	}

	async executeQuery(query) {
		try {
			let data = await this.client.query(query);
			return data['rows'];
		} catch (error) {
			__logger.error(`Error executing query ${query.name}:\n${error.message}`);
			throw new Error("Error executing query");
		}
	}

	async executeNonQuery(query) {
		try {
			return await this.client.query(query);
		} catch (error) {
			__logger.error(`Error executing non query ${query.name}:\n${error.message}`);
			throw new Error("Error executing non query");
		}
	}
}
