import { Peg } from './peg';

export interface Result {
	personId : string;
	personName : string;
	personLocation ?: string;
	weightedPegsReceived : number;
	validPegsReceived : Peg[];
	penaltyPegsGiven : Peg[];
}
