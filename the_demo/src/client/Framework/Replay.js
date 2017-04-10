console.log('loading Replay');

const Util = require('./Util.js');

const GREEN_LOG = "color: #6cbd45";

class Replay {
	constructor(game) {
		/**
		 * 自動測試重播系統
		 *
		 * @class Replay
		 * @constructor
		 */
		this.game = game;
		this._cycleCount = 0;
		this._replayList = [];
		this.ReplayClass = {};
		this.ReplayInstance = {};
		this._start = false;
		this._isWaiting = false;
		this._pollingFunction;
		this._waitingCounter = 0;
		this._waitingCondition;
		this._isReady = false;
		this._isTestEnd = false;
		this._isContinue = false;
		this._waitForTimeoutSecond = 30;
		this._waitForTimeout = 600;

		this.replayList = this._replayList;

		this.hasExecuteCommand = false;
		this.useGoToLevel = false;


		var _qUnitStarting = true;

		var replayItem = function() {
			this.replayFunction;
			this.infoString;
			this.failString;
			this.x;
			this.y;
			this.isDone = false;
			this.execute = function() {
				try {
					// console.log(this.infoString);
					this.replayFunction();
				} catch (err) {
					// console.error('Action Fail:' + this.infoString + "\n" + err);
					// this.game.pause();
				}
				this.isDone = true;
			}

		};

		var assertionItem = function() {
			this.targetValue;
			this.assertValue;
			this.infoString;
			this.failString;
			this.delta;

			this.execute = function() {
				var isEqual;
				if (Util.isUndefined(this.delta)) {
					this.delta = 0;
				}
				if (Util.isNumber(this.assertValue)) {
					isEqual = this.assertValue - this.delta <= evaluate(this.targetValue) && evaluate(this.targetValue) <= this.assertValue + this.delta;
				} else {
					isEqual = this.assertValue === evaluate(this.targetValue)
				}
				var assertMessage;
				if (isEqual) {
					assertMessage = "Passed!"
					QUnit.assert.ok(isEqual, assertMessage);
				} else {
					assertMessage = 'Assert Fail! targetValue: ' + evaluate(this.targetValue) + ', assertValue: ' + this.assertValue;
					assertMessage += '\nFail at ' + this.infoString;
					QUnit.assert.ok(isEqual, assertMessage);
					//this.game.pause();
				}
			}
		};

		var stopReplay = function() {
			this._cycleCount = 0;
			this._replayList = [];
			this._isReady = false;
			this._isTestEnd = true;
			this.game.pause();
			console.error('Test Stop');
			console.log('%c ----------------------------', GREEN_LOG);
		}

		var resume = function() {
			var item = new replayItem();
			item.replayFunction = function() {
				this.game.resume();
			}
			_replayList.push(item);
		};

		var executeCommend = function() {
			while (this._replayList.length > 0 && this._isWaiting == false && this._isReady == true && this.game.isContinue == false) {
				this._replayList[0].execute();
				this._replayList.shift();
			}
		};

		var waitLoop = function() {
			_waitingCounter++;
			if (Framework.Util.isNumber(_waitingCondition)) {
				if (_waitingCounter >= _waitingCondition) {
					_isWaiting = false;
					executeCommend();
				}
			} else {
				if (_waitingCondition.isFitCondition()) {
					_isWaiting = false;
					executeCommend();
				}
			}

			if (_waitingCounter > _waitForTimeout) {
				var timeoutMessage = 'Wait For Timeout' + _waitingCondition;
				if (Framework.Util.isNumber(_waitingCondition) === false) {
					timeoutMessage += '\nFail at ' + _waitingCondition.getInfoString();
				}
				// QUnit.assert.ok(false, timeoutMessage);
				this.game.pause();

			}
		};
	}

