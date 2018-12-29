import { CiscoSpark, MessageObject, RoomObject, WebhookObject, Page, PersonObject } from "ciscospark/env";

export default class MockCiscoSpark implements CiscoSpark {
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

	constructor() {
		this.ciscospark = true;
		this.version = 'mockVersion';
		this.webhooks = {
			create : (webhook : WebhookObject) => new Promise((resolve, reject) => resolve(null)),
			get : (webhook : WebhookObject | string) => new Promise((resolve, reject) => resolve(null)),
			list : (options ?: {max : number}) => new Promise((resolve, reject) => resolve(null)),
			remove : (webhook : WebhookObject | string) => new Promise((resolve, reject) => resolve()),
			update : (webhook : WebhookObject) => new Promise((resolve, reject) => resolve(null))
		};
		this.messages = {
			create: (message: MessageObject) => new Promise((resolve, reject) => resolve(null)),
			get: (room: RoomObject) => new Promise((resolve, reject) => resolve(null)),
			list: (options?: { roomId: string; max: number; }) => new Promise((resolve, reject) => resolve(null)),
			remove: (message: number | MessageObject) => new Promise((resolve, reject) => resolve())
		};
		this.rooms = {
			create : (room : RoomObject) => new Promise((resolve, reject) => resolve(null)),
			get : (room : RoomObject | string, options : any) => new Promise((resolve, reject) => resolve(null)),
			list : (options ?: {max : number}) => new Promise((resolve, reject) => resolve(null)),
			remove : (room : RoomObject | string) => new Promise((resolve, reject) => resolve()),
			update : (room : RoomObject) => new Promise((resolve, reject) => resolve(null))
		};
		this.people = {
			get : (person : PersonObject | number | string) => new Promise((resolve, reject) => resolve(null)),
			list : (options : number[] | {email : string, displayName : string}) => new Promise((resolve, reject) => resolve(null)),
		};
	}
}
