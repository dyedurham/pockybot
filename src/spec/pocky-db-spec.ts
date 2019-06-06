import PockyDB from '../lib/database/pocky-db';
import Config from '../lib/config';
import { QueryConfig, Client, QueryResult } from 'pg';
import { Role } from '../models/database';
import MockConfig from './mocks/mock-config';
import QueryHandler from '../lib/database/query-handler-interface';
import MockQueryHandler from './mocks/mock-query-handler';
import MockDbUsers from './mocks/mock-dbusers';

const config = new Config(null);

beforeAll(() => {
	spyOn(config, 'checkRole').and.callFake((userid : string, value : Role) => {
		if (userid === 'mockunmeteredID' && value === Role.Unmetered) {
			return true;
		} else {
			return false;
		}
	});

	spyOn(config, 'getConfig').and.callFake((config : string) => {
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

		throw new Error(`bad config: ${config}`);
	});

	spyOn(config, 'getStringConfig').and.callFake((string : string) => {
		if (string === 'penaltyKeyword') {
			return ['shame'];
		}
	});
});

function createQueryHandlerMock(result : any | QueryResult) : QueryHandler {
	let queryHandler = new MockQueryHandler(result);
	return queryHandler;
}

describe('return results', () => {
	it('should return the results from database as is', async (done : DoneFn) => {
		let queryHandler = createQueryHandlerMock('mock results');
		const database = new PockyDB(queryHandler, null);
		database.loadConfig(config);
		let results = await database.returnResults();
		console.log(results);
		expect(results as any).toBe('mock results');
		done();
	});
});

describe('return winners', () => {
	it('should return the results from database as is', async (done : DoneFn) => {
		let queryHandler = createQueryHandlerMock('mock results');
		const database = new PockyDB(queryHandler, null);
		database.loadConfig(config);
		let results = await database.returnWinners();
		expect(results as any).toBe('mock results');
		done();
	});
});

describe('reset', () => {
	it('should call query and return the raw output', async (done : DoneFn) => {
		let queryHandler = createQueryHandlerMock('mock result');
		const database = new PockyDB(queryHandler, null);
		database.loadConfig(config);
		let results = await database.reset();
		expect(results as any).toBe('mock result');
		done();
	});
});

describe('has spare pegs', () => {
	let queryHandler : QueryHandler;

	beforeEach(() => {
		queryHandler = createQueryHandlerMock([]);
	});

	it('should return true for default_user', async (done : DoneFn) => {
		const database = new PockyDB(queryHandler, null);
		database.loadConfig(config);
		let result = await database.hasSparePegs('default_user');
		expect(result).toBe(true);
		done();
	});

	it('should return true for mockunmeteredID', async (done : DoneFn) => {
		const database = new PockyDB(queryHandler, null);
		database.loadConfig(config);
		let result = await database.hasSparePegs('mockunmeteredID');
		expect(result).toBe(true);
		done();
	});

	it('should return false for other users', async (done : DoneFn) => {
		let queryHandler = createQueryHandlerMock(createGoodPegs(10));
		const database = new PockyDB(queryHandler, null);
		database.loadConfig(config);
		let result = await database.hasSparePegs('some_sender');
		expect(result).toBe(false);
		done();
	});

	it('should return true for no pegs spent', async (done : DoneFn) => {
		let config = new MockConfig(10, 5, 3, 1, 0, 1, ['one', 'two', 'three'], ['shame'], false);

		const database = new PockyDB(queryHandler, null);
		database.loadConfig(config);
		let result = await database.hasSparePegs('some_sender');
		expect(result).toBe(true);
		done();
	});
});

describe('count pegs', () => {
	it('should return count of all good pegs', async (done : DoneFn) => {
		let queryHandler = createQueryHandlerMock(createGoodPegs(125689));
		const database = new PockyDB(queryHandler, null);
		database.loadConfig(config);
		let result = await database.countPegsGiven('some_sender');
		expect(result).toBe(125689);
		done();
	});

	it('should return count of good pegs when there are good and bad pegs', async (done : DoneFn) => {
		let queryHandler = createQueryHandlerMock(createGoodAndBadPegs(40, 12));
		const database = new PockyDB(queryHandler, null);
		database.loadConfig(config);
		let result = await database.countPegsGiven('some_sender');
		expect(result).toBe(40);
		done();
	})
});

describe('give peg with comment', () => {
	it('should return 0', async (done : DoneFn) => {
		let queryHandler = createQueryHandlerMock([]);
		let dbUsers = new MockDbUsers();
		const database = new PockyDB(queryHandler, dbUsers);
		database.loadConfig(config);
		let result = await database.givePegWithComment('one comment here', 'some_receiver', 'some_sender');
		expect(result).toBe(0);
		done();
	});
});

function createGoodPegs(count : number) {
	let pegs = [];
	for (let i = 0; i < count; ++i) {
		pegs.push({'comment': 'this is an awesome peg!'});
	}

	return pegs;
}

function createGoodAndBadPegs(goodPegs : number, badPegs : number) {
	let pegs = createGoodPegs(goodPegs);
	for (let i = 0; i < badPegs; ++i) {
		pegs.push({'comment': 'this is a shameful peg'});
	}

	return pegs;
}
