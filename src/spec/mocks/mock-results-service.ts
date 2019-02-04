import { IResultsService } from '../../lib/services/results-service';
import { Receiver } from '../../models/receiver';

export default class MockResultsService implements IResultsService {

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
	generateHtml(winners: Receiver[], results: Receiver[], todayString: string): string {
		if (!this.success) {
			throw new Error("Unable to generate html");
		} else {
			return this.resultString;
		}
	}
}
