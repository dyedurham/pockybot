import PockyDB from '../lib/PockyDB';
import Config from '../lib/config';
import { QueryConfig, Client } from 'pg';

const config = new Config(null);
beforeAll(() => {
	spyOn(config, 'checkRole').and.callFake((userid : string, value : string) => {
		if (userid == 'mockunmeteredID' && value.toUpperCase() == 'UNMETEREDUSERS') {
			return true;
		}
		else {
			return false;
		}
	});

	spyOn(config, 'getConfig').and.callFake((config : string) => {
		if (config == 'limit') {
			return 10;
		} else if (config == 'minimum') {
			return 5;
		} else if (config == 'winners') {
			return 3;
		} else if (config == 'commentsRequired') {
			return 1;
		} else if (config == 'pegWithoutKeyword') {
			return 0;
		}

		throw new Error("bad config");
	});
});

function createPgClient(connectSuccess : boolean, pegCount : number) : Client {
	let client = new Client();

	if (connectSuccess) {
		spyOn(client, 'connect').and.returnValue(new Promise((resolve, reject) => resolve()));
	} else {
		spyOn(client, 'connect').and.returnValue(new Promise((resolve, reject) => reject()));
	}

	spyOn(client, 'query').and.callFake((statement : QueryConfig) => {
		switch(statement.name) {
			case "returnResultsQuery":
				return new Promise((resolve, reject) => {
					resolve({rows: "mock name"});
				});
			case "returnWinnersQuery":
				expect(statement.values[0]).toBe(5);
				expect(statement.values[1]).toBe(3);
				return new Promise((resolve, reject) => {
					resolve({rows: "mock name"});
				});
			case "resetQuery":
				return new Promise((resolve, reject) => {
					resolve("reset return");
				});
			case "createUserQuery":
				expect(statement.values[0]).toBe("some_sender");
				return new Promise((resolve, reject) => {
					resolve("create return");
				});
			case "givePegWithCommentQuery":
				expect(statement.values[0]).toBe("some_sender");
				expect(statement.values[1]).toBe("some_receiver");
				expect(statement.values[2]).toBe("some comment here");
				return new Promise((resolve, reject) => {
					resolve();
				});
			case "existsQuery":
				expect(statement.values[0] == "some_sender" || statement.values[0] == "some_receiver").toBe(true);
				return new Promise((resolve, reject) => {
					resolve({
						rows: [{exists:true}]
					});
				});
			case "pegsGiven":
				expect(statement.values[0]).toBe("some_sender");
				return new Promise((resolve, reject) => {
					resolve({
						rows: [{count:pegCount}]
					});
				});
		}
	});

	return client;
}

function createSparkMock() {
	return {
		people: {
			get: function(userid : string) {
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
	var pgClientMock : Client;

	beforeEach(() => {
		pgClientMock = createPgClient(true, null);
	})

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
	var pgClientMock : Client;

	beforeEach(() => {
		pgClientMock = createPgClient(true, null);
	})

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
	var pgClientMock : Client;

	beforeEach(() => {
		pgClientMock = createPgClient(true, null);
	})

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
	var pgClientMock : Client;
	var sparkMock : any;

	beforeEach(() => {
		pgClientMock = createPgClient(true, null);
		sparkMock = createSparkMock();
	})

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
	var pgClientMock : Client;

	beforeEach(() => {
		pgClientMock = createPgClient(true, 99);
	})

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
		spyOn(pgClientMock, 'query').and.returnValue(new Promise((resolve, reject) =>
			resolve({
				rows: [{count:100}]
			}
		)));

		const database = new PockyDB(pgClientMock, null);
		database.loadConfig(config);
		database.hasSparePegs("some_sender")
		.then((result) => {
			expect(result).toBe(false);
			done();
		});
	});

	it("should return true for no pegs spent", function (done) {
		spyOn(pgClientMock, 'query').and.returnValue(new Promise((resolve, reject) => {
			resolve({
				rows: [{count:0}]
			})
		}));

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
	var pgClientMock : Client;

	beforeEach(() => {
		pgClientMock = createPgClient(true, 125689);
	});

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
		var pgClientMock = createPgClient(true, null);

		const database = new PockyDB(pgClientMock, null);
		database.loadConfig(config);
		database.existsOrCanBeCreated("some_sender")
		.then((result) => {
			expect(result).toBe(true);
			done();
		});
	});

	 it("should make create a user and return true", function (done) {
		var pgClientMock = createPgClient(true, null);

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
	var pgClientMock = createPgClient(true, null);

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
