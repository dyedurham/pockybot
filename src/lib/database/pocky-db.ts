import dbConstants from '../db-constants';
import { QueryResult, QueryConfig } from 'pg';
import Config from '../config-interface';
import __logger from '../logger';
import { CiscoSpark, PersonObject } from 'ciscospark/env';
import { ConfigRow, StringConfigRow, RolesRow, PegGiven, ResultRow, UserRow, Role } from '../../models/database';
import QueryHandler from './query-handler-interface';
import { DbUsers } from './db-interfaces';
import { PockyDB as PockyDbInterface } from './db-interfaces';

export default class PockyDB implements PockyDbInterface {
	private readonly sqlGivePegWithComment : string;
	private readonly sqlPegsGiven : string;
	private readonly sqlReset : string;
	private readonly sqlReturnResults : string;
	private readonly sqlReturnWinners : string;
	private readonly sqlReturnGives : string;

	private spark : CiscoSpark;
	private config : Config;
	private queryHandler : QueryHandler;
	private dbUsers : DbUsers;

	constructor(sparkService : CiscoSpark, queryHandler : QueryHandler, dbUsers : DbUsers) {
		this.spark = sparkService;
		this.queryHandler = queryHandler;
		this.dbUsers = dbUsers;

		this.sqlGivePegWithComment = this.queryHandler.readFile('../../database/queries/give_peg_with_comment.sql');
		this.sqlPegsGiven = this.queryHandler.readFile('../../database/queries/pegs_given.sql');
		this.sqlReset = this.queryHandler.readFile('../../database/queries/reset.sql');
		this.sqlReturnResults = this.queryHandler.readFile('../../database/queries/return_results.sql');
		this.sqlReturnWinners = this.queryHandler.readFile('../../database/queries/return_winners.sql');
		this.sqlReturnGives = this.queryHandler.readFile('../../database/queries/return_gives.sql');
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
			await Promise.all([this.dbUsers.existsOrCanBeCreated(sender), this.dbUsers.existsOrCanBeCreated(receiver)]);
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
}
