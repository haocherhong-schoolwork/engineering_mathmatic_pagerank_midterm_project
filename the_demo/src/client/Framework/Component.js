const BaseObject = require('./BaseObject.js'),
	Coroutine = require('./Coroutine.js');

class Component extends BaseObject{

	_enabled = true;
	_startCalled = false;
	_gameObject;
	_coroutines = [];

	constructor(name) {
		super(name);
	}

	get enabled() {
		return this._enabled;
	}

	set enabled(value) {

		if(this._enabled == value)
			return;

		this._enabled = value;

		//TODO: onEnable calls should be place in game cycle
		//If is attached to a gameObject
		if(this._gameObject){
			//Trigger onEnable or onDisable
			if(value)
				this.onEnable();
			else
				this.onDisable();
		}
	}

	get gameObject() {
		return this._gameObject;
	}

	startCoroutine(routine, context = this) {
		if(!routine || routine.constructor.name !== 'GeneratorFunction')
			throw new Error('Invalid argument, generator function expected');

		var coroutine = new Coroutine(routine.bind(context));

		coroutine.execute();
		if(!coroutine.done)
			this._coroutines.push(coroutine);

		return coroutine.instanceId;
	}

	stopAllCoroutines() {
		this._coroutines = [];
	}

	stopCoroutine(id) {
		for(var coroutine of this._coroutines) {
			if(coroutine.instanceId === id) {
				this._coroutines.splice(this._coroutines.indexOf(coroutine), 1);
				return;
			}
		}

		console.error('Coroutine not found');
		// throw new Error('Coroutine not found');
	}

	_executeCoroutines() {
		var coroutines = [...this._coroutines];
		for(var coroutine of coroutines) {
			coroutine.execute();
			if(coroutine.done)
				this._coroutines.splice(this._coroutines.indexOf(coroutine), 1);
		}
	}

	_destroy() {
		//This will trigger OnDisable
		this.enabled = false;

		this.onDestroy();

		//Remove from attached gameObject
		if(this._gameObject)
			this._gameObject._removeComponent(this);
	}

	start() {

	}

	update() {
		
	}

	onEnable() {

	}

	onDisable() {

	}

	onDestroy() {

	}
}

module.exports = Component;