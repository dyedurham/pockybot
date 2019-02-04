// const winnersData = await this.database.returnWinners();
// const resultsData = await this.database.returnResults();
// const results: Receiver[] = TableHelper.mapResults(resultsData);
// const winners: Receiver[] = TableHelper.mapResults(winnersData);

// let today = new Date();
// let todayString = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

// let filePath = `${__dirname}/../../../pegs-${todayString}`;
// if (fs.existsSync(filePath + '.txt')) {
// 	fs.unlinkSync(filePath + '.txt');
// }
// __logger.information("File path: " + filePath);

// let columnWidths = TableHelper.getReceiverColumnWidths(results);

// // define table heading
// let resultsTable = TableHelper.padString('Receiver', columnWidths.receiver) + ' | ' + TableHelper.padString('Sender', columnWidths.sender) + ' | Comments' + lineEnding;
// resultsTable += 'Total'.padEnd(columnWidths.receiver) + ' | ' + ' '.padEnd(columnWidths.sender) + ' | ' + lineEnding;
// resultsTable += ''.padEnd(columnWidths.receiver, '-') + '-+-' + ''.padEnd(columnWidths.sender, '-') + '-+-' + ''.padEnd(columnWidths.comment, '-') + lineEnding;

// let pegsReceived = {};

// // map table data
// results.forEach((result: Receiver) => {
// 	pegsReceived[result.id] = ''
// 	pegsReceived[result.id] += result.person.toString().padEnd(columnWidths.receiver) + ' | ' + ''.padEnd(columnWidths.sender) + ' | ' + lineEnding;
// 	let firstPeg = true;
// 	let pegCount = result.pegs.length;
// 	result.pegs.forEach((peg: PegReceivedData) => {
// 		if (firstPeg) {
// 			pegsReceived[result.id] += pegCount.toString().padEnd(columnWidths.receiver) + ' | ' + peg.sender.toString().padEnd(columnWidths.sender) + ' | ' + peg.comment + lineEnding;
// 			firstPeg = false;
// 		} else {
// 			pegsReceived[result.id] += ''.padEnd(columnWidths.receiver) + ' | ' + peg.sender.toString().padEnd(columnWidths.sender) + ' | ' + peg.comment + lineEnding;
// 		}
// 	});
// 	resultsTable += pegsReceived[result.id];
// });
// __logger.information('Results table fully mapped');

// for (let receiver in pegsReceived) {
// 	this.spark.messages.create(
// 		{
// 			markdown:
// 				`Here are the pegs your have received this cycle:
// \`\`\`
// ${pegsReceived[receiver]}
// \`\`\``,
// 			toPersonId: receiver
// 		});
// }

// let html = this.generateHtml(results, todayString);

// fs.writeFileSync(filePath + '.txt', resultsTable);
// fs.writeFileSync(filePath + '.html', html);

// const client = new storage.Storage();
// let response = await client.bucket(process.env.GCLOUD_BUCKET_NAME).upload(filePath + '.html');
// let file = response[0];
// await file.makePublic();

// let fileUrl = `${constants.googleUrl}${process.env.GCLOUD_BUCKET_NAME}/pegs-${todayString}.html`;
// let markdown = `[Here are all pegs given this cycle](${fileUrl})`;

// return {
// 	markdown: markdown
// }
