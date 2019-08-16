import HtmlHelper from '../parsers/htmlHelper';
import { Result } from '../../models/result';

export interface CategoryResultsService {
	returnCategoryResultsTable(results: Result[], categories: string[]) : string
}

export class DefaultCategoryResultsService implements CategoryResultsService {

	returnCategoryResultsTable(results: Result[], categories: string[]) : string {
		let tables = '';

		categories.forEach((category: string, index: number) => {
			const sectionId = `categoryresults-${index}`;
			const categoryResults: Result[] = this.sortCategoryPegs(results, category);
			if (categoryResults.length > 0) {
				tables += `
					<h2 class="clickable collapsed" data-toggle="collapse" data-target="#section-${sectionId}" aria-expanded="false" aria-controls="section-${sectionId}"><i class="fas fa-plus"></i><i class="fas fa-minus"></i> Category: ${HtmlHelper.uppercaseFirstChar(category)}</h2>
`;
				tables += HtmlHelper.generateCategoryResultsTable(categoryResults, sectionId);
			} else {
				tables += `
					<h2>Category: ${HtmlHelper.uppercaseFirstChar(category)}</h2>
					<p class="pb-3">There were no pegs given for this keyword</p>`;
			}
		});
		return tables;
	}

	sortCategoryPegs(results: Result[], category: string) : Result[] {
		let categoryResults: Result[] = results.map(x => Object.assign({}, x)); // deep copy array
		categoryResults.forEach(catResult => {
			catResult.validPegsReceived = catResult.validPegsReceived.filter(x => x.categories.includes(category));
		});

		categoryResults = categoryResults.filter(x => x.validPegsReceived.length > 0);
		// sort from most to least pegs
		categoryResults.sort((a, b) => b.validPegsReceived.length - a.validPegsReceived.length);
		return categoryResults;
	}
}
