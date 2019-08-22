import LocationWeight from '../lib/response-triggers/locationweight';
import constants from '../constants';
import Config from '../lib/config';
import { MessageObject } from 'webex/env';
import { Role, ConfigRow } from '../models/database';
import { Command } from '../models/command';
import { LocationAction } from '../models/location-action';
import DbLocation from '../lib/database/db-location';
import MockQueryHandler from './mocks/mock-query-handler';

function createMessage(htmlMessage : string, person : string) : MessageObject {
	return {
		html: htmlMessage,
		personId: person
	}
}

describe('locationweight trigger', () => {
	let config : Config;
	let dbLocation : DbLocation;
	let locationWeight : LocationWeight;

	beforeEach(() => {
		dbLocation = new DbLocation(new MockQueryHandler(null));
		config = new Config(null);
		spyOn(config, 'checkRole').and.callFake((userid : string, value : Role) => {
			return userid === 'mockAdminID' && value === Role.Admin;
		});
		locationWeight = new LocationWeight(dbLocation, config);
	});

	describe('message parsing', () => {
		it('should create the message with no command', async (done : DoneFn) => {
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationWeight} `,
				'mockID');

			let response = await locationWeight.createMessage(message);
			expect(response.markdown).toBe('Please specify a command. Possible values are get, set, delete');
			done();
		});

		it('should create the message with unknown command', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationWeight} blah`,
				'mockID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));

			let response = await locationWeight.createMessage(message);
			expect(response.markdown).toBe('Unknown command. Possible values are get, set, delete');
			done();
		});

		it('should create the get message with location weights set', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const numberConfig : ConfigRow[] = [
				{
					name: 'locationWeightTestLocationtoTestLocation2',
					value: 2
				},
				{
					name: 'max',
					value: 1
				}
			];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationWeight} ${LocationAction.Get}`,
				'mockID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));
			spyOn(config, 'getAllConfig').and.returnValue(numberConfig);

			let response = await locationWeight.createMessage(message);
			expect(response.markdown).toBe(
`Here are the current location weights:
\`\`\`
 Location 1  |  Location 2   | Weight
-------------+---------------+-------
TestLocation | TestLocation2 | 2
\`\`\``
			);
			done();
		});

		it('should create the get message with no location weights set', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const numberConfig : ConfigRow[] = [
				{
					name: 'max',
					value: 1
				}
			];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationWeight} ${LocationAction.Get}`,
				'mockID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));
			spyOn(config, 'getAllConfig').and.returnValue(numberConfig);

			let response = await locationWeight.createMessage(message);
			expect(response.markdown).toBe('No location weights set');
			done();
		});

		it('should create the set message with not enough arguments', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationWeight} ${LocationAction.Set}`,
				'mockAdminID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));

			let response = await locationWeight.createMessage(message);
			expect(response.markdown).toBe('Please specify two locations and a weight');
			done();
		});

		it('should create the set message with invalid first location', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationWeight} ${LocationAction.Set} InvalidLocation TestLocation 1`,
				'mockAdminID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));

			let response = await locationWeight.createMessage(message);
			expect(response.markdown).toBe('Location value "InvalidLocation" is invalid');
			done();
		});

		it('should create the set message with invalid second location', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationWeight} ${LocationAction.Set} TestLocation InvalidLocation2 1`,
				'mockAdminID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));

			let response = await locationWeight.createMessage(message);
			expect(response.markdown).toBe('Location value "InvalidLocation2" is invalid');
			done();
		});

		it('should create the set message with weight not a number', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationWeight} ${LocationAction.Set} TestLocation TestLocation2 NaN`,
				'mockAdminID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));

			let response = await locationWeight.createMessage(message);
			expect(response.markdown).toBe('Weight must be set to a number');
			done();
		});

		it('should create the set message with weight less than zero', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationWeight} ${LocationAction.Set} TestLocation TestLocation2 -2`,
				'mockAdminID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));

			let response = await locationWeight.createMessage(message);
			expect(response.markdown).toBe('Weight should be greater than or equal to 0.');
			done();
		});

		it('should create the set message with config already existing', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const numberConfig : ConfigRow[] = [
				{
					name: 'locationWeightTestLocationtoTestLocation2',
					value: 3
				},
				{
					name: 'max',
					value: 1
				}
			];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationWeight} ${LocationAction.Set} TestLocation TestLocation2 2`,
				'mockAdminID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));
			spyOn(config, 'getAllConfig').and.returnValue(numberConfig);
			const configSpy = spyOn(config, 'setConfig').and.stub();

			let response = await locationWeight.createMessage(message);
			expect(response.markdown).toBe('Location weight has been set');
			expect(configSpy).toHaveBeenCalledWith('locationWeightTestLocationtoTestLocation2', 2);
			done();
		});

		it('should create the set message with config not existing', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const numberConfig : ConfigRow[] = [
				{
					name: 'max',
					value: 1
				}
			];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationWeight} ${LocationAction.Set} TestLocation TestLocation2 2`,
				'mockAdminID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));
			spyOn(config, 'getAllConfig').and.returnValue(numberConfig);
			const configSpy = spyOn(config, 'setConfig').and.stub();

			let response = await locationWeight.createMessage(message);
			expect(response.markdown).toBe('Location weight has been set');
			expect(configSpy).toHaveBeenCalledWith('locationWeightTestLocationtoTestLocation2', 2);
			done();
		});

		it('should create the delete message with not enough arguments', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationWeight} ${LocationAction.Delete}`,
				'mockAdminID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));

			let response = await locationWeight.createMessage(message);
			expect(response.markdown).toBe('You must specify a two location names to delete the weighting for');
			done();
		});

		it('should create the delete message with invalid first location', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationWeight} ${LocationAction.Delete} InvalidLocation TestLocation`,
				'mockAdminID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));

			let response = await locationWeight.createMessage(message);
			expect(response.markdown).toBe('Location value "InvalidLocation" is invalid');
			done();
		});

		it('should create the delete message with invalid second location', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationWeight} ${LocationAction.Delete} TestLocation InvalidLocation2`,
				'mockAdminID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));

			let response = await locationWeight.createMessage(message);
			expect(response.markdown).toBe('Location value "InvalidLocation2" is invalid');
			done();
		});

		it('should create the delete message with config not existing', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const numberConfig : ConfigRow[] = [
				{
					name: 'max',
					value: 1
				}
			];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationWeight} ${LocationAction.Delete} TestLocation TestLocation2`,
				'mockAdminID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));
			spyOn(config, 'getAllConfig').and.returnValue(numberConfig);
			const configSpy = spyOn(config, 'deleteConfig').and.stub();

			let response = await locationWeight.createMessage(message);
			expect(response.markdown).toBe('No weighting found for locations TestLocation and TestLocation2');
			expect(configSpy).not.toHaveBeenCalled();
			done();
		});

		it('should create the delete message when config exists', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const numberConfig : ConfigRow[] = [
				{
					name: 'locationWeightTestLocationtoTestLocation2',
					value: 3
				},
				{
					name: 'max',
					value: 1
				}
			];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationWeight} ${LocationAction.Delete} TestLocation TestLocation2`,
				'mockAdminID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));
			spyOn(config, 'getAllConfig').and.returnValue(numberConfig);
			const configSpy = spyOn(config, 'deleteConfig').and.stub();

			let response = await locationWeight.createMessage(message);
			expect(response.markdown).toBe('Location weight has been deleted');
			expect(configSpy).toHaveBeenCalledWith('locationWeightTestLocationtoTestLocation2');
			done();
		});
	});

	describe('triggers', () => {
		it('should accept trigger', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationWeight}`,
				'mockAdminID');
			let results = locationWeight.isToTriggerOn(message);
			expect(results).toBe(true);
		});

		it('should reject wrong command', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> asdf${Command.LocationWeight}`,
				'mockAdminID');
			let results = locationWeight.isToTriggerOn(message);
			expect(results).toBe(false);
		});

		it('should reject wrong id', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="wrongId">${constants.botName}</spark-mention> ${Command.LocationWeight}`,
				'mockAdminID');
			let results = locationWeight.isToTriggerOn(message);
			expect(results).toBe(false);
		});

		it('should accept no space', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention>${Command.LocationWeight}`,
				'mockAdminID');
			let results = locationWeight.isToTriggerOn(message);
			expect(results).toBe(true);
		});

		it('should accept trailing space', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationWeight} `,
				'mockAdminID');
			let results = locationWeight.isToTriggerOn(message);
			expect(results).toBe(true);
		});

		it('should fail for non admin', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationWeight}`,
				'mockID');
			let results = locationWeight.isToTriggerOn(message);
			expect(results).toBe(false);
		});

		it('should accept an additional parameter', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationWeight} get`,
				'mockAdminID');
			let results = locationWeight.isToTriggerOn(message);
			expect(results).toBe(true);
		});

		it('should reject group mention', () => {
			let message = createMessage(`<p><spark-mention data-object-type="groupMention" data-group-type="all">All</spark-mention> ${Command.LocationWeight}`, 'mockID');
			let results = locationWeight.isToTriggerOn(message)
			expect(results).toBe(false);
		});
	});
});
