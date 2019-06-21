import Location from '../lib/response-triggers/location';
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
	let location : Location;

	beforeAll(() => {
		spyOn(config, 'checkRole').and.callFake((userid : string, value : Role) => {
			return userid === 'mockAdminID' && value === Role.Admin;
		});
	});

	beforeEach(() => {
		dbLocation = new DbLocation(new MockQueryHandler(null));
		location = new Location(dbLocation, config);
	});

	describe('message parsing', () => {
		it('should create the message with no command', async (done : DoneFn) => {
			const message = { html: `<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.Location} ` };

			let response = await location.createMessage(message);
			expect(response.markdown).toBe('Please specify a command. Possible values are get, set, delete');
			done();
		});

		it('should create the message with unknown command', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const message = { html: `<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.Location} blah` };

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));

			let response = await location.createMessage(message);
			expect(response.markdown).toBe('Unknown command. Possible values are get, set, delete');
			done();
		});

		it('should create the get message with locations set', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const message = { html: `<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.Location} ${LocationAction.Get}` };

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));

			let response = await location.createMessage(message);
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
			const message = { html: `<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.Location} ${LocationAction.Get}` };

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));

			let response = await location.createMessage(message);
			expect(response.markdown).toBe('No locations set');
			done();
		});

		it('should create the set message with no location name provided', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const message = { html: `<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.Location} ${LocationAction.Set}` };

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));

			let response = await location.createMessage(message);
			expect(response.markdown).toBe('You must specify a location name to set');
			done();
		});

		it('should create the set message when the location has already been set', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const message = { html: `<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.Location} ${LocationAction.Set} TestLocation` };

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));

			let response = await location.createMessage(message);
			expect(response.markdown).toBe('Location value "TestLocation" has already been set');
			done();
		});

		it('should create the set message when the location given is valid', async (done : DoneFn) => {
			const locationToAdd = 'TestLocation';
			const locations : string[] = [ 'TestLocation2' ];
			const message = { html: `<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.Location} ${LocationAction.Set} ${locationToAdd}` };

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));
			let setLocationSpy = spyOn(dbLocation, 'setLocation').and.stub();

			let response = await location.createMessage(message);
			expect(setLocationSpy).toHaveBeenCalledWith(locationToAdd);
			expect(response.markdown).toBe('Location has been set');
			done();
		});

		it('should create the delete message with no location name provided', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const message = { html: `<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.Location} ${LocationAction.Delete}` };

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));

			let response = await location.createMessage(message);
			expect(response.markdown).toBe('You must specify a location name to delete');
			done();
		});

		it('should create the delete message when the location does not exist', async (done : DoneFn) => {
			const locations : string[] = [ 'TestLocation2' ];
			const message = { html: `<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.Location} ${LocationAction.Delete} TestLocation` };

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));

			let response = await location.createMessage(message);
			expect(response.markdown).toBe('Location value "TestLocation" does not exist');
			done();
		});

		it('should create the delete message when the location given is valid', async (done : DoneFn) => {
			const locationToAdd = 'TestLocation';
			const locations : string[] = [ 'TestLocation', 'TestLocation2' ];
			const message = { html: `<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.Location} ${LocationAction.Delete} ${locationToAdd}` };

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(locations));
			let setLocationSpy = spyOn(dbLocation, 'deleteLocation').and.stub();

			let response = await location.createMessage(message);
			expect(setLocationSpy).toHaveBeenCalledWith(locationToAdd);
			expect(response.markdown).toBe('Location has been deleted');
			done();
		});
	});

	describe('triggers', () => {
		it('should accept trigger', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.Location}`,
				'mockAdminID');
			let results = location.isToTriggerOn(message);
			expect(results).toBe(true);
		});

		it('should reject wrong command', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> asdf${Command.Location}`,
				'mockAdminID');
			let results = location.isToTriggerOn(message);
			expect(results).toBe(false);
		});

		it('should reject wrong id', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="wrongId">${constants.botName}</spark-mention> ${Command.Location}`,
				'mockAdminID');
			let results = location.isToTriggerOn(message);
			expect(results).toBe(false);
		});

		it('should accept no space', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention>${Command.Location}`,
				'mockAdminID');
			let results = location.isToTriggerOn(message);
			expect(results).toBe(true);
		});

		it('should accept trailing space', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.Location} `,
				'mockAdminID');
			let results = location.isToTriggerOn(message);
			expect(results).toBe(true);
		});

		it('should fail for non admin', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.Location}`,
				'mockID');
			let results = location.isToTriggerOn(message);
			expect(results).toBe(false);
		});

		it('should accept an additional parameter', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.Location} get`,
				'mockAdminID');
			let results = location.isToTriggerOn(message);
			expect(results).toBe(true);
		});


		it('should reject group mention', () => {
			let message = createMessage(`<p><spark-mention data-object-type="groupMention" data-group-type="all">All</spark-mention> stringconfig`, 'mockAdminID');
			let results = location.isToTriggerOn(message)
			expect(results).toBe(false);
		});
	});
});


