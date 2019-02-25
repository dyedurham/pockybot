import { ResultsService } from '../../lib/services/results-service';

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
}
