import dbConstants from '../db-constants';
import { QueryResult, QueryConfig } from 'pg';
import Config from '../config-interface';
import __logger from '../logger';
import { PegGiven, ResultRow, Role } from '../../models/database';
import { DbUsers } from './db-interfaces';
import { PockyDB as PockyDbInterface } from './db-interfaces';
import QueryHandler from './query-handler-interface';

export default class PockyDB implements PockyDbInterface {
	private readonly sqlGivePegWithComment : string;
	private readonly sqlPegsGiven : string;
	private readonly sqlReset : string;
	private readonly sqlReturnResults : string;
	private readonly sqlReturnWinners : string;
	private readonly sqlReturnGives : string;

	private config : Config;
	private queryHandler : QueryHandler;
	private dbUsers : DbUsers;

	constructor(queryHandler : QueryHandler, dbUsers : DbUsers) {
		this.queryHandler = queryHandler;
		this.dbUsers = dbUsers;

		this.sqlGivePegWithComment = this.queryHandler.readFile('../../../database/queries/give_peg_with_comment.sql');
		this.sqlPegsGiven = this.queryHandler.readFile('../../../database/queries/pegs_given.sql');
		this.sqlReset = this.queryHandler.readFile('../../../database/queries/reset.sql');
		this.sqlReturnResults = this.queryHandler.readFile('../../../database/queries/return_results.sql');
		this.sqlReturnWinners = this.queryHandler.readFile('../../../database/queries/return_winners.sql');
		this.sqlReturnGives = this.queryHandler.readFile('../../../database/queries/return_gives.sql');
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
		// Check or create both sender and receiver users
		try {
			await Promise.all([this.dbUsers.existsOrCanBeCreated(sender), this.dbUsers.existsOrCanBeCreated(receiver)]);
		} catch (error) {
			return dbConstants.pegError;
		}

		let senderHasPegs : boolean;
		try {
			senderHasPegs = await this.hasSparePegs(sender);
		} catch (error) {
			return dbConstants.pegError;
		}

		// TODO: make this faster and less repetitive by refactoring getting the list of penaltyKeywords.
		const penaltyKeywords = this.config.getStringConfig('penaltyKeyword');

		if (!senderHasPegs
			&&!penaltyKeywords.some(keyword => comment.toLowerCase().includes(keyword.toLowerCase()))) {
			__logger.information(`[PockyDb.givePegWithComment] Sender ${sender} has no spare pegs`);
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
			__logger.error(`[PockyDb.givePegWithComment] Error executing the givePegWithComment query: ${e.message}`);
			return dbConstants.pegError;
		}
	}

	async countPegsGiven(user : string) : Promise<number> {
		let query : QueryConfig = {
			name: 'pegsGiven',
			text: this.sqlPegsGiven,
			values: [user]
		};

		let givenPegs : any;

		try {
			givenPegs = await this.queryHandler.executeQuery(query);
		} catch (error) {
			__logger.error(`[PockyDb.countPegsGiven] Error executing query to count pegs given by user ${user}`);
			throw error;
		}

		const penaltyKeywords = this.config.getStringConfig('penaltyKeyword');
		const nonPenaltyPegs = givenPegs.filter(peg =>
			!penaltyKeywords.some(keyword =>
				peg['comment'].toLowerCase().includes(keyword.toLowerCase())));

		return nonPenaltyPegs.length;
	}

	async hasSparePegs(user : string) : Promise<boolean> {
		let count = this.countPegsGiven(user);
		__logger.debug(`[PockyDb.hasSparePegs] Checking if user ${user} has spare pegs`);

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
		__logger.debug('[PockyDb.returnResults] returning results: ' + JSON.stringify(results));
		return results;
	}

	async returnWinners() : Promise<ResultRow[]> {
		let query : QueryConfig = {
			name: 'returnWinnersQuery',
			text: this.sqlReturnWinners,
			values: [this.config.getConfig('minimum'), this.config.getConfig('winners')]
		};

		let winners : ResultRow[] = await this.queryHandler.executeQuery(query);
		__logger.debug('[PockyDb.returnWinners] returning winners: ' + JSON.stringify(winners));
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
