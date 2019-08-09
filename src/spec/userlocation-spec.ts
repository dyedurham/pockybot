import UserLocation from '../lib/response-triggers/userlocation';
import constants from '../constants';
import Config from '../lib/config';
import { MessageObject } from 'webex/env';
import { Role } from '../models/database';
import { Command } from '../models/command';
import { LocationAction } from '../models/location-action';
import { GetUserLocationService, DefaultGetUserLocationService } from '../lib/services/get-user-location-service';
import { SetUserLocationService, DefaultSetUserLocationService } from '../lib/services/set-user-location-service';
import { DeleteUserLocationService, DefaultDeleteUserLocationService } from '../lib/services/delete-user-location-service';

function createMessage(htmlMessage : string, person : string) : MessageObject {
	return {
		html: htmlMessage,
		personId: person
	}
}

describe('userlocation trigger', () => {
	const config = new Config(null);
	let getUserLocationService : GetUserLocationService;
	let setUserLocationService : SetUserLocationService;
	let deleteUserLocationService : DeleteUserLocationService;
	let userLocation : UserLocation;

	beforeAll(() => {
		spyOn(config, 'checkRole').and.callFake((userid : string, value : Role) => {
			return userid === 'mockAdminID' && value === Role.Admin;
		});
	});

	beforeEach(() => {
		getUserLocationService = new DefaultGetUserLocationService(null, null);
		setUserLocationService = new DefaultSetUserLocationService(null, null);
		deleteUserLocationService = new DefaultDeleteUserLocationService(null);
		userLocation = new UserLocation(config, getUserLocationService, setUserLocationService, deleteUserLocationService);
	});

	it('should create the message with no command', async (done : DoneFn) => {
		const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} `,
			'mockID');

		let response = await userLocation.createMessage(message);
		expect(response.markdown).toBe('Please specify a command. Possible values are get, set, delete');
		done();
	});

	it('should create the message with unknown command', async (done : DoneFn) => {
		const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} blah`,
			'mockID');

		let response = await userLocation.createMessage(message);
		expect(response.markdown).toBe('Unknown command. Possible values are get, set, delete');
		done();
	});

	it('should create the admin message with no command', async (done : DoneFn) => {
		const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} `,
			'mockAdminID');

		let response = await userLocation.createMessage(message);
		expect(response.markdown).toBe('Please specify a command. Possible values are get, set, delete');
		done();
	});

	it('should create the admin message with unknown command', async (done : DoneFn) => {
		const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} blah`,
			'mockAdminID');

		let response = await userLocation.createMessage(message);
		expect(response.markdown).toBe('Unknown command. Possible values are get, set, delete');
		done();
	});

	it('should call the getUserLocationService', async (done : DoneFn) => {
		const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Get}`,
		'mockID');

		const text = 'Get user location message';
		const getUserLocationSpy = spyOn(getUserLocationService, 'getUserLocation').and.returnValue(Promise.resolve(text));

		const response = await userLocation.createMessage(message);
		expect(response.markdown).toBe(text);
		expect(getUserLocationSpy).toHaveBeenCalled();
		done();
	});

	it('should call the setUserLocationService for non-admin', async (done : DoneFn) => {
		const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Set}`,
		'mockID');

		const text = 'Set user location message non-admin';
		const setUserLocationSpy = spyOn(setUserLocationService, 'setUserLocationNonAdmin').and.returnValue(Promise.resolve(text));

		const response = await userLocation.createMessage(message);
		expect(response.markdown).toBe(text);
		expect(setUserLocationSpy).toHaveBeenCalled();
		done();
	});

	it('should call the setUserLocationService for admin', async (done : DoneFn) => {
		const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Set}`,
		'mockAdminID');

		const text = 'Set user location message admin';
		const setUserLocationSpy = spyOn(setUserLocationService, 'setUserLocationAdmin').and.returnValue(Promise.resolve(text));

		const response = await userLocation.createMessage(message);
		expect(response.markdown).toBe(text);
		expect(setUserLocationSpy).toHaveBeenCalled();
		done();
	});

	it('should call the deleteUserLocationService for non-admin', async (done : DoneFn) => {
		const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Delete}`,
		'mockID');

		const text = 'Delete user location message non-admin';
		const deleteUserLocationSpy = spyOn(deleteUserLocationService, 'deleteUserLocationNonAdmin').and.returnValue(Promise.resolve(text));

		const response = await userLocation.createMessage(message);
		expect(response.markdown).toBe(text);
		expect(deleteUserLocationSpy).toHaveBeenCalled();
		done();
	});

	it('should call the deleteUserLocationService for admin', async (done : DoneFn) => {
		const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Delete}`,
		'mockAdminID');

		const text = 'Delete user location message admin';
		const deleteUserLocationSpy = spyOn(deleteUserLocationService, 'deleteUserLocationAdmin').and.returnValue(Promise.resolve(text));

		const response = await userLocation.createMessage(message);
		expect(response.markdown).toBe(text);
		expect(deleteUserLocationSpy).toHaveBeenCalled();
		done();
	});

	describe('triggers', () => {
		it('should accept trigger', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation}`,
				'mockID');
			let results = userLocation.isToTriggerOn(message);
			expect(results).toBe(true);
		});

		it('should reject wrong command', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> asdf${Command.UserLocation}`,
				'mockID');
			let results = userLocation.isToTriggerOn(message);
			expect(results).toBe(false);
		});

		it('should reject wrong id', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="wrongId">${constants.botName}</spark-mention> ${Command.UserLocation}`,
				'mockID');
			let results = userLocation.isToTriggerOn(message);
			expect(results).toBe(false);
		});

		it('should accept no space', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention>${Command.UserLocation}`,
				'mockID');
			let results = userLocation.isToTriggerOn(message);
			expect(results).toBe(true);
		});

		it('should accept trailing space', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} `,
				'mockID');
			let results = userLocation.isToTriggerOn(message);
			expect(results).toBe(true);
		});

		it('should accept an additional parameter', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} get`,
				'mockID');
			let results = userLocation.isToTriggerOn(message);
			expect(results).toBe(true);
		});


		it('should reject group mention', () => {
			let message = createMessage(`<p><spark-mention data-object-type="groupMention" data-group-type="all">All</spark-mention> stringconfig`, 'mockID');
			let results = userLocation.isToTriggerOn(message)
			expect(results).toBe(false);
		});
	});
});
