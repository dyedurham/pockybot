import constants from '../../constants';
import __logger from '../logger';

export interface KeywordCorrectionService {
	CorrectMessage(body: string, params: string) : Promise<string>
}

export class DefaultKeywordCorrectionService implements KeywordCorrectionService {
	async CorrectMessage(body: string, params: string) : Promise<string> {
        let html = "you peg has been succesfully sent";
        
        

		return html;
	}
}
