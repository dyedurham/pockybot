import dbConstants from '../db-constants';
import { QueryResult, QueryConfig } from 'pg';
import Config from '../config-interface';
import { Logger } from '../logger';
import { PegGiven, ResultRow, Role } from '../../models/database';
import { DbUsers } from './db-interfaces';
import { PockyDB as PockyDbInterface } from './db-interfaces';
import QueryHandler from './query-handler-interface';
import Utilities from '../utilities';
import { PegGivenData } from '../../models/peg-given-data';

export default class PockyDB implements PockyDbInterface {
	private readonly sqlGivePegWithComment : string;
	private readonly sqlPegsGiven : string;
	private readonly sqlReset : string;
	private readonly sqlReturnResults : string;
	private readonly sqlReturnGives : string;

	private config : Config;
	private queryHandler : QueryHandler;
	private dbUsers : DbUsers;
	private readonly utilities : Utilities;


	constructor(queryHandler : QueryHandler, dbUsers : DbUsers, utilities : Utilities) {
		this.queryHandler = queryHandler;
		this.dbUsers = dbUsers;
		this.utilities = utilities;

		this.sqlGivePegWithComment = this.queryHandler.readFile('../../../database/queries/give_peg_with_comment.sql');
		this.sqlPegsGiven = this.queryHandler.readFile('../../../database/queries/pegs_given.sql');
		this.sqlReset = this.queryHandler.readFile('../../../database/queries/reset.sql');
		this.sqlReturnResults = this.queryHandler.readFile('../../../database/queries/return_results.sql');
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
			senderHasPegs = await this.senderCanPeg(sender, comment);
		} catch (error) {
			return dbConstants.pegError;
		}

		if (!senderHasPegs) {
			Logger.information(`[PockyDb.givePegWithComment] Sender ${sender} has no spare pegs`);
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
			Logger.error(`[PockyDb.givePegWithComment] Error executing the givePegWithComment query: ${e.message}`);
			return dbConstants.pegError;
		}
	}

	async countPegsGiven(user : string, keywords : string[], penaltyKeywords : string[]) : Promise<number> {
		let query : QueryConfig = {
			name: 'pegsGiven',
			text: this.sqlPegsGiven,
			values: [user]
		};

		let givenPegs : PegGivenData[];

		try {
			givenPegs = await this.queryHandler.executeQuery(query);
		} catch (error) {
			Logger.error(`[PockyDb.countPegsGiven] Error executing query to count pegs given by user ${user}`);
			throw error;
		}

		const nonPenaltyPegs = this.utilities.getNonPenaltyPegs(givenPegs, keywords, penaltyKeywords);

		return nonPenaltyPegs.length;
	}

	async senderCanPeg(user : string, comment : string) : Promise<boolean> {
		const keywords = this.config.getStringConfig('keyword');
		const penaltyKeywords = this.config.getStringConfig('penaltyKeyword');

		let count = this.countPegsGiven(user, keywords, penaltyKeywords);

		Logger.debug(`[PockyDb.senderCanPeg] Checking if user ${user} has spare pegs`);

		if (this.utilities.commentIsPenalty(comment, keywords, penaltyKeywords)) {
			return true;
		}

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
		Logger.debug('[PockyDb.returnResults] returning results: ' + JSON.stringify(results));
		return results;
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
