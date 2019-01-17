// describe('create user', () => {
// 	let sparkMock : CiscoSpark;

// 	beforeEach(() => {
// 		sparkMock = createSparkMock();
// 	});

// 	it('should call query and return the raw output', async (done : DoneFn) => {
// 		const database = new DbUsers(sparkMock, null);
// 		let results = await database.createUser('some_sender');
// 		expect(results as any).toBe('create return');
// 		done();
// 	});
// });

// describe('exists', () => {
// 	it('should make return true if the user already exists', async (done : DoneFn) => {
// 		let pgClientMock = createPgClient(true, null);

// 		const database = new DbUsers(null, null);
// 		let result = await database.existsOrCanBeCreated('some_sender');
// 		expect(result).toBe(true);
// 		done();
// 	});

// 	 it('should make create a user and return true', async (done : DoneFn) => {
// 		let pgClientMock = createPgClient(true, null);

// 		const database = new DbUsers(null, null);
// 		let result = await database.existsOrCanBeCreated('some_sender');
// 		expect(result).toBe(true);
// 		done();
// 	});
// });
