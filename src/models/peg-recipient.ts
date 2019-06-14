import { ResultRow } from "./database";

export interface PegRecipient {
	senderid : string;
	numberOfValidPegsReceived : number;
	validPegsReceived: ResultRow[];
}
