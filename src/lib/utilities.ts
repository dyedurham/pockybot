import { PegGivenData } from '../models/peg-given-data';
import { ResultRow } from '../models/database/result-row';
import { PegRecipient } from '../models/peg-recipient';
import { distinct } from './helpers/helpers';
import Config from './config-interface';

export default class Utilities {
	config: Config;

	constructor(config: Config) {
		this.config = config;
	}

	sleep(seconds : number) : Promise<void> {
		return new Promise(resolve => setTimeout(resolve, seconds * 1000));
	}

	getRandomInt(num : number) : number {
		return Math.floor(Math.random() * num);
	}

	commentIsPenalty(comment : string, keywords : string[], penaltyKeywords : string[]) : boolean {
		// If comment does not include penaltyKeyword
		if (!penaltyKeywords.some(keyword => comment.toLowerCase().includes(keyword.toLowerCase()))) {
			return false;
		}

		// If comment does include penaltyKeyword AND includes keyword
		if (keywords.some(keyword => comment.toLowerCase().includes(keyword.toLowerCase()))) {
			return false;
		}

		// If comment includes penaltyKeyword and does NOT include keyword
		return true;
	}

	getPenaltyPegs(givenPegs : PegGivenData[], keywords : string[], penaltyKeywords : string[]) : PegGivenData[] {
		return givenPegs.filter(peg =>
			// Peg includes penaltyKeyword, AND peg does not include keyword
			penaltyKeywords.some(keyword =>
				peg['comment'].toLowerCase().includes(keyword.toLowerCase()))
			&& (!keywords.some(keyword => peg['comment'].toLowerCase().includes(keyword.toLowerCase())))
		);
	}

	getNonPenaltyPegs(givenPegs : PegGivenData[], keywords : string[], penaltyKeywords : string[]) : PegGivenData[] {
		return givenPegs.filter(peg =>
			// Peg includes keyword, OR peg does not include penaltyKeyword
			keywords.some(keyword =>
				peg['comment'].toLowerCase().includes(keyword.toLowerCase()))
			|| (!penaltyKeywords.some(keyword => peg['comment'].toLowerCase().includes(keyword.toLowerCase())))
		);
	}

	pegValid(comment: string, requireKeywords: number, keywords: string[], penaltyKeywords: string[]): boolean {
		if (requireKeywords) {
			return keywords.some(x => comment.toLowerCase().includes(x.toLowerCase()));
		} else {
			return !penaltyKeywords.some(x => comment.toLowerCase().includes(x.toLowerCase()));
		}
	}

	getResults(results : ResultRow[]) : PegRecipient[] {
		const requireKeywords = this.config.getConfig('requireValues');
		const keywords = this.config.getStringConfig('keyword');
		const penaltyKeywords = this.config.getStringConfig('penaltyKeyword');

		let allSenders = results.map(x => x.senderid);
		allSenders = distinct(allSenders);
		let recipients : PegRecipient[] = [];

		allSenders.forEach(sender => {
			const validPegsReceived = results.filter(x => x.receiverid === sender && this.pegValid(x.comment, requireKeywords, keywords, penaltyKeywords));
			const penaltyPegsReceived = results.filter(x => x.receiverid === sender && !this.pegValid(x.comment, requireKeywords, keywords, penaltyKeywords));
			recipients.push({
				id: sender,
				weightedPegResult: validPegsReceived.length - penaltyPegsReceived.length,
				numberOfValidPegsReceived: validPegsReceived.length,
				numberOfPenaltiesReceived: penaltyPegsReceived.length,
				validPegsReceived,
				penaltyPegsSent: penaltyPegsReceived
			});
		});

		return recipients;
	}
};
