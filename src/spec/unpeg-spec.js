var unpegService = require(__base + "src/lib/response-triggers/unpeg");
const constants = require(__base + `constants`);

function createMessage(htmlMessage, person) {
	return {
		html: htmlMessage,
		personId: person,
		mentionedPeople: [constants.botId, 'aoeuidhtns']
	};
}

function createSparkMock() {
	return {
		messages: {
			create: function () {
				return new Promise((resolve, reject) => {
					resolve();
				});
			}
		}
	}
}

function createConfigMock(permitted) {
	return {
		checkRole: function() {
			return permitted;
		}
	};
}

function createDatabase(givePegSuccess, givePegResponse, countSuccess, countResponse) {
	return {
		givePegWithComment: function () {
			return new Promise((resolve, reject) => {
				if (givePegSuccess) {
					resolve(givePegResponse);
				} else {
					reject();
				}
			});
		},

		countPegsGiven: function () {
			return new Promise((resolve, reject) => {
				if (countSuccess) {
					resolve(countResponse);
				} else {
					reject();
				}
			});
		},

		getUser: function() {
			return new Promise((resolve, reject) => {
				resolve({
					username: 'mock name',
					userid: 'mockID'
				});
			});
		}
	}
}

function createUtilities(numToReturn) {
	return {
		sleep: function() {
			return new Promise(resolve => setTimeout(resolve, 500));
		},

		getRandomInt: function() {
			return numToReturn;
		}
	}
}

function testRandomResponses(num, firstResponse, result, spark) {
	let database = createDatabase(true, 0, true, 1);
	let config = createConfigMock(true);
	let utilities = createUtilities(num);

	let unpeg = new unpegService(spark, database, config, utilities);

	spyOn(spark.messages, 'create');

	let room = "abc";

	let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> unpeg <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with a comment</p>',
		'mockID');
	unpeg.createMessage(sentMessage, room)
	.then((message) => {
		expect(spark.messages.create).toHaveBeenCalledWith({
			markdown: firstResponse,
			roomId: room
		});
		expect(message.markdown).toBe(result);
	}).catch((error) => {
		console.log(error);
		expect(false).toBe(true);
	})
}

describe("triggers", () => {
	it('should accept an unpeg command', () => {
		let database = createDatabase(true, 0, true, 1);
		let spark = createSparkMock();
		let config = createConfigMock(true);
		let utilities = createUtilities(1);

		let unpeg = new unpegService(spark, database, config, utilities);

		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> unpeg <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with a comment</p>',
			'mockID');

		try {
			let message = unpeg.isToTriggerOn(sentMessage);
			expect(message).toBe(true);
		} catch(e) {
			console.log(e);
			expect(false).toBe(true);
		}
	});

	it('should reject peg command', () => {
		let database = createDatabase(true, 0, true, 1);
		let spark = createSparkMock();
		let config = createConfigMock(true);
		let utilities = createUtilities(1);

		let unpeg = new unpegService(spark, database, config, utilities);

		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with a comment</p>',
			'mockID');

		try {
			let message = unpeg.isToTriggerOn(sentMessage);
			expect(message).toBe(false);
		} catch(e) {
			console.log(e);
			expect(false).toBe(true);
		}
	});
});

describe("creating Message", function() {
	it("should fake unpeg in case 0", async function(done) {
		let database = createDatabase(true, 0, true, 1);
		let config = createConfigMock(true);
		let spark = createSparkMock();
		let utilities = createUtilities(0);

		spyOn(spark.messages, 'create').andCallThrough();

		let unpeg = new unpegService(spark, database, config, utilities);


		let firstResponse = "Peg removed from mock name.";
		let result = "Kidding!";

		let room = "abc";

		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> unpeg <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with a comment</p>',
			'mockID');

		try {
			let message = await unpeg.createMessage(sentMessage, room);
			expect(spark.messages.create).toHaveBeenCalledWith({
				markdown: firstResponse,
				roomId: room
			});
			expect(message.markdown).toBe(result);
		} catch (error) {
			console.log(error);
			expect(false).toBe(true);
		}
		done();
	});

	it("should fake unpeg in case 1", function(done) {
		let database = createDatabase(true, 0, true, 1);
		let spark = createSparkMock();
		let config = createConfigMock(true);
		let utilities = createUtilities(1);

		let unpeg = new unpegService(spark, database, config, utilities);

		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> unpeg <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with a comment</p>',
			'mockID');
		unpeg.createMessage(sentMessage, "abc")
			.then((message) => {
				expect(message.markdown).toBe("It looks like mock name has hidden their pegs too well for me to find them!");
				done();
			});
	});

	it("should fake unpeg in case 2", function(done) {
		let database = createDatabase(true, 0, true, 1);
		let config = createConfigMock(true);
		let spark = createSparkMock();
		let utilities = createUtilities(2);

		spyOn(spark.messages, 'create').andCallThrough();

		let unpeg = new unpegService(spark, database, config, utilities);

		let firstResponse = "mock name's peg has been removed...";
		let result = "But mock name stole it back!";


		let room = "abc";

		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> unpeg <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with a comment</p>',
			'mockID');
		unpeg.createMessage(sentMessage, room)
			.then((message) => {
				expect(spark.messages.create).toHaveBeenCalledWith({
					markdown: firstResponse,
					roomId: room
				});
				expect(message.markdown).toBe(result);
			}).catch((error) => {
			console.log(error);
			expect(false).toBe(true);
		}).finally(() => {
			done();
		})
	});
});
