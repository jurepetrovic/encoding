
console.log("HAKUNAMATATA");
var fs = require('fs');



const {parentPort, workerData } = require('worker_threads');

console.log("in worker port="+ parentPort + " data=" + JSON.stringify(workerData));

debugger;

console.log("this will not be printed anymore with NDB!");

var code = fs.readFileSync('./text.txt').toString(); 
// execute this code
console.log(`File=${code}`);
