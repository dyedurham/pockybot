import { PockyDB } from '../../lib/database/db-interfaces';
import Config from '../../lib/config';
import { ResultRow, PegGiven } from '../../models/database';
import { QueryResult } from 'pg';

export default class MockPockyDb implements PockyDB {
	private givePegSuccess : boolean;
	private givenPegsResponse : number;
	private countSuccess : boolean;
	private countResponse : number;

	constructor(givePegSuccess : boolean, givePegResponse : number, countSuccess : boolean, countResponse : number) {
		this.givePegSuccess = givePegSuccess;
		this.givenPegsResponse = givePegResponse;
		this.countSuccess = countSuccess;
		this.countResponse = countResponse;
	}

	loadConfig(config : Config) : void {
		return;
	}

	async givePegWithComment(comment : string, receiver : string, sender? : string) : Promise<number> {
		if (this.givePegSuccess) {
			return this.givenPegsResponse;
		} else {
			Promise.reject();
		}
	}

	async countPegsGiven(user: string) : Promise<number> {
		if (this.countSuccess) {
			return this.countResponse;
		} else {
			Promise.reject();
		}
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
