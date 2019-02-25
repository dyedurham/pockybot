import { PockyDB } from '../database/db-interfaces';
import __logger from '../logger';
import HtmlHelper from '../parsers/htmlHelper';
import { Receiver } from '../../models/receiver';

export interface CategoryResultsService {
	returnCategoryResultsTable(): Promise<string>
}

export class DefaultCategoryResultsService implements CategoryResultsService {
	database: PockyDB;

	constructor(database: PockyDB) {
		this.database = database;
	}

	returnCategoryResultsTable(): Promise<string> {
		throw new Error('Method not implemented.');
	}
}
