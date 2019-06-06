import { MessageObject } from 'ciscospark/env';

import constants from '../constants';
import Peg from '../lib/response-triggers/peg';

import MockCiscoSpark from './mocks/mock-spark';
import MockPockyDb from './mocks/mock-pockydb';
import MockDbUsers from './mocks/mock-dbusers';
import MockConfig from './mocks/mock-config';

const spark = new MockCiscoSpark();
const dbUsers = new MockDbUsers();
const config = new MockConfig(10, 5, 3, 1, 0, 1, ['awesome', 'brave', 'collaborative'], ['shame']);

function createMessage(htmlMessage : string, person : string,
	mentionedFirst = constants.botId, mentionedSecond = 'aoeuidhtns') : MessageObject {
	return {
		html: htmlMessage,
		personId: person,
		mentionedPeople: [mentionedFirst, mentionedSecond]
	};
}

describe('creating Message', () => {
	it('should create a proper message - 1 peg', async (done : DoneFn) => {
		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with an awesome comment</p>',
			'mockfromID');
		let expected = 'Peg given to mock name. You have given 1 peg this fortnight.';

		let pockyDb = new MockPockyDb(true, 0, true, 1);
		let peg = new Peg(spark, pockyDb, dbUsers, config);

		let output = await peg.createMessage(sentMessage);
		expect(output.markdown).toBe(expected);
		done();
	});

	it('should create a proper message - 2 pegs', async (done : DoneFn) => {
		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with an awesome comment</p>',
			'mockfromID');
		let expected = 'Peg given to mock name. You have given 2 pegs this fortnight.';

		let pockyDb = new MockPockyDb(true, 0, true, 2);
		let peg = new Peg(spark, pockyDb, dbUsers, config);

		let output = await peg.createMessage(sentMessage);
		expect(output.markdown).toBe(expected);
		done();
	});

	it('should fail to give peg - out of pegs', async (done : DoneFn) => {
		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with an awesome comment</p>',
			'mockfromID');
		let expected = 'Sorry, but you have already spent all of your pegs for this fortnight.';

		let pockyDb = new MockPockyDb(true, 1, true, 2);
		let peg = new Peg(spark, pockyDb, dbUsers, config);

		let output = await peg.createMessage(sentMessage);
		expect(output.markdown).toBe(expected);
		done();
	});

	it('should fail to give peg - exception', async (done : DoneFn) => {
		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with an awesome comment</p>',
			'mockfromID');
		let expected = 'Error encountered, peg not given';

		let pockyDb = new MockPockyDb(true, 2, true, 2);
		let peg = new Peg(spark, pockyDb, dbUsers, config);

		let output = await peg.createMessage(sentMessage);
		expect(output.markdown).toBe(expected);
		done();
	});

	it('should fail to peg with no comment', async (done : DoneFn) => {
		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention></p>',
			'mockfromID');
		let expected =
`I'm sorry, I couldn't understand your peg request. Please use the following format:
@` + constants.botName + ` peg @Person this is the reason for giving you a peg`;

		let pockyDb = new MockPockyDb(true, 0, true, 2);
		let peg = new Peg(spark, pockyDb, dbUsers, config);

		let output = await peg.createMessage(sentMessage);
		expect(output.markdown).toBe(expected);
		done();
	});

	it('should fail to peg with no comment with space', async (done : DoneFn) => {
		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> </p>',
			'mockfromID');
		let expected =
`I'm sorry, I couldn't understand your peg request. Please use the following format:
@` + constants.botName + ` peg @Person this is the reason for giving you a peg`;

		let pockyDb = new MockPockyDb(true, 0, true, 2);
		let peg = new Peg(spark, pockyDb, dbUsers, config);

		let output = await peg.createMessage(sentMessage);
		expect(output.markdown).toBe(expected);
		done();
	});

	it('should give peg with "to" keyword', async (done : DoneFn) => {
		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> to <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with an awesome comment</p>',
			'mockfromID');
		let expected = 'Peg given to mock name. You have given 1 peg this fortnight.';

		let pockyDb = new MockPockyDb(true, 0, true, 1);
		let peg = new Peg(spark, pockyDb, dbUsers, config);

		let output = await peg.createMessage(sentMessage);
		expect(output.markdown).toBe(expected);
		done();
	});

	it('should give peg with multiple keywords', async (done : DoneFn) => {
		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg to <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with an awesome comment</p>',
			'mockfromID');
		let expected = 'Peg given to mock name. You have given 1 peg this fortnight.';

		let pockyDb = new MockPockyDb(true, 0, true, 1);
		let peg = new Peg(spark, pockyDb, dbUsers, config);

		let output = await peg.createMessage(sentMessage);
		expect(output.markdown).toBe(expected);
		done();
	});

	it ('should work with mixed case keyword', async (done : DoneFn) => {
		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg to <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with an AwEsoME comment</p>',
		'mockfromID');
		let expected = 'Peg given to mock name. You have given 1 peg this fortnight.';

		let pockyDb = new MockPockyDb(true, 0, true, 1);
		let peg = new Peg(spark, pockyDb, dbUsers, config);

		let output = await peg.createMessage(sentMessage);
		expect(output.markdown).toBe(expected);
		done();
	});

	it('should fail with no keyword', async (done : DoneFn) => {
		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with an awesome comment</p>',
			'mockfromID');
		let expected =
`I'm sorry, I couldn't understand your peg request. Please use the following format:
@` + constants.botName + ` peg @Person this is the reason for giving you a peg`;

		let pockyDb = new MockPockyDb(true, 0, true, 1);
		let peg = new Peg(spark, pockyDb, dbUsers, config);

		let output = await peg.createMessage(sentMessage);
		expect(output.markdown).toBe(expected);
		done();
	});

	it('should fail with embedded keyword', async (done : DoneFn) => {
		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> unpeg <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with an awesome comment</p>',
			'mockfromID');
		let expected =
`I'm sorry, I couldn't understand your peg request. Please use the following format:
@${constants.botName} peg @Person this is the reason for giving you a peg`;

		let pockyDb = new MockPockyDb(true, 0, true, 1);
		let peg = new Peg(spark, pockyDb, dbUsers, config);

		let output = await peg.createMessage(sentMessage);
		expect(output.markdown).toBe(expected);
		done();
	});

	it('should work with two spaces', async (done : DoneFn) => {
		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention>  peg  <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with an awesome comment</p>',
		'mockfromID');
		let expected = 'Peg given to mock name. You have given 1 peg this fortnight.';

		let pockyDb = new MockPockyDb(true, 0, true, 1);
		let peg = new Peg(spark, pockyDb, dbUsers, config);

		let output = await peg.createMessage(sentMessage);
		expect(output.markdown).toBe(expected);
		done();
	});

	it('should work with three spaces', async (done : DoneFn) => {
		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention>   peg <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with an awesome comment</p>',
		'mockfromID');
		let expected = 'Peg given to mock name. You have given 1 peg this fortnight.';

		let pockyDb = new MockPockyDb(true, 0, true, 1);
		let peg = new Peg(spark, pockyDb, dbUsers, config);

		let output = await peg.createMessage(sentMessage);
		expect(output.markdown).toBe(expected);
		done();
	});

	it('should work with iPhone format', async (done : DoneFn) => {
		let sentMessage = createMessage('<spark-mention data-object-id="mockappleID" data-object-type="person">' + constants.botName + '</spark-mention> peg <spark-mention data-object-id="aoeuidhtns" data-object-type="person">Bob</spark-mention> for awesome reasons',
			'mockfromID');
		let expected = 'Peg given to mock name. You have given 1 peg this fortnight.';

		let pockyDb = new MockPockyDb(true, 0, true, 1);
		let peg = new Peg(spark, pockyDb, dbUsers, config);

		let output = await peg.createMessage(sentMessage);
		expect(output.markdown).toBe(expected);
		done();
	});

	it('should work with ampersand', async (done : DoneFn) => {
		let sentMessage = createMessage('<spark-mention data-object-id="mockappleID" data-object-type="person">' + constants.botName + '</spark-mention> peg <spark-mention data-object-id="aoeuidhtns" data-object-type="person">Bob</spark-mention> for awesome reasons &amp; stuff',
		'mockfromID');
		let expected = 'Peg given to mock name. You have given 1 peg this fortnight.';

		let pockyDb = new MockPockyDb(true, 0, true, 1);
		let peg = new Peg(spark, pockyDb, dbUsers, config);

		let output = await peg.createMessage(sentMessage);
		expect(output.markdown).toBe(expected);
		done();
	});
});

