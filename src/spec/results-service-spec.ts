import * as fs from 'fs';
const storage = require('@google-cloud/storage');

import sinon = require('sinon');
import { DefaultResultsService, ResultsService } from '../lib/services/results-service';
import { FormatResultsService } from '../lib/services/format-results-service';
import MockFormatResultsService from './mocks/mock-format-results-service';

describe('results service', () => {
	let clock : sinon.SinonFakeTimers;
	let now = new Date();
	let todayString = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate()
	+ '-' + now.getHours() + '-' + now.getMinutes() + '-' + now.getSeconds();
	let formatResultsService: FormatResultsService;
	let resultsService: ResultsService;

	beforeEach(() => {
		clock = sinon.useFakeTimers({
			now: now,
			shouldAdvanceTime: true
		});

		formatResultsService = new MockFormatResultsService(true, 'test');
		resultsService = new DefaultResultsService(formatResultsService);

		var fakeExistsSync = sinon.fake.returns(false);
		var fakeWriteFileSync = sinon.fake();

		sinon.replace(fs, 'existsSync', fakeExistsSync);
		sinon.replace(fs, 'writeFileSync', fakeWriteFileSync);

		var fakeStorage = sinon.fake.returns({
			bucket: (name: string) => {
				return {
					upload: (name: string) => {
						return new Promise((resolve, reject) => {
							resolve([{
								makePublic: () => {
									return new Promise((resolve, reject) => { resolve(); })
								}
							}]);
						});
					}
				}
			}
		});

		sinon.stub(storage, 'Storage').callsFake(fakeStorage);

		process.env.GCLOUD_BUCKET_NAME = 'pocky-bot';
	});

	afterEach(() => {
		sinon.restore();
		clock.restore();
	});

	it('should parse a proper message', async (done: DoneFn) => {
		let message = await resultsService.returnResultsMarkdown();
		expect(message).toBe(`[Here are all pegs given this cycle](https://storage.googleapis.com/pocky-bot/pegs-${todayString}.html)`);
		done();
	});
});
