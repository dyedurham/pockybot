import constants from '../../constants';
import __logger from '../logger';
import { emitKeypressEvents } from 'readline';



export interface KeywordCorrectionService {
	CorrectMessage(body: string, params: string) : Promise<string>
}

export class DefaultKeywordCorrectionService implements KeywordCorrectionService {
    keys: string[];

    constructor() {
		this.keys = [];
	}

	async CorrectMessage(body: string, params: string) : Promise<string> {
        let html = "you peg has been succesfully sent";
        
        

		return html;
    }
    
    AddKey(key : string) : void {
        this.keys.push(key);
    }
}
