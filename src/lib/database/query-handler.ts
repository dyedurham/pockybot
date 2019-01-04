import __logger from '../logger';
import * as path from 'path';
import * as fs from 'fs';
import { Client, QueryConfig, QueryResult } from 'pg';

export default class QueryHandler {
	private client : Client;

	constructor(client : Client) {
		this.client = client;

		this.client.connect()
		.catch(function(e) {
			__logger.error(`Error connecting to database:\n${e.message}`);
		});
	}

	public _readFile(filename : string) : string {
		let filePath : string = path.resolve(__dirname, filename);
		return fs.readFileSync(filePath, 'utf8');
	}

	public async executeQuery(query : QueryConfig) : Promise<any> {
		try {
			let data = await this.client.query(query);
			return data['rows'];
		} catch (error) {
			__logger.error(`Error executing query ${query.name}:\n${error.message}`);
			throw new Error('Error executing query');
		}
	}

	public async executeNonQuery(query : QueryConfig) : Promise<QueryResult> {
		try {
			return await this.client.query(query);
		} catch (error) {
			__logger.error(`Error executing non query ${query.name}:\n${error.message}`);
			throw new Error('Error executing non query');
		}
	}
}
