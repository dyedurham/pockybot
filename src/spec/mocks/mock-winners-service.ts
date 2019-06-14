import { WinnersService } from '../../lib/services/winners-service';
import { ResultRow } from '../../models/database';

export default class MockWinnersService implements WinnersService {
	success: boolean;
	resultString: string;

	constructor(success: boolean, resultString: string){
		this.success = success;
		this.resultString = resultString;
	}

	getWinners(results: ResultRow[]) : ResultRow[] {
		return [];
	}

	returnWinnersResponse(): Promise<string> {
		if(!this.success){
			return Promise.reject("failed to return winners");
		}else{
			return Promise.resolve(this.resultString);
		}
	}
}
