import __logger from '../logger';



export interface KeywordCorrectionService {
	CorrectMessage(body: string, params: string) : Promise<string>
}

export class DefaultKeywordCorrectionService implements KeywordCorrectionService {
    keys: string[];

    constructor() {
		this.keys = [];
	}

	async CorrectMessage(body: string, params: string) : Promise<string> {
        __logger.debug(`correcting message. body:${body} params: ${params}`);

        let index = this.keys.findIndex(params["key"])
        if (index == -1) {
            let html = "you peg has been succesfully sent";
            return html
        }

        //let data = keys[index].base64decode
        //data.message += " (${params[keyword]})";
        //send the peg again

        __logger.debug("message corrected");
        //replace with actual html page
        let html = "you peg has been succesfully sent";
		return html;
    }
    
    AddKey(key : string) : void {
        this.keys.push(key);
    }
}
