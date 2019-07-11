import { ResultsService } from '../../lib/services/results-service';
import { Peg } from '../../models/peg';
import { Result } from '../../models/result';

export default class MockResultsService implements ResultsService {

	success: boolean;
	resultString: string;

	constructor(success: boolean, resultString: string) {
		this.success = success;
		this.resultString = resultString;
	}

	returnResultsMarkdown(): Promise<string> {
		if (!this.success) {
			return Promise.reject("failed to return winners");
		} else {
			return Promise.resolve(this.resultString);
		}
	}

	getResults(pegs: Peg[]): Result[] {
		throw new Error('not implemented');
	}
}
