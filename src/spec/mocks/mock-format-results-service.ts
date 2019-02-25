import { FormatResultsService } from '../../lib/services/format-results-service';

export default class MockFormatResultsService implements FormatResultsService {

	success: boolean;
	resultString: string;

	constructor(success: boolean, resultString: string){
		this.success = success;
		this.resultString = resultString;
	}

	async returnResultsHtml(): Promise<string> {
		if (!this.success) {
			throw new Error("Unable to generate html");
		} else {
			return this.resultString;
		}
	}
}
