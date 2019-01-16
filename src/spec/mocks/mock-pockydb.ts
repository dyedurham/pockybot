import PockyDB from '../../lib/database/pocky-db';
import Config from '../../lib/config';
import { ResultRow, PegGiven } from '../../models/database';
import { QueryResult } from 'pg';
import QueryHandler from '../../lib/database/query-handler';
import DbUsers from '../../lib/database/db-users';
import { CiscoSpark } from 'ciscospark/env';

export default class MockPockyDb implements PockyDB {
	private spark : CiscoSpark;
	private config : Config;
	private queryHandler : QueryHandler;
	private dbUsers : DbUsers;

	constructor() {
	}

	loadConfig(config : Config) : void {
		throw new Error("Method not implemented.");
	}

	async givePegWithComment(comment : string, receiver : string, sender? : string) : Promise<number> {
		throw new Error("Method not implemented.");
	}
	async countPegsGiven(user: string) : Promise<number> {
		throw new Error("Method not implemented.");
	}
	async hasSparePegs(user: string) : Promise<boolean> {
		throw new Error("Method not implemented.");
	}
	async returnResults() : Promise<ResultRow[]> {
		throw new Error("Method not implemented.");
	}
	async returnWinners() : Promise<ResultRow[]> {
		throw new Error("Method not implemented.");
	}
	async getPegsGiven(user : string) : Promise<PegGiven[]> {
		throw new Error("Method not implemented.");
	}

	async reset() : Promise<QueryResult> {
		throw new Error("Method not implemented.");
	}


}
