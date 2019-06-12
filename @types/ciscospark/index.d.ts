declare module 'ciscospark/env' {
	interface WebhookObject {
		id ?: string;
		resource ?: string;
		event ?: string;
		filter ?: string;
		targetUrl? : string;
		name ?: string;
		created ?: Date;
	}

	interface RoomObject {
		id ?: string;
		title ?: string;
		teamId ?: string;
		created ?: Date;
	}

	interface MessageObject {
		id ?: string;
		personId ?: string;
		personEmail ?: string;
		toPersonId ?: string;
		roomId ?: string;
		roomType ?: string;
		text ?: string;
		markdown ?: string;
		files ?: string[];
		html ?: string;
		mentionedPeople ?: string[];
		created ?: Date;
	}

	interface PersonObject {
		id : string;
		emails : string[];
		displayName : string;
		created : Date;
		type : string;
	}

	class Page<T> implements Iterable<T> {
		items : T[];
		length : number;
		links : any;
		spark : any;
		static parseLinkHeaders : (linkHeaders : string) => any;
		next : () => Promise<Page<T>>;
		hasNext : () => boolean;
		previous : () => Promise<Page<T>>;
		hasPrevious : () => boolean;
		getLink : (link : string) => Promise<Page<T>>;
		hasLink : (link : string) => boolean;
		[Symbol.iterator] : () => Iterator<T>;
	}

	interface CiscoSpark {
		ciscospark : boolean;
		version : string;
		webhooks : {
			create : (webhook : WebhookObject) => Promise<WebhookObject>;
			get : (webhook : WebhookObject | string) => Promise<WebhookObject[]>;
			list : (options ?: {max : number}) => Promise<Page<WebhookObject>>;
			remove : (webhook : WebhookObject | string) => Promise<void>;
			update : (webhook : WebhookObject) => Promise<WebhookObject>;
		};
		messages : {
			create : (message : MessageObject) => Promise<MessageObject>;
			get : (room : RoomObject | string) => Promise<MessageObject>;
			list : (options ?: {roomId : string, max : number}) => Promise<Page<MessageObject>>;
			remove : (message : MessageObject | number) => Promise<void>;
		};
		rooms : {
			create : (room : RoomObject) => Promise<RoomObject>;
			get : (room : RoomObject | string, options : any) => Promise<RoomObject>;
			list : (options ?: {max : number}) => Promise<Page<RoomObject>>;
			remove : (room : RoomObject | string) => Promise<void>;
			update : (room : RoomObject) => Promise<RoomObject>;
		};
		people : {
			get : (person : PersonObject | number | string) => Promise<PersonObject>;
			list : (options : number[] | {email : string, displayName : string}) => Promise<Page<PersonObject>>;
		}
	}

	const spark : CiscoSpark;
	export default spark;

	export {
		WebhookObject,
		RoomObject,
		MessageObject,
		Page,
		PersonObject,
		CiscoSpark
	}
}
