import { Logger } from '../logger';
import * as path from 'path';
import * as fs from 'fs';
import { Client, QueryConfig, QueryResult } from 'pg';
import QueryHandlerInterface from './query-handler-interface';

export default class QueryHandler implements QueryHandlerInterface {
	private client : Client;

	constructor(client : Client) {
		this.client = client;

		this.client.connect()
		.catch(function(e) {
			Logger.error(`[QueryHandler.constructor] Error connecting to database: ${e.message}`);
		});
	}

	public readFile(filename : string) : string {
		let filePath : string = path.resolve(__dirname, filename);
		return fs.readFileSync(filePath, 'utf8');
	}

	public async executeQuery(query : QueryConfig) : Promise<any> {
		try {
			let data = await this.client.query(query);
			return data['rows'];
		} catch (error) {
			Logger.error(`[QueryHandler.executeQuery] Error executing query ${query.name}: ${error.message}`);
			throw new Error(`Error executing query ${query.name}`);
		}
	}

	public async executeNonQuery(query : QueryConfig) : Promise<QueryResult> {
		try {
			return await this.client.query(query);
		} catch (error) {
			Logger.error(`[QueryHandler.executeNonQuery] Error executing query ${query.name}: ${error.message}`);
			throw new Error(`Error executing non query ${query.name}`);
		}
	}
}
