import { CategoryResultsService } from '../../lib/services/category-results-service';
import { Result } from '../../models/result';

export default class MockCategoryResultsService implements CategoryResultsService {
	returnCategoryResultsTable(results: Result[], categories: string[]): string {
		return '';
	}
}