	update() {
		if (this._isReady) {
			this._cycleCount++;
			//console.log("Cycle count = " + _cycleCount);
			if (this._isWaiting == false) {
				if (this._replayList.length > 0) {
					this.hasExecuteCommand = true;
					executeCommend();
				} else {
					if (!this._isTestEnd) {
						if (this.hasExecuteCommand) {
							console.log('%c Test Case Success', GREEN_LOG);
							console.log('%c ----------------------------', GREEN_LOG);
							//this.game.pause();
							this._isTestEnd = true;
							this.hasExecuteCommand = false;
							// QUnit.start();
						}

					}
				}
			} else {
				waitLoop();
			}

			// if (_replayList.length > 0) {
			// 	if (_isWaiting == false) {
			// 		_replayList[0].execute();
			// 		_replayList.shift();
			// 	} else {
			// 		waitLoop();
			// 	}
			// }else
			// {
			// 	if(!_isTestEnd){
			// 		console.log('%c Test Case Success',GREEN_LOG);
			// 		console.log('%c ----------------------------',GREEN_LOG);
			// 		this.game.pause();
			// 		_isTestEnd = true;
			// 	}
			// }
		}
	}

	resetCycleCount() {
		this._cycleCount = 0;
	}

	getCycleCount() {
		return this._cycleCount;
	}

	pause() {
		var item = new replayItem();
		item.replayFunction = function() {
			this.game.pause();
			//console.log("Replay pause at " + _cycleCount + "th cycle");
		}
		_replayList.push(item);
	}

	waitFor(condition) {

		var item = new replayItem();

		var callStack = new Error().stack;
		var splliString = callStack.split("    at ")[2].split("(")[1].replace(")", "");
		item.infoString = splliString;

		item.replayFunction = function() {
			if (Framework.Util.isNumber(condition) === false) {
				//console.log("wait start");
				condition.setInfoString(splliString);
			}
			_waitForTimeout = _waitForTimeoutSecond * this.game.getUpdateFPS();
			_waitingCounter = 1;
			_isWaiting = true;
			_waitingCondition = condition;
		}
		_replayList.push(item);
	}

	assertEqual(targetValue, assertValue, delta) {
		var item = new assertionItem();

		var callStack = new Error().stack;
		var splliString = callStack.split("    at ")[2].split("(")[1].replace(")", "");
		item.infoString = splliString;

		item.targetValue = targetValue;
		item.assertValue = assertValue;
		item.delta = delta;
		_replayList.push(item);
	}

	evaluate(objectString) {
		return eval('this.game._currentLevel.' + objectString);
	}

	mouseClick(x, y) {
		var item = new replayItem();

		var callStack = new Error().stack;
		var splliString = callStack.split("    at ")[2].split("(")[1].replace(")", "");
		item.infoString = splliString;

		item.replayFunction = function() {
			var e = {
				x: 0,
				y: 0
			};
			e.x = x;
			e.y = y;
			this.game.click(e);
		};
		_replayList.push(item);
	}

	mouseDown(x, y) {
		var item = new replayItem();

		var callStack = new Error().stack;
		var splliString = callStack.split("    at ")[2].split("(")[1].replace(")", "");
		item.infoString = splliString;

		item.replayFunction = function() {
			var e = {
				x: 0,
				y: 0
			};
			e.x = x;
			e.y = y;
			this.game.mousedown(e);
		};
		_replayList.push(item);
	}

	mouseClickProperty(positionString) {
		var item = new replayItem();

		var callStack = new Error().stack;
		var splliString = callStack.split("    at ")[2].split("(")[1].replace(")", "");
		item.infoString = splliString;

		item.replayFunction = function() {
			var e = {
				x: 0,
				y: 0
			};
			e.x = evaluate(positionString).x;
			e.y = evaluate(positionString).y;
			//console.log("Click " + e.x + " " + e.y);
			this.game.click(e);
		};
		_replayList.push(item);
	}

	mouseClickObject(objectString) {
		var item = new replayItem();

		var callStack = new Error().stack;
		var splliString = callStack.split("    at ")[2].split("(")[1].replace(")", "");
		item.infoString = splliString;

		item.replayFunction = function() {
			var e = {
				x: 0,
				y: 0
			};
			e.x = evaluate(objectString).position.x;
			e.y = evaluate(objectString).position.y;
			this.game.click(e);
		};
		_replayList.push(item);
	}

