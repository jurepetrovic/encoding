
console.log("HAKUNAMATATA");
var fs = require('fs');



const {parentPort, workerData } = require('worker_threads');

console.log("in worker port="+ parentPort + " data=" + JSON.stringify(workerData));

debugger;

var code = fs.readFileSync('./tekst.txt').toString(); 
// execute this code
console.log(`File=${code}`);


module.exports = {
	getTest: () => {
			console.log("TEST ME");
			debugger;
			console.log("NO TEST");
	}
}
