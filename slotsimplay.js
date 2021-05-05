
var fs = require('fs');
var show = require('./simulworker.js');
console.log("WE ARE RUNNING");
show.getTest();
console.log("THE END");
console.log("EVALING");
var code = fs.readFileSync('./simulworker.js').toString(); 
// execute this code
//console.log("CODE:"+code);
eval(code);
console.log("DONE DONE");