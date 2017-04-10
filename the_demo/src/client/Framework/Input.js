const Vector2 = require('./Vector2.js');

class Input {

	//keydown/keyup may be called in middle of game cycle
	//use two array to make sure up and down keys are visible at least one in game cycle

	static _keys = {};
	static _upKeys = {};
	static _downKeys = {};

	static _visibleKeys = {};
	static _visibleUpKeys = {};
	static _visibleDownKeys = {};

	static _mousePosition = new Vector2();

	//Called at begining of update cycle
	static _update() {
		Input._visibleKeys = { ...Input._keys };
		Input._visibleUpKeys = { ...Input._upKeys };
		Input._visibleDownKeys = { ...Input._downKeys };

		//take out up/down keys immediately when they become to visible
		Input._upKeys = {};
		Input._downKeys = {};

		// console.log(Input._visibleDownKeys);
	}

	static getKey(key) {
		return Input._visibleKeys[key] || false;
	}

	static getKeyUp(key) {
		return Input._visibleUpKeys[key] || false;
	}

	static getKeyDown(key) {
		return Input._visibleDownKeys[key] || false;
	}

	static get mousePosition() {
		return new Vector2(this._mousePosition._x, this._mousePosition._y);
	}

	static getDirection() {
		var x = 0,
			y = 0;
		if(Input._keys['W'])
			y -= 1;
		if(Input._keys['S'])
			y += 1;
		if(Input._keys['A'])
			x -= 1;
		if(Input._keys['D'])
			x += 1;
		return (new Vector2(x, y)).normalized;
	}

	//Called immediately when key is pressed
	static _setDown(key) {
		if(!Input._keys[key]) {
			Input._downKeys[key] = true;
			Input._keys[key] = true;
		}
	}

	//Called immediately when key is released
	static _setUp(key) {
		if(Input._keys[key]) {
			Input._upKeys[key] = true;
			Input._keys[key] = false;
		}
	}

	static _setMousePosition(x, y) {
		Input._mousePosition._x = x;
		Input._mousePosition._y = y;
	}
}

module.exports = Input;