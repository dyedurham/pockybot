import { CategoryResultsService } from '../../lib/services/category-results-service';
import { Receiver } from '../../models/receiver';

export default class MockCategoryResultsService implements CategoryResultsService {
	returnCategoryResultsTable(results: Receiver[], categories: string[]): string {
		return '';
	}
}
