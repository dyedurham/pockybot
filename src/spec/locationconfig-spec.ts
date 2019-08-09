import LocationConfig from '../lib/response-triggers/locationconfig';
import constants from '../constants';
import Config from '../lib/config';
import { MessageObject } from 'webex/env';
import { Role } from '../models/database';
import DbLocation from '../lib/database/db-location';
import MockQueryHandler from './mocks/mock-query-handler';
import { Command } from '../models/command';
import { LocationAction } from '../models/location-action';

function createMessage(htmlMessage : string, person : string) : MessageObject {
	return {
		html: htmlMessage,
		personId: person
	}
}

describe('location trigger', () => {
	const config = new Config(null);
	let dbLocation : DbLocation;
	let locationConfig : LocationConfig;

	beforeAll(() => {
		spyOn(config, 'checkRole').and.callFake((userid : string, value : Role) => {
			return userid === 'mockAdminID' && value === Role.Admin;
		});
	});

	beforeEach(() => {
		dbLocation = new DbLocation(new MockQueryHandler(null));
		locationConfig = new LocationConfig(dbLocation, config);
	});

	describe('message parsing', () => {
		it('should create the message with no command', async (done : DoneFn) => {
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationConfig} `,
				'mockID');

			let response = await locationConfig.createMessage(message);
			expect(response.markdown).toBe('Please specify a command. Possible values are get, set, delete');
			done();
		});

		it('should create the message with unknown command', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationConfig} blah`,
				'mockID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));

			let response = await locationConfig.createMessage(message);
			expect(response.markdown).toBe('Unknown command. Possible values are get, set, delete');
			done();
		});

		it('should create the get message with locations set', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationConfig} ${LocationAction.Get}`,
				'mockID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));

			let response = await locationConfig.createMessage(message);
			expect(response.markdown).toBe(
`Here are the current locations:
* TestLocation
* TestLocation2
`
			);
			done();
		});

		it('should create the get message with no locations set', async (done : DoneFn) => {
			const locations : string[] = [];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationConfig} ${LocationAction.Get}`,
				'mockID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));

			let response = await locationConfig.createMessage(message);
			expect(response.markdown).toBe('No locations set');
			done();
		});

		it('should create the set message with non admin', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation2' ];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationConfig} ${LocationAction.Set} TestLocation`,
				'mockID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));
			const locationSpy = spyOn(dbLocation, 'setLocation').and.stub();

			let response = await locationConfig.createMessage(message);
			expect(response.markdown).toBe('Permission denied. You may only use the \'get\' command');
			expect(locationSpy).not.toHaveBeenCalled();
			done();
		});


		it('should create the set message with admin with no location name provided', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationConfig} ${LocationAction.Set}`,
				'mockAdminID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));

			let response = await locationConfig.createMessage(message);
			expect(response.markdown).toBe('You must specify a location name to set');
			done();
		});

		it('should create the set message with admin when the location has already been set', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationConfig} ${LocationAction.Set} TestLocation`,
				'mockAdminID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));

			let response = await locationConfig.createMessage(message);
			expect(response.markdown).toBe('Location value "TestLocation" has already been set');
			done();
		});

		it('should create the set message with admin when the location given is valid', async (done : DoneFn) => {
			const locationToAdd = 'TestLocation';
			const locations : string[] = [ 'TestLocation2' ];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationConfig} ${LocationAction.Set} ${locationToAdd}`,
				'mockAdminID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));
			let setLocationSpy = spyOn(dbLocation, 'setLocation').and.stub();

			let response = await locationConfig.createMessage(message);
			expect(setLocationSpy).toHaveBeenCalledWith(locationToAdd);
			expect(response.markdown).toBe('Location has been set');
			done();
		});

		it('should create the delete message with non admin', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationConfig} ${LocationAction.Delete} TestLocation`,
				'mockID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));
			const locationSpy = spyOn(dbLocation, 'deleteLocation').and.stub();

			let response = await locationConfig.createMessage(message);
			expect(response.markdown).toBe('Permission denied. You may only use the \'get\' command');
			expect(locationSpy).not.toHaveBeenCalled();
			done();
		});

		it('should create the delete message with admin with no location name provided', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationConfig} ${LocationAction.Delete}`,
				'mockAdminID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));

			let response = await locationConfig.createMessage(message);
			expect(response.markdown).toBe('You must specify a location name to delete');
			done();
		});

		it('should create the delete message with admin when the location does not exist', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation2' ];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationConfig} ${LocationAction.Delete} TestLocation`,
				'mockAdminID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));

			let response = await locationConfig.createMessage(message);
			expect(response.markdown).toBe('Location value "TestLocation" does not exist');
			done();
		});

		it('should create the delete message with admin when the location given is valid', async (done : DoneFn) => {
			const locationToAdd = 'TestLocation';
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationConfig} ${LocationAction.Delete} ${locationToAdd}`,
				'mockAdminID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));
			let setLocationSpy = spyOn(dbLocation, 'deleteLocation').and.stub();

			let response = await locationConfig.createMessage(message);
			expect(setLocationSpy).toHaveBeenCalledWith(locationToAdd);
			expect(response.markdown).toBe('Location has been deleted');
			done();
		});
	});

	describe('triggers', () => {
		it('should accept trigger', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationConfig}`,
				'mockID');
			let results = locationConfig.isToTriggerOn(message);
			expect(results).toBe(true);
		});

		it('should reject wrong command', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> asdf${Command.LocationConfig}`,
				'mockID');
			let results = locationConfig.isToTriggerOn(message);
			expect(results).toBe(false);
		});

		it('should reject wrong id', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="wrongId">${constants.botName}</spark-mention> ${Command.LocationConfig}`,
				'mockID');
			let results = locationConfig.isToTriggerOn(message);
			expect(results).toBe(false);
		});

		it('should accept no space', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention>${Command.LocationConfig}`,
				'mockID');
			let results = locationConfig.isToTriggerOn(message);
			expect(results).toBe(true);
		});

		it('should accept trailing space', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationConfig} `,
				'mockID');
			let results = locationConfig.isToTriggerOn(message);
			expect(results).toBe(true);
		});

		it('should accept an additional parameter', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.LocationConfig} get`,
				'mockID');
			let results = locationConfig.isToTriggerOn(message);
			expect(results).toBe(true);
		});


		it('should reject group mention', () => {
			let message = createMessage(`<p><spark-mention data-object-type="groupMention" data-group-type="all">All</spark-mention> stringconfig`, 'mockID');
			let results = locationConfig.isToTriggerOn(message)
			expect(results).toBe(false);
		});
	});
});


