export interface Peg {
	receiverId : string;
	receiverName : string;
	receiverLocation ?: string;
	senderId : string;
	senderName : string;
	senderLocation ?: string;
	comment : string;
	categories : string[];
	isValid : boolean;
	pegWeighting : number;
}
