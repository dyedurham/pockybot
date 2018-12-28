import PockyDB from '../lib/PockyDB';

const config = {
	checkRole(userid, value) {
		if (userid == 'mockunmeteredID' && value.toUpperCase() == 'UNMETEREDUSERS') {
			return true;
		}
		else {
			return false;
		}
	},

	getConfig(config) {
		if (config == 'limit') {
			return 10;
		}
		else if (config == 'minimum') {
			return 5;
		}
		else if (config == 'winners') {
			return 3;
		}
		else if (config == 'commentsRequired') {
			return 1;
		}
		else if (config == 'pegWithoutKeyword') {
			return 0;
		}
		throw new Error("bad config");
	}
}

function createPgClient(connectSuccess, connectResponse, pegCount) {
	return {
		connect: function() {
			return new Promise((resolve, reject) => {
				if (connectSuccess) {
					resolve(connectResponse);
				} else {
					reject();
				}
			})
		},

		query: function(statment) {
			switch(statment.name) {
				case "returnResultsQuery":
					return new Promise((resolve, reject) => {
						resolve({rows: "mock name"});
					});
				case "returnWinnersQuery":
					expect(statment.values[0]).toBe(5);
					expect(statment.values[1]).toBe(3);
					return new Promise((resolve, reject) => {
						resolve({rows: "mock name"});
					});
				case "resetQuery":
					return new Promise((resolve, reject) => {
						resolve("reset return");
					});
				case "createUserQuery":
					expect(statment.values[0]).toBe("some_sender");
					return new Promise((resolve, reject) => {
						resolve("create return");
					});
				case "givePegWithCommentQuery":
					expect(statment.values[0]).toBe("some_sender");
					expect(statment.values[1]).toBe("some_receiver");
					expect(statment.values[2]).toBe("some comment here");
					return new Promise((resolve, reject) => {
						resolve();
					});
				case "existsQuery":
					expect(statment.values[0] == "some_sender" || statment.values[0] == "some_receiver").toBe(true);
					return new Promise((resolve, reject) => {
						resolve({
							rows: [{exists:true}]
						});
					});
				case "pegsGiven":
					expect(statment.values[0]).toBe("some_sender");
					return new Promise((resolve, reject) => {
						resolve({
							rows: [{count:pegCount}]
						});
					});
			}
		}
	}
}

function createSparkMock() {
	return {
		people: {
			get: function(userid) {
				return new Promise((resolve, reject) => {
					resolve({
						displayName: userid + 'display'
					});
				});
			}
		}
	};
}

describe("return results", function() {
	var pgClientMock = createPgClient(true, null, null);

	it("should return the results from database as is", function (done) {
		const database = new PockyDB(pgClientMock, null);
		database.loadConfig(config);
		database.returnResults()
		.then((results) => {
			expect(results).toBe("mock name");
			done();
		});
	});
});

describe("return winners", function() {
	var pgClientMock = createPgClient(true, null, null);

	it("should return the results from database as is", function (done) {
		const database = new PockyDB(pgClientMock, null);
		database.loadConfig(config);
		database.returnWinners()
		.then((results) => {
			expect(results).toBe("mock name");
			done();
		});
	});
});

describe("reset", function() {
	var pgClientMock = createPgClient(true, null, null);

	it("should call query and return the raw output", function (done) {
		const database = new PockyDB(pgClientMock, null);
		database.loadConfig(config);
		database.reset()
		.then((results) => {
			expect(results as any).toBe("reset return");
			done();
		});
	});
});

describe("create user", function() {
	var pgClientMock = createPgClient(true, null, null);
	var sparkMock = createSparkMock();

	it("should call query and return the raw output", function (done) {
		const database = new PockyDB(pgClientMock, sparkMock);
		database.loadConfig(config);
		database.createUser("some_sender")
		.then((results) => {
			expect(results as any).toBe("create return");
			done();
		});
	});
});

describe("has spare pegs", function() {
	var pgClientMock = createPgClient(true, null, 99);

	it("should return true for default_user", function (done) {
		const database = new PockyDB(pgClientMock, null);
		database.loadConfig(config);
		database.hasSparePegs("default_user")
		.then((result) => {
			expect(result).toBe(true);
			done();
		});
	});

	it("should return true for mockunmeteredID", function (done) {
		const database = new PockyDB(pgClientMock, null);
		database.loadConfig(config);
		database.hasSparePegs("mockunmeteredID")
		.then((result) => {
			expect(result).toBe(true);
			done();
		});
	});

	it("should return false for other users", function (done) {
		pgClientMock.query = function() {
			return new Promise((resolve, reject) => {
				resolve({
					rows: [{count:100}]
				})
			})
		}

		const database = new PockyDB(pgClientMock, null);
		database.loadConfig(config);
		database.hasSparePegs("some_sender")
		.then((result) => {
			expect(result).toBe(false);
			done();
		});
	});

	it("should return true for no pegs spent", function (done) {
		pgClientMock.query = function() {
			return new Promise((resolve, reject) => {
				resolve({
					rows: [{count:0}]
				})
			})
		}

		const database = new PockyDB(pgClientMock, null);
		database.loadConfig(config);
		database.hasSparePegs("some_sender")
		.then((result) => {
			expect(result).toBe(true);
			done();
		});
	});
});

describe("count pegs", function() {
	var pgClientMock = createPgClient(true, null, 125689);

	it("should return count of pegs", function (done) {
		const database = new PockyDB(pgClientMock, null);
		database.loadConfig(config);
		database.countPegsGiven("some_sender")
		.then((result) => {
			expect(result).toBe(125689);
			done();
		});
	});
});

describe("exists", function() {
	it("should make return true if the user already exists", function (done) {
		var pgClientMock = createPgClient(true, null, null);

		const database = new PockyDB(pgClientMock, null);
		database.loadConfig(config);
		database.existsOrCanBeCreated("some_sender")
		.then((result) => {
			expect(result).toBe(true);
			done();
		});
	});

	 it("should make create a user and return true", function (done) {
		var pgClientMock = createPgClient(true, null, null);

		const database = new PockyDB(pgClientMock, null);
		database.loadConfig(config);
		database.existsOrCanBeCreated("some_sender")
		.then((result) => {
			expect(result).toBe(true);
			done();
		});
	});
});

describe("give peg with comment", function() {
	var pgClientMock = createPgClient(true, null, null);

	it("should return 0", function (done) {
		const database = new PockyDB(pgClientMock, null);
		database.loadConfig(config);
		database.givePegWithComment("some comment here", "some_receiver", "some_sender")
		.then((result) => {
			expect(result).toBe(0);
			done();
		});
	});
});
