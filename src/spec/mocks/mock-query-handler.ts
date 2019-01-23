import QueryHandler from '../../lib/database/query-handler-interface';
import { QueryResult, QueryConfig } from 'pg';

export default class MockQueryHandler implements QueryHandler {
	private result : Promise<any> | Promise<QueryResult>;

	constructor(result : any | QueryResult) {
		this.result = new Promise((resolve, reject) => {
			resolve(result);
		});
	}

	public readFile(filename : string) : string {
		return 'file';
	}

	public async executeQuery(query : QueryConfig) : Promise<any> {
		return this.result;
	}

	public async executeNonQuery(query : QueryConfig) : Promise<QueryResult> {
		return this.result;
	}
}
