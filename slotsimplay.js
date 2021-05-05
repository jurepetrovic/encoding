/*
needed args: 
data = {
    mode: "simul",				// always this mode
    numSpins: 1000000, 			// nr spins
    numPaylines: 1, 			// number of paylines    
    betPerLine: 1, 				// bet per line in credit     
    maxWinCap: 0, 				// maxwincap (usually 0)     
    excel: true, 				// generate excels
    numThreads: 2, 				// nr_threads
    verbose: true, 				// verbose mode
    injRandoms: "", 			// injected randoms if exist
    trailingName: "trailing"	// trailing file name (default: "trailing")
	logRNG: true or false		// bool log rng
	minWinToLog: number			// minimum win to log rng
}

HOW DATA LOOKS for SinglePlay (always): 

 let params = {
                action:"params",
                filePath: this.store.get("general.filePath"),
                mode: "simul",				// always this mode
                numSpins: 1, 				// always 1
                numPaylines: this.store.get("singlePlay.numPaylines"), 	        // dynamic !
                betPerLine: 1, 				// should be always 1
                maxWinCap: 0, 				// always 0 (unlimited)
                excel: false, 				// never generate excels in single play
                numThreads: 1, 				// always 1
                verbose: true, 				// verbose mode always true
                injRandoms: this.store.get("singlePlay.injectRandoms"), 			// injected random dynamic
                trailingName: "singlePlay"	// always this - used only with excels, but here disabled
        }
*/

var	Path = require('path');
var	fs = require('fs');

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// date manipulation methods
const dateFormat = require("./dateutils").dateFormat;

var Sim = new function() 
{
	this.TYPE_ERROR = 1;
	this.TYPE_MESSAGE = 2;
	this.TYPE_EXIT = 3;

	this._workerStat = {};
	this._workers = [];
	this._workerFiles = [];

	//debugger;
	// class variable - params object for simulation settings
	this.params = {}
	
	this.startWorker = function(id, script, dir, baseDir, args) {

		if (this.threads > 1 || !this.verbose) {
			
			let w = new Worker(__dirname + '/simulworker.js', { workerData: {
				id: id, 
				script: script,
				dir: dir,
				baseDir: baseDir,
				args: args
			}});

			w.id = id;
			this._workers.push(w); 
			
			w.on('message', (msg) => {
				Sim.onWorkerEvent.call(Sim, w, Sim.TYPE_MESSAGE, msg);
			});
			
			w.on('error', (e) => {
				Sim.onWorkerEvent.call(Sim, w, Sim.TYPE_ERROR, e)
			});
			
			w.on('exit', (code) => {
				Sim.onWorkerEvent.call(Sim, w, Sim.TYPE_EXIT, code);
		   });

		// 1 thread   
		} else {
			
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
							id: id, 
							script: script,
							dir: dir,
							baseDir: baseDir,
							args: args			
						} 
					} 				
				} else {

					return _require(a);
				}	
			};

			// load code from file as string
			var code = fs.readFileSync(__dirname + '/simulworker.js').toString(); 
			// execute this code
			eval(code);

			require = _require;
			
			// exit when 1 thread finished
			console.log("STOP called");
			//this.stop();
		}
	}
	
	// start simulation
	this.simulate = function() {
		this.games = JSON.parse(this.simulations[0]);
		
		this.start.call(Sim);
		//this.start();
	}

	// start the simulation
	this.start = function() {

		this.startedAt = Date.now();
		this.started = true;
		
		// wArgs is args array from old software versions. 
		// adapt properly.
		// [10000, 10, 1, 0, true, 1, false, "", "_test"]
        var wArgs = this.createWArgs();
		// if needed, created directories for excel reports
		this.dir = Path.join(Path.dirname(this.script),  Path.basename(this.script, ".js"));
		if (this.excel || this.logRNG || this.logRngDebug) 
			try {
				fs.mkdirSync(this.dir); 
			} catch(e) {
				if (e.code === "EEXIST") {
					//console.log("script report directory already exists");
				} else {
					console.error("Cannot create script report directory");
				}
			}
		
		this.dir = Path.join(this.dir, dateFormat(new Date(), 'm-d-Y'));
		if (this.excel || this.logRNG || this.logRngDebug) 
			try {
				fs.mkdirSync(this.dir); 
			} catch(e) {
				if (e.code === "EEXIST") {
					//console.log("Script-date report directory already exists")
				} else {
					console.error("Cannot create script-date report directory");
				}
			}

		this.dir = Path.join(this.dir, dateFormat(new Date(), 'H-i-s'));
		if (this.excel || this.logRNG || this.logRngDebug) 
			try {
				fs.mkdirSync(this.dir); 
			} catch(e) {
				console.error("Cannot create script-date-hour report directory");
			}
			
			
		//throw new Error('t=' + this.threads);
		// start configured threads
		for (var i=0; i<this.threads; i++) {			
			Sim.startWorker(i+1, this.script, this.dir, this.baseDir, wArgs);
		}
		
	}

	this.init = function(params) {

		// filepath is array, bcs of multiselection element
		this.script = params.filePath[0];
		this.baseDir = params.folderPath[0];
		this.simulations = params.numSpins.split(","); // number of games = 5000000;
		this.threads = params.numThreads;
		this.verbose = params.verbose;
		this.excel = params.excel;
		this.logRNG = params.logRNG;
		this.rngMode = params.rngMode;
		this.logRngDebug = params.logRngDebug;
		// set, when started
		this.started = false;
		// and finally general
		this.params = params;
		
	}

	// create wargs array for threads.
	this.createWArgs = function() {
		
		// wArgs is args array from old software versions. 
		// adapt properly.
		// [10000, 10, 1, 0, true, 1, false, "", "_test"]

		var ret = [
			this.games / this.params.numThreads, // num games
			this.params.numPaylines, // number of paylines
			this.params.betPerLine,  // bet per line in credits
			this.params.maxWinCap,
			this.params.excel, 
			this.params.numThreads, 
			this.params.verbose,
			this.params.injRandoms, // injected randoms as string separated with commas ","
			this.params.trailingName,
			this.params.logRNG,
			this.params.minWinToLog,
			this.params.rngMode, // args[11] - RNG operation mode 0=internal, 1=fetch from stakelogic file, 
			this.params.logRngDebug
		];
		return ret;
	}
}

// test manual invocation for bytenode
let testData = {
	filePath: ["D:\\Coding\\VSCode\\book.js"],
	folderPath: ["D:\\Coding\\VSCode\\ide.git"],
	mode: "simul",
	numSpins: "1",
	numPaylines: "10",
	betPerLine: 1,
	maxWinCap: 0,
	excel: false,
	numThreads: 1,
	verbose: true,
	injRandoms: "",
	trailingName: "singlePlay",
	logRNG: false, 
	minWinToLog: "0",
	rngMode:0,
	logRngDebug:false
}

console.log("Instantiating");
//debugger;
//let simulation = new Sim();

Sim.init(testData)
Sim.simulate();