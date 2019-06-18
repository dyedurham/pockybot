import HtmlHelper from '../parsers/htmlHelper';
import { Receiver } from '../../models/receiver';

export interface CategoryResultsService {
	returnCategoryResultsTable(results: Receiver[], categories: string[]) : string
}

export class DefaultCategoryResultsService implements CategoryResultsService {

	returnCategoryResultsTable(results: Receiver[], categories: string[]) : string {
		let tables = '';

		categories.forEach((category: string, index: number) => {
			const sectionId = `categoryresults-${index}`
			const categoryResults: Receiver[] = this.sortCategoryPegs(results, category);
			if (categoryResults.length > 0) {
				tables += `
					<h2 class="clickable collapsed" data-toggle="collapse" data-target="#section-${sectionId}" aria-expanded="false" aria-controls="section-${sectionId}"><i class="fas fa-plus"></i><i class="fas fa-minus"></i> Category: ${HtmlHelper.uppercaseFirstChar(category)}</h2>
`;
				tables += HtmlHelper.generateTable(categoryResults, sectionId);
			} else {
				tables += `
					<h2>Category: ${HtmlHelper.uppercaseFirstChar(category)}</h2>
					<p class="pb-3">There were no pegs given for this keyword</p>`;
			}
		});
		return tables;
	}

	sortCategoryPegs(results: Receiver[], category: string) : Receiver[] {
		let categoryResults: Receiver[] = results.map(x => Object.assign({}, x)); // deep copy array
		categoryResults.forEach(catResult => {
			catResult.pegs = catResult.pegs.filter(x => x.categories.includes(category));
		});

		categoryResults = categoryResults.filter(x => x.pegs.length > 0);
		categoryResults.sort((a, b) => b.weightedPegsReceived - a.weightedPegsReceived); // sort from most to least pegs
		return categoryResults;
	}
}
