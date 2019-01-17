import Unpeg from '../lib/response-triggers/unpeg';
import constants from '../constants';
import PockyDB from '../lib/database/pocky-db';
import Utilities from '../lib/utilities';
import { Client } from 'pg';
import MockCiscoSpark from './mocks/mock-spark';
import { MessageObject } from 'ciscospark/env';
import { DbUsers } from '../lib/database/db-interfaces';
import MockDbUsers from './mocks/mock-dbusers';

const spark = new MockCiscoSpark();

function createMessage(htmlMessage : string, personId = 'MockSender', receiver = 'MockReceiver') : MessageObject {
	return {
		html: htmlMessage,
		personId: personId,
		mentionedPeople: [constants.botId, receiver]
	};
}

function createDatabase() : DbUsers {
	let client = new Client();
	spyOn(client, 'connect').and.returnValue(new Promise(resolve => resolve()));
	let db = new MockDbUsers();

	spyOn(db, 'getUser').and.callFake((userid : string) => {
		return new Promise((resolve, reject) => {
			resolve({
				username: userid + ' Name',
				userid: userid
			});
		})
	});

	return db;
}

function createUtilities(numToReturn : number) : Utilities {
	let utilities = new Utilities();

	spyOn(utilities, 'sleep').and.returnValue(new Promise((resolve, reject) => resolve()));
	spyOn(utilities, 'getRandomInt').and.returnValue(numToReturn);

	return utilities;
}

describe('unpeg triggers', () => {
	it('should accept an unpeg command', () => {
		let database = createDatabase();
		let utilities = createUtilities(1);

		let unpeg = new Unpeg(spark, database, utilities);
		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> unpeg <spark-mention data-object-type="person" data-object-id="MockReceiver">ShameBot</spark-mention> with a comment</p>');

		try {
			let message = unpeg.isToTriggerOn(sentMessage);
			expect(message).toBe(true);
		} catch(e) {
			console.log(e);
			expect(false).toBe(true);
		}
	});

	it('should reject peg command', () => {
		let database = createDatabase();
		let utilities = createUtilities(1);

		let unpeg = new Unpeg(spark, database, utilities);

		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg <spark-mention data-object-type="person" data-object-id="MockReceiver">ShameBot</spark-mention> with a comment</p>');

		try {
			let message = unpeg.isToTriggerOn(sentMessage);
			expect(message).toBe(false);
		} catch(e) {
			console.log(e);
			expect(false).toBe(true);
		}
	});
});

describe('unpeg messages', () => {
	type UnpegTestData = {
		case : number,
		twoStage : boolean,
		firstResponse ?: string,
		response : string
	}

	const testCases : UnpegTestData[] = [
		{
			case: 0,
			twoStage: true,
			firstResponse: 'Peg removed from MockReceiver Name.',
			response: 'Kidding!'
		},
		{
			case: 1,
			twoStage: false,
			response: 'It looks like MockReceiver Name has hidden their pegs too well for me to find them!'
		},
		{
			case: 2,
			twoStage: true,
			firstResponse: 'MockReceiver Name\'s peg has been removed...',
			response: 'But MockReceiver Name stole it back!'
		},
		{
			case: 3,
			twoStage: true,
			firstResponse: 'Peg given to MockReceiver Name',
			response: 'But MockReceiver Name didn\'t want it!'
		},
		{
			case: 4,
			twoStage: false,
			response: 'I\'m sorry MockSender Name, I\'m afraid I can\'t do that.'
		},
		{
			case: 5,
			twoStage: false,
			response:
`### HTTP Status Code 418: I'm a teapot.
Unable to brew coffee. Or pegs.`
		},
		{
			case: 6,
			twoStage: false,
			response:
`\`\`\`
Error: Access Denied user MockSender Name does not have the correct privileges
	at UnPeg (unpeg.js:126)
	at EveryoneButMockSenderName (unpeg.js:4253)
	at ExecuteBadCode (pockybot.js:1467)
	at DecrementPegs (pockybot.js:1535)
\`\`\``
		}
	]

	testCases.forEach((test : UnpegTestData) => {
		it(`should fake unpeg in case ${test.case}`, async (done : DoneFn) => {
			let database = createDatabase();
			let utilities = createUtilities(test.case);

			let unpeg = new Unpeg(spark, database, utilities);

			spyOn(spark.messages, 'create').and.callThrough();

			let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> unpeg <spark-mention data-object-type="person" data-object-id="MockReceiver">ShameBot</spark-mention> with a comment</p>');
			let roomId = 'abc';

			let result = await unpeg.createMessage(message, roomId);

			if (test.twoStage) {
				expect(spark.messages.create).toHaveBeenCalledWith({
					markdown: test.firstResponse,
					roomId: roomId
				});
			}

			expect(result).toEqual({
				markdown: test.response
			});

			done();
		})
	});
});