describe('testing peg triggers', () => {
	let pockyDb = new MockPockyDb(true, 0, true, 1);
	let peg = new Peg(spark, pockyDb, dbUsers, config);

	it('should accept trigger', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg <spark-mention data-object-type="person" data-object-id="aoeuidhtns">John</spark-mention> for reasons</p>', 'personId');
		let results = peg.isToTriggerOn(message);
		expect(results).toBe(true);
	});

	it('should reject wrong command', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> yipeg</p>', 'personId');
		let results = peg.isToTriggerOn(message);
		expect(results).toBe(false);
	});

	it('should reject wrong id', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="notabotID">' + constants.botName + '</spark-mention> peg</p>', null, 'mockID');
		let results = peg.isToTriggerOn(message);
		expect(results).toBe(false);
	});

	it('should accept no space', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention>peg<spark-mention data-object-type="person" data-object-id="aoeuidhtns">John</spark-mention> for reasons</p>', 'personId');
		let results = peg.isToTriggerOn(message);
		expect(results).toBe(true);
	});

	it('should accept trailing space', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg <spark-mention data-object-type="person" data-object-id="aoeuidhtns">John</spark-mention> for reasons  </p>', 'personId');
		let results = peg.isToTriggerOn(message);
		expect(results).toBe(true);
	});

	it('should accept iPhone format', () => {
		let message = createMessage('<spark-mention data-object-id="mockappleID" data-object-type="person">' + constants.botName + '</spark-mention> peg <spark-mention data-object-id="aoeuidhtns" data-object-type="person">Bob</spark-mention> for reasons', 'personId');
		let results = peg.isToTriggerOn(message);
		expect(results).toBe(true);
	});

	it('should reject unpeg trigger', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> unpeg <spark-mention data-object-type="person" data-object-id="aoeuidhtns">John</spark-mention> for reasons</p>', 'personId');
		let results = peg.isToTriggerOn(message);
		expect(results).toBe(false);
	});

	it('should reject another unpeg trigger', () => {
		let message = createMessage('<spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> unpeg <spark-mention data-object-type="person" data-object-id="mockID">Jim</spark-mention> for how many times he has broken pockey bot', 'personId');
		let results = peg.isToTriggerOn(message);
		expect(results).toBe(false);
	});
});

describe('testing keywords in peg messages', () => {
	let pockyDb = new MockPockyDb(true, 0, true, 1);
	let peg = new Peg(spark, pockyDb, dbUsers, config);

	it('should reject with no keyword', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg <spark-mention data-object-type="person" data-object-id="aoeuidhtns">John</spark-mention> for reasons</p>', 'personId');
		let results = peg.isToTriggerOn(message);
		expect(results).toBe(true);
	});

	it('should accept with multiple keywords', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg <spark-mention data-object-type="person" data-object-id="aoeuidhtns">John</spark-mention> for customer, brave, awesome, collaborative, real reasons</p>', 'personId');
		let results = peg.isToTriggerOn(message);
		expect(results).toBe(true);
	});
});
