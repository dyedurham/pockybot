import { PegGivenData } from '../models/peg-given-data';

export default class Utilities {
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
};
