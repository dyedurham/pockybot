import Config from "../lib/config";
import { Role, ResultRow } from "../models/database";
import { MessageObject } from "ciscospark/env";
import { PockyDB } from "../lib/database/db-interfaces";
import MockPockyDb from "./mocks/mock-pockydb";

const config = new Config(null);

beforeAll(() => {
	spyOn(config, 'checkRole').and.callFake((userid: string, value: Role) => {
		if (userid === 'goodID' && value === Role.Admin) {
			return true;
		}
		else {
			return false;
		}
	});

	spyOn(config, 'getConfig').and.callFake((config: string) => {
		if (config === 'limit') {
			return 10;
		} else if (config === 'minimum') {
			return 5;
		} else if (config === 'winners') {
			return 3;
		} else if (config === 'commentsRequired') {
			return 1;
		} else if (config === 'pegWithoutKeyword') {
			return 0;
		}

		throw new Error('bad config');
	})
});


function createMessage(htmlMessage: string, person: string): MessageObject {
	return {
		html: htmlMessage,
		personId: person
	}
}

function createData(): ResultRow[] {
	return [{
		'receiver': 'mock receiver',
		'receiverid': 'mockID',
		'sender': 'mock sender',
		'comment': ' test'
	}];
}

function createDatabase(success: boolean, data: ResultRow[]): PockyDB {
	let db = new MockPockyDb(true, 1, true, 1, success ? data : undefined);
	return db;
}
