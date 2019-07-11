import { Peg } from './peg';

export interface Result {
	personId : string;
	personName : string;
	weightedPegsReceived : number;
	validPegsReceived : Peg[];
	penaltyPegsGiven : Peg[];
}
