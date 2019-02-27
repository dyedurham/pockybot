import { Receiver } from '../../models/receiver';
import { PegReceivedData } from '../../models/peg-received-data';

function generateTable(receivers: Receiver[]) : string {
	let htmlTable =
'					<table class="table pb-3">';

	receivers.forEach((result: Receiver) => {

		htmlTable += `
						<thead class="thead-light">
							<tr><th colspan="3">${result.person.toString()} &mdash; ${result.pegs.length} peg(s) total</th></tr>
						</thead>
						<tbody>`;

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
