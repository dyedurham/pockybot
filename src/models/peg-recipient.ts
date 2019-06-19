import { ResultRow } from "./database";

export interface PegRecipient {
	id : string;
	weightedPegResult : number;
	numberOfValidPegsReceived : number;
	numberOfPenaltiesReceived : number;
	validPegsReceived : ResultRow[];
	penaltyPegsSent : ResultRow[];
}
