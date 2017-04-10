class BaseObject {

	static _instanceId = 0;

	_instanceId;

	constructor(name) {
		this.name = name;
		this._instanceId = BaseObject._instanceId++;
	}

	get instanceId() {
		return this._instanceId;
	}

	toString() {
		return (this.name ? this.name + ' ' : '') + '[' + this.constructor.name + ' Object]';
	}

	static destroy(baseObject) {
		baseObject._destroy();
	}
}

module.exports = BaseObject;