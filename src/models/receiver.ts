import { PegReceivedData } from "./peg-received-data";

export interface Receiver {
	id: string;
	person: string;
	pegs: PegReceivedData[];
	weightedPegsReceived: number;
	validPegsReceived: number;
}
