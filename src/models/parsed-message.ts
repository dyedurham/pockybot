import * as xml from "libxmljs";

export interface ParsedMessage {
	fromPerson: string;
	toPersonId: string;
	botId: string;
	children: xml.Element[];
	comment: string;
}
