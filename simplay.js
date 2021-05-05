

var fs = require('fs');


//var show = require('./simulworker.js');
console.log("WE ARE RUNNING");
//show.getTest();

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
this._workers = [];

let w = new Worker(__dirname + '/simulworker.js', { workerData: {
    id: 1, 
    script: "keks.js",
    dir: "bin",
    baseDir: "/usr/local/",
    args: [1,2,4]
}});

w.id = 1;
this._workers.push(w); 

w.on('message', (msg) => {
    console.log(`w.message=${msg}`);
});

w.on('error', (e) => {
    console.log(`w.error=${e}`);
});

w.on('exit', (code) => {
    console.log(`w.exit=${code}`);
});


console.log("worker created");
console.log("worker messages registered");

console.log("-----------------------------");
console.log("Now trying to load worker the other way.");

// rewrite require function - why on earth?
var _require = require;
require = function(a) {
    if (a == 'worker_threads') {

        return {
			parentPort:{
				postMessage: function(msg){
					Sim.onWorkerEvent.call(Sim, {id: id}, Sim.TYPE_MESSAGE, msg);
				}
			}, 
			workerData: {
                id: 2, 
                script: "keks.js",
                dir: "bin",
                baseDir: "/usr/local/",
                args: [1,2,4]	
			} 
		}

	} 
    else {
		return _require(a);
	}	
};

// load code from file as string
console.log("read the code");
var code = fs.readFileSync(__dirname + '/simulworker2.js').toString(); 
// execute this code
console.log("execute the code");
eval(code);

// return require back to normal
require = _require;

console.log("DONE DONE");