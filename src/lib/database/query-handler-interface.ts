import { QueryConfig, QueryResult } from 'pg';

export default interface QueryHandler {
	readFile : (filename : string) => string;
	executeQuery : (query : QueryConfig) => Promise<any>;
	executeNonQuery : (query : QueryConfig) => Promise<QueryResult>;
}
