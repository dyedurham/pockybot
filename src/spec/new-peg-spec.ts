import { MessageObject } from 'ciscospark/env';

import constants from '../constants';
import Config from '../lib/config';
import Peg from '../lib/response-triggers/peg';

import MockCiscoSpark from './mocks/mock-spark';
import MockPockyDb from './mocks/mock-pockydb';
import MockDbUsers from './mocks/mock-dbusers';

const spark = new MockCiscoSpark();

function createMessage(htmlMessage : string, person : string,
	mentionedFirst = constants.botId, mentionedSecond = 'aoeuidhtns') : MessageObject {
	return {
		html: htmlMessage,
		personId: person,
		mentionedPeople: [mentionedFirst, mentionedSecond]
	};
}

describe('creating Message', () => {
	it('should create a proper message - 1 peg', (done : DoneFn) => {
		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with an awesome comment</p>',
			'mockfromID');
		let expected = 'Peg given to mock name. You have given 1 peg this fortnight.';
		let pockyDb = new MockPockyDb(true, 1, false, 0);
		let dbUsers = new MockDbUsers();

		let peg = new Peg(spark, pockyDb, dbUsers, config);

		let output = peg.createMessage(sentMessage);
		expect(output).toBe(expected);
	});

	it('should create a proper message - 2 pegs', (done : DoneFn) => {
		expect(false).toBe(true);
	});

	it('should fail to give peg - out of pegs', (done : DoneFn) => {
		expect(false).toBe(true);
	});

	it('should fail to give peg - exception', (done : DoneFn) => {
		expect(false).toBe(true);
	});

	it('should fail to peg with no comment', (done : DoneFn) => {
		expect(false).toBe(true);
	});

	it('should give peg with "to" keyword', (done : DoneFn) => {
		expect(false).toBe(true);
	});

	it('should give peg with multiple keywords', (done : DoneFn) => {
		expect(false).toBe(true);
	});

	it ('should work with mixed case keyword', (done : DoneFn) => {
		expect(false).toBe(true);
	});

	it('should fail with no keyword', (done : DoneFn) => {
		expect(false).toBe(true);
	});

	it('should fail with embedded keyword', (done : DoneFn) => {
		expect(false).toBe(true);
	});

	it('should work with two spaces', (done : DoneFn) => {
		expect(false).toBe(true);
	});

	it('should work with three spaces', (done : DoneFn) => {
		expect(false).toBe(true);
	});

	it('should work with iPhone format', (done : DoneFn) => {
		expect(false).toBe(true);
	});

	it('should work with ampersand', (done : DoneFn) => {
		expect(false).toBe(true);
	});
})