	mouseMove(x, y) {
		var item = new replayItem();

		var callStack = new Error().stack;
		var splliString = callStack.split("    at ")[2].split("(")[1].replace(")", "");
		item.infoString = splliString;

		item.replayFunction = function() {
			var e = {
				x: 0,
				y: 0
			};
			e.x = x;
			e.y = y;
			this.game.mousemove(e);
		};
		_replayList.push(item);
	}

	keyDown(key) {
		var item = new replayItem();

		var callStack = new Error().stack;
		var splliString = callStack.split("    at ")[2].split("(")[1].replace(")", "");
		item.infoString = splliString;

		item.replayFunction = function() {
			var e = {
				key: key
			};
			this.game.keydown(e);
		};
		_replayList.push(item);
	}

	keyUp(key) {
		var item = new replayItem();

		var callStack = new Error().stack;
		var splliString = callStack.split("    at ")[2].split("(")[1].replace(")", "");
		item.infoString = splliString;

		item.replayFunction = function() {
			var e = {
				key: key
			};
			this.game.keyup(e);
		};
		_replayList.push(item);
	}

	keyPress(key) {
		var item = new replayItem();

		var callStack = new Error().stack;
		var splliString = callStack.split("    at ")[2].split("(")[1].replace(")", "");
		item.infoString = splliString;

		item.replayFunction = function() {
			var e = {
				key: key
			};
			this.game.keypress(e);
		};
		_replayList.push(item);
	}

	keyPressAndWait(key, cycle) {
		var item = new replayItem();

		var callStack = new Error().stack;
		var splliString = callStack.split("    at ")[2].split("(")[1].replace(")", "");
		item.infoString = splliString;

		item.replayFunction = function() {
			var e = {
				key: key
			};
			keyDown(e);
			waitFor(cycle);
			keyUp(e);
		};
		_replayList.push(item);
	}

	ready(scriptInfo) {
		console.log('%c ----------------------------', GREEN_LOG);
		//console.log('%c Run Test:' + scriptInfo.name,GREEN_LOG);
		this._isReady = true;
		this._isTestEnd = false;
		this.game.resume();
	}

	setGameReady() {
		if (this.useGoToLevel) {
			this.useGoToLevel = false;
			this.ready();
		} else {
			this.startQunit();
			this.ready();
		}
	}

	start() {
		stopQunit();
		this.game._isTestReady = true;
		this.game._currentLevel = null;
		this.game.start();
		console.log('set up test');
	}

	stop() {
		this.game.stop();
		console.log('tear down test');
	}

	goToLevel(levelName) {
		var item = new replayItem();

		var callStack = new Error().stack;
		var splliString = callStack.split("    at ")[2].split("(")[1].replace(")", "");
		item.infoString = splliString;

		item.replayFunction = function() {
			_isReady = false;
			useGoToLevel = true;
			this.game.goToLevel(levelName);
		};
		_replayList.push(item);
	}

	executeFunction(functionName) {
		var item = new replayItem();

		var callStack = new Error().stack;
		var splliString = callStack.split("    at ")[2].split("(")[1].replace(")", "");
		item.infoString = splliString;

		item.replayFunction = function() {
			evaluate(functionName);
		};
		_replayList.push(item);
	}

	setFPS(fps) {
		var item = new replayItem();

		var callStack = new Error().stack;
		var splliString = callStack.split("    at ")[2].split("(")[1].replace(")", "");
		item.infoString = splliString;

		item.replayFunction = function() {
			this.game.setUpdateFPS(fps);
			this.game.setDrawFPS(fps);
		};
		_replayList.push(item);
	}

	resetFPS() {
		var item = new replayItem();

		var callStack = new Error().stack;
		var splliString = callStack.split("    at ")[2].split("(")[1].replace(")", "");
		item.infoString = splliString;

		item.replayFunction = function() {
			this.game.setUpdateFPS(this.game._config.fps);
			this.game.setDrawFPS(this.game._config.fps);
		};
		_replayList.push(item);
	}

	startQunit() {
		if (!this._qUnitStarting) {
			this._qUnitStarting = true;
			// QUnit.start();
		}
	}

	stopQunit() {
		if (this._qUnitStarting) {
			this._qUnitStarting = false;
			// QUnit.stop();
		}
	}
}

module.exports = Replay;