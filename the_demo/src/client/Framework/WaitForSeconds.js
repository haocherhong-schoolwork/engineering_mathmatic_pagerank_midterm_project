const YieldInstruction = require('./YieldInstruction.js');

class WaitForSeconds extends YieldInstruction {

	_seconds;
	_beginTime;

	constructor(seconds) {
		super();
		if(typeof(seconds) !== 'number' || seconds < 0)
			throw new Error('Invalid argument, positive seconds number expected');
		this._seconds = seconds;
	}

	execute() {
		if(!this._beginTime) {
			this._beginTime = Date.now();
		} else {
			if((Date.now() - this._beginTime) / 1000 >= this._seconds)
				this._done = true;
		}
	}
}

module.exports = WaitForSeconds;