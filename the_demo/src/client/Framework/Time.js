class Time {

	static _beginTime;
	static _deltaTime;
	static _lastUpdate;

	static _init() {
		Time._beginTime = Date.now();
		Time._lastUpdate = Time._beginTime;
	}

	static _update() {
		var now = Date.now();
		Time._deltaTime = (now - Time._lastUpdate) / 1000;
		Time._lastUpdate = now;
	}

	static get time() {
		return (Date.now() - Time._beginTime) / 1000;
	}

	static get deltaTime() {
		return Time._deltaTime;
	}
}

module.exports = Time;