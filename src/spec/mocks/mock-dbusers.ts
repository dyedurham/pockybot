import { DbUsers } from '../../lib/database/db-interfaces';
import { QueryResult } from 'pg';
import { UserRow } from '../../models/database';

export default class MockDbUsers implements DbUsers {
	async createUser(userid : string) : Promise<QueryResult> {
		throw new Error('Method not implemented.');
	}

	async updateUser(username : string, userid : string) : Promise<number> {
		throw new Error('Method not implemented.');
	}

	async getUsers() : Promise<UserRow[]> {
		throw new Error('Method not implemented.');
	}

	async getUser(userid : string) : Promise<UserRow> {
		return {
			userid: 'abc',
			username: 'mock name'
		}
	}

	async existsOrCanBeCreated(userid : string) : Promise<boolean> {
		return true;
	}

	async exists(userid : string) : Promise<boolean> {
		return true;
	}

	async deleteUser(userid : string) : Promise<void> {
		return;
	}
}
