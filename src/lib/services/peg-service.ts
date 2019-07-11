import { ResultRow } from '../../models/database/result-row';
import { Peg } from '../../models/peg';
import Config from '../config-interface';
import Utilities from '../utilities';

export interface PegService {
	getPegs(results : ResultRow[]) : Peg[];
}

export class DefaultPegService implements PegService {
	private config : Config;
	private utilities : Utilities;

	public constructor(config : Config, utilities : Utilities) {
		this.config = config;
		this.utilities = utilities;
	}

	public getPegs(results: ResultRow[]) : Peg[] {
		const requireKeywords = this.config.getConfig('requireValues');
		const keywords = this.config.getStringConfig('keyword');
		const penaltyKeywords = this.config.getStringConfig('penaltyKeyword');

		return results.map(peg => {
			const categories = this.getKeywords(peg.comment, keywords);
			const isValid = this.utilities.pegValid(peg.comment, requireKeywords, keywords, penaltyKeywords);
			return {
				receiverId: peg.receiverid,
				receiverName: peg.receiver,
				senderId: peg.senderid,
				senderName: peg.sender,
				comment: peg.comment,
				categories,
				isValid
			};
		});
	}

	private getKeywords(comment : string, keywords : string[]) : string[] {
		return keywords.filter(keyword => comment.toLowerCase().includes(keyword.toLowerCase()));
	}
}
