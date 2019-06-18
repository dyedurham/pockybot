import { Receiver } from '../../models/receiver';
import { PegReceivedData } from '../../models/peg-received-data';

function generateTable(receivers: Receiver[], section: string = null) : string {
	let htmlTable =
'					<table class="table pb-3">';
	if(section) {
		htmlTable =
`					<table id="section-${section}" class="table pb-3 collapse">`;
	}

	receivers.forEach((result: Receiver, index: number) => {
		const subsectionId = section ? `section-${section}-${index}` : null;

		htmlTable += `
						<thead class="thead-light ${section ? `clickable" data-toggle="collapse" data-target="#${subsectionId}" aria-expanded="true" aria-controls="${subsectionId}`:''}">
							<tr><th colspan="3">${section ? '<i class="fas fa-plus"></i><i class="fas fa-minus"></i>' : ''} ${result.person ? result.person.toString() : 'somebody'} &mdash; ${result.weightedPegsReceived} (${result.validPegsReceived}) peg(s) total</th></tr>
						</thead>
						<tbody ${section ? `id="${subsectionId}" class="collapse show"` : ''}>`;

		result.pegs.sort((a, b) => a.sender.localeCompare(b.sender));

		result.pegs.forEach((peg: PegReceivedData) => {
			htmlTable += `
							<tr><td>${peg.sender}</td><td>${peg.comment}</td><td>${peg.categories.join(', ')}</td></tr>
`;
		});

		htmlTable +=
`						</tbody>
`;
	});
	htmlTable +=
`					</table>`;

	return htmlTable;
}

function uppercaseFirstChar(word: string) : string {
	return word.charAt(0).toUpperCase() + word.slice(1);
}

export default {
	generateTable,
	uppercaseFirstChar
}
