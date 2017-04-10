class YieldInstruction {

	_done = false;

	constructor() {
		if (this.constructor === YieldInstruction)
      		throw new Error('YieldInstruction is an abstract class');
	}

	get done() {
		return this._done;
	}

	execute() {
		
	}
}

module.exports = YieldInstruction;