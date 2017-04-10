const YieldInstruction = require('./YieldInstruction.js');

class Coroutine extends YieldInstruction {

	static instanceId = 0;

	_instanceId;
	_generator;
	_yieldInstruction;

	constructor(generator) {
		super();

		if(!generator || generator.constructor.name !== 'GeneratorFunction')
			throw new Error('Invalid argument, a generator function expected');

		this._generator = generator();
		this._instanceId = Coroutine.instanceId++;
	}

	get instanceId() {
		return this._instanceId;
	}

	execute() {
		if(this._yieldInstruction && !this._yieldInstruction.done) {
			this._yieldInstruction.execute();
		} else {
			var result = this._generator.next();

			if(result.done) {
				this._done = true;
				return;
			}

			if(result.value instanceof YieldInstruction)
				this._yieldInstruction = result.value;
		}
		
	}
}

module.exports = Coroutine;