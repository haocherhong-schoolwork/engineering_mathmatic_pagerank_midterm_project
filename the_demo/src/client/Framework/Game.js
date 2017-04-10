console.log('loading Game');

const Config = require('./Config.js'),
	BaseObject = require('./BaseObject.js'),
	FpsAnalysis = require('./FpsAnalysis.js'),
	Record = require('./Record.js'),
	Replay = require('./Replay.js'),
	Input = require('./Input.js'),
	Screen = require('./Screen.js'),
	Time = require('./Time.js'),
	ResourceManager = require('./ResourceManager.js'),
	TouchManager = require('./InputManagers/TouchManager.js'),
	MouseManager = require('./InputManagers/MouseManager.js'),
	KeyBoardManager = require('./InputManagers/KeyBoardManager.js'),
	Util = require('./Util.js');

/**
 * 整個遊戲(多個{{#crossLink "Level"}}{{/crossLink}})的主體
 * 主要功能為新增移除關卡與關卡的切換
 * @class Game
 */
class Game {
	constructor() {

		// gameloop fps
		this.fps = Config.fps;
		this.canvasWidth = Config.canvasWidth;
		this.canvasHeight = Config.canvasHeight;
		this.isBackwardCompatiable = true;

		this._widthRatio = 1;
		this._heightRatio = 1;

		this._isRecording = false;
		this._isRecordMode = Config._isRecordMode;
		this._isTestMode = Config._isTestMode;
		this._isTestReady = false;
		this._isReplay = false;

		this.isContinue = false;
		this._isInit = false;
		// gameloop is running ?
		this._isRun = false;
		// show fps's div
		this._fpsContext = undefined;
		// FPS analysis object
		this._fpsAnalysis = new FpsAnalysis();
		this._drawfpsAnalysis = new FpsAnalysis();
		// for gameloop -
		this._runInstance = undefined;
		// game state
		this._levels = [];
		this._testScripts = [];
		// current level
		this._currentLevel = undefined;
		this._context = null;
		this._currentTestScript = undefined;
		this._currentReplay = undefined;

		this._ideaWidth = 16;
		this._ideaHeight = 9;
		this.timelist = [];
		this._record = new Record();

		this._mainContainer = document.getElementById('main-container') || document.createElement('div');
		this._mainContainer.style.height = '100%';
		this._mainContainer.style.backgroundColor = '#000';
		
		this._canvasContainer = document.createElement('div');
		this._canvasContainer.style.textAlign = 'center';
		this._canvasContainer.style.verticalAlign = 'middle';

		this._canvas = document.createElement('canvas');
		this._canvas.style.backgroundColor = '#fff';
		this._canvas.setAttribute('id', '__game_canvas__');
		this._canvas.width = Config.canvasWidth;
		this._canvas.height = Config.canvasHeight;

		this._canvasContainer.appendChild(this._canvas);
		this._mainContainer.appendChild(this._canvasContainer);
		this._context = this._canvas.getContext('2d');

		//Render quality
		this._context.webkitImageSmoothingEnabled = false;
		this._context.mozImageSmoothingEnabled = false;
		this._context.imageSmoothingEnabled = false;

		//Default font
		this._context.font ='32px Visitor';

		this.stopLoop = this.stopAnimationFrame;

		this.TouchManager = TouchManager(this);
		this.MouseManager = MouseManager(this);
		this.KeyBoardManager = KeyBoardManager(this);

		this.Replay = new Replay(this);

		this.click = this.click.bind(this);
		this.mousedown = this.mousedown.bind(this);
		this.mouseup = this.mouseup.bind(this);
		this.keydown = this.keydown.bind(this);
		this.keyup = this.keyup.bind(this);
		this.resizeEvent = this.resizeEvent.bind(this);

		//Init static classes
		Screen._canvas = this._canvas;
		Time._init();

		Game._instance = this;
	}

	static get instance() {
		return Game._instance;
	}

	get canvasSize() {
		return {
			width: this._canvas.width,
			height: this._canvas.height
		}
	}

	_tempUpdate() {

	}

	_tempDraw(context) {

	}

	recordStart() {
		if (document.getElementById("start_btn").getAttribute("enable") == "true") {
			if (this._isRecordMode) {
				this._isRecording = true;
				document.getElementById("start_btn").setAttribute("enable", "false");
				document.getElementById("pause_btn").setAttribute("enable", "true");
				document.getElementById("stop_btn").setAttribute("enable", "true");
				document.getElementById("type_btn").setAttribute("enable", "true");
				document.getElementById("replay_btn").setAttribute("enable", "true");
				document.getElementById("variable_btn").setAttribute("enable", "false");
				this.btnEnable();
				this._record.start();
				this.resume();
			}
			if (this._isReplay) {
				this.isContinue = true;
				this._isRecordMode = true;
				document.getElementById("start_btn").setAttribute("enable", "false");
				document.getElementById("pause_btn").setAttribute("enable", "true");
				document.getElementById("stop_btn").setAttribute("enable", "true");
				document.getElementById("type_btn").setAttribute("enable", "true");
				document.getElementById("replay_btn").setAttribute("enable", "true");
				document.getElementById("variable_btn").setAttribute("enable", "false");
				this.btnEnable();
			}
		}
	}

	recordPause() {
		if (document.getElementById("pause_btn").getAttribute("enable") == "true") {
			if (this._isRecordMode) {
				this._isRecording = false;
				document.getElementById("start_btn").setAttribute("enable", "true");
				document.getElementById("pause_btn").setAttribute("enable", "false");
				document.getElementById("stop_btn").setAttribute("enable", "true");
				document.getElementById("type_btn").setAttribute("enable", "true");
				document.getElementById("replay_btn").setAttribute("enable", "false");
				document.getElementById("variable_btn").setAttribute("enable", "true");
				this.btnEnable();
				this._record.pause();
				this.pause();
			}
		}
	}

	recordStop() {
		if (document.getElementById("stop_btn").getAttribute("enable") == "true") {
			if (this._isRecordMode) {
				this._isRecording = false;
				document.getElementById("start_btn").setAttribute("enable", "false");
				document.getElementById("pause_btn").setAttribute("enable", "false");
				document.getElementById("stop_btn").setAttribute("enable", "false");
				document.getElementById("type_btn").setAttribute("enable", "false");
				document.getElementById("replay_btn").setAttribute("enable", "true");
				document.getElementById("variable_btn").setAttribute("enable", "false");
				this.btnEnable();
				this._record.stop();
			}
		}
	}

	recordInput() {
		if (document.getElementById("type_btn").getAttribute("enable") == "true") {
			var command = prompt("Please enter comment", "");

			if (command != null) {
				this._record.inputCommand("//" + command);
			}
		}
	}

	recordReplay() {
		if (document.getElementById("replay_btn").getAttribute("enable") == "true") {
			this._isReplay = true;
			this._teardown();
			this._currentLevel = null;
			this._isRecordMode = false;
			this._isTestMode = true;
			this._record.isRecording = false;
			this.isContinue = false;
			var replayScript = document.getElementById("record_div").innerText;
			document.getElementById("record_div").innerText = "";

			this.getReplayScript(replayScript);
			this._record.start();
			this.start();
			this._isRecording = true;
			if (document.getElementById("variable_list") != null) {
				var div = document.getElementById("variable_list");
				div.parentNode.removeChild(div);
			}
			document.getElementById("start_btn").setAttribute("enable", "true");
			document.getElementById("pause_btn").setAttribute("enable", "false");
			document.getElementById("stop_btn").setAttribute("enable", "false");
			document.getElementById("type_btn").setAttribute("enable", "true");
			document.getElementById("replay_btn").setAttribute("enable", "false");
			document.getElementById("variable_btn").setAttribute("enable", "false");
			this.btnEnable();
		}
	}

	getReplayScript(script) {
		script = script.replace(/\n/g, "");
		var start = script.indexOf("{", 0) + 1;
		var end = script.indexOf("}", 0);
		if (end === -1)
			end = script.length;
		var mainScript = script.substring(start, end);
		mainScript = mainScript.split(";");
		for (i = 0; i < mainScript.length; i++) {
			mainScript[i] = mainScript[i].replace("\u00a0\u00a0\u00a0\u00a0", "");
			// if(mainScript[i].indexOf("//", 0) === -1){
			if (mainScript[i].indexOf("replay.assertEqual") != 0) {
				eval(mainScript[i]);
			}
			// }
		}
	}

	// recordContinue() {
	// this.isContinue = true;
	// document.getElementById("start_btn").setAttribute("enable", "false");
	// document.getElementById("pause_btn").setAttribute("enable", "true");
	// document.getElementById("stop_btn").setAttribute("enable", "true");
	// document.getElementById("type_btn").setAttribute("enable", "true");
	// document.getElementById("replay_btn").setAttribute("enable", "true");
	// document.getElementById("continue_btn").setAttribute("enable", "false");
	// document.getElementById("variable_btn").setAttribute("enable", "false");
	// this.btnEnable();
	// };

	showVariable() {
		var maindiv = document.getElementById("main");
		if ((document.getElementById("variable_list") == null) &&
			(document.getElementById("variable_btn").getAttribute("enable") == "true")) {
			var variableDiv = document.createElement('div');
			variableDiv.id = 'variable_list';
			variableDiv.style.cssText = "width:100%;height:30%;background-color:#d3e0e6;overflow:auto;font-size:20;";
			maindiv.appendChild(variableDiv);
		} else {
			var div = document.getElementById("variable_list");
			if (div != null) {
				div.parentNode.removeChild(div);
			}
		}
		listMember("Framework.Game._currentLevel", "&nbsp", "variable_list");
	}

	btnMouseOver(button) {
		if (button.getAttribute('enable') === "true") {
			if (button.id == "start_btn")
				button.src = "../../src/image/play_over.png";
			if (button.id == "pause_btn")
				button.src = "../../src/image/pause_over.png";
			if (button.id == "stop_btn")
				button.src = "../../src/image/stop_over.png";
			if (button.id == "type_btn")
				button.src = "../../src/image/addComment_over.png";
			if (button.id == "replay_btn")
				button.src = "../../src/image/replay_over.png";
			if (button.id == "variable_btn")
				button.src = "../../src/image/variable_over.png";
		}
	}

	btnMouseOut(button) {
		if (button.getAttribute('enable') === "true") {
			if (button.id == "start_btn")
				button.src = "../../src/image/play.png";
			if (button.id == "pause_btn")
				button.src = "../../src/image/pause.png";
			if (button.id == "stop_btn")
				button.src = "../../src/image/stop.png";
			if (button.id == "type_btn")
				button.src = "../../src/image/addComment.png";
			if (button.id == "replay_btn")
				button.src = "../../src/image/replay.png";
			if (button.id == "variable_btn")
				button.src = "../../src/image/variable.png";
		}
	}

	btnEnable() {
		if (document.getElementById("start_btn").getAttribute("enable") === "true")
			document.getElementById("start_btn").src = "../../src/image/play.png";
		else
			document.getElementById("start_btn").src = "../../src/image/play_disable.png";

		if (document.getElementById("pause_btn").getAttribute("enable") === "true")
			document.getElementById("pause_btn").src = "../../src/image/pause.png";
		else
			document.getElementById("pause_btn").src = "../../src/image/pause_disable.png";

		if (document.getElementById("stop_btn").getAttribute("enable") === "true")
			document.getElementById("stop_btn").src = "../../src/image/stop.png";
		else
			document.getElementById("stop_btn").src = "../../src/image/stop_disable.png";

		if (document.getElementById("type_btn").getAttribute("enable") === "true")
			document.getElementById("type_btn").src = "../../src/image/addComment.png";
		else
			document.getElementById("type_btn").src = "../../src/image/addComment_disable.png";

		if (document.getElementById("replay_btn").getAttribute("enable") === "true")
			document.getElementById("replay_btn").src = "../../src/image/replay.png";
		else
			document.getElementById("replay_btn").src = "../../src/image/replay_disable.png";

		if (document.getElementById("variable_btn").getAttribute("enable") === "true")
			document.getElementById("variable_btn").src = "../../src/image/variable.png";
		else
			document.getElementById("variable_btn").src = "../../src/image/variable_disable.png";
	}

	//Event Handler
	// mouse event
	click(e) {
		this._currentLevel.click(e);
		if (this._isRecording) {
			this._record.click(e);
		}
	}

	mousedown(e) {
		Input._setDown(e.e.button);
		if (this._isRecording) {
			this._record.mousedown(e);
		}
	}

	mouseup(e) {
		Input._setUp(e.e.button);
		if (this._isRecording) {
			this._record.mouseup(e);
		}
	}

	mousemove(e) {
		Input._setMousePosition(e.x, e.y);
		if (this._isRecording) {
			this._record.mousemove(e);
		}
	}

	// touch event
	touchstart(e) {
		this._currentLevel.touchstart(e);
	}

	touchend(e) {
		this._currentLevel.touchend(e);
	}

	touchmove(e) {
		this._currentLevel.touchmove(e);
	}

	//keyboard Event
	keydown(e) {
		Input._setDown(e.key);
		this._currentLevel.keydown(e);
		if (this._isRecording) {
			this._record.keydown(e);
			//console.log("record down");
		}
	}

	keyup(e) {
		Input._setUp(e.key);
		this._currentLevel.keyup(e);
		if (this._isRecording) {
			this._record.keyup(e);
		}
	}

	keypress(e) {
		this._currentLevel.keypress(e);
		if (this._isRecording) {
			this._record.keypress(e);
		}
	}

	initializeProgressResource() {
		this._currentLevel._initializeProgressResource();
	}

	load() {
		this._currentLevel._load();
		if (this.isBackwardCompatiable) {
			this._currentLevel.initialize();
		}
	}

	loadingProgress(context) {
		this._currentLevel._loadingProgress(context, {
			request: ResourceManager.getRequestCount(),
			response: ResourceManager.getResponseCount(),
			percent: ResourceManager.getFinishedRequestPercent()
		});
		if (this.isBackwardCompatiable) {
			this.initializeProgressResource();
		}
	}

	initialize() {
		this._currentLevel._initialize();
		this.initializeTestScript(this._currentLevel);
	}

	initializeTestScript(level) {
		//this._testScripts
		var levelName = this._findLevelNameByLevel(level);
		for (var i = 0, l = this._testScripts.length; i < l; i++) {
			if (this._testScripts[i].targetLevel === levelName) {
				this.Replay.ready(this._testScripts[i]);
				return;
			}
		}
	}

	update() {
		this._currentLevel._update();
	}

	draw() {
		this._currentLevel._draw();
	}

	_teardown() {
		//if(this._currentLevel.autoDelete){
		BaseObject.destroy(this._currentLevel);
		this._isInit = false;
		//    this._allGameElement.length = 0;
		// }
	}

	stop() {
		this.pause();
		this._teardown();
	}

	getCanvasWidth() {
		return this._canvas.width;
	}

	getCanvasHeight() {
		return this._canvas.height;
	}

	_findLevel(name) {
		var result = Util.findValueByKey(this._levels, name);

		if (result === null) {
			return null;
		} else {
			return result.level;
		}
	}

	_findScript(name) {
		var result = Util.findValueByKey(this._testScripts, name);

		if (result === null) {
			return null;
		} else {
			return result.script;
		}
	}

	_findLevelNameByLevel(level) {
		for (var i = 0, l = this._levels.length; i < l; i++) {
			if (this._levels[i].level === level) {
				return this._levels[i].name;
			}
		}
	}

	/**
	 * 加入一個新的關卡	
	 * @method addNewLevel
	 * @static
	 * @param {Object} levelData { 關卡名稱: 關卡的instance }
	 * @example
	 * 	Framework.Game.addNewLevel({menu: new MyMenu()});	//MyMen繼承自Level
	 */
	addNewLevel(leveldata) {
		//console.dir(leveldata);
		for (var i in leveldata) {
			if (leveldata.hasOwnProperty(i)) {
				if (Util.isNull(this._findLevel(i))) {
					this._levels.push({
						name: i,
						level: leveldata[i]
					});
				} else {
					// DebugInfo.Log.error('Game : 關卡名稱不能重複');
					throw new Error('Game: already has same level name');
				}
			}
		}
	};

	addNewTestScript(levelName, scriptName, scriptInstance) {

		var levelName = levelName;
		var scriptName = scriptName;
		var scriptInstance = scriptInstance;


		if (Util.isNull(this._findScript(scriptName))) {
			this._testScripts.push({
				targetLevel: levelName,
				name: scriptName,
				script: scriptInstance
			});
		} else {
			// DebugInfo.Log.error('Game : Script名稱不能重複');
			throw new Error('Game: already has same script name');
		}
	}

	/**
	 * 前往另一個關卡(前後皆可), 若沒有該關卡, 會throw exception	
	 * @method goToLevel
	 * @static
	 * @param {Object} levelName 關卡名稱
	 * @example
	 * 	Framework.Game.goToLevel('menu');
	 */
	goToLevel(levelName) {
		this.pause();
		this._teardown();
		this._currentLevel = this._findLevel(levelName);
		this.Replay.resetCycleCount();
		if (Util.isUndefined(this._currentLevel)) {
			// DebugInfo.Log.error('Game : 找不到關卡');
			throw new Error('Game : levelname not found.');
		}
		if (this._isRecordMode) {
			this._record.inputCommand("// Change Level :" + levelname + ";");
		}
		this.start();
	};

	/**
	 * 前往下一個關卡, 若沒有下一個關卡, 會throw exception	
	 * @method goToNextLevel
	 * @static
	 * @example
	 * 	Framework.Game.goToNextLevel();
	 */
	goToNextLevel() {
		this.pause();
		this._teardown();
		var flag = false;
		this.Replay.resetCycleCount();
		for (var i in this._levels) {
			if (flag) {
				this._currentLevel = this._levels[i].level;
				if (this._isRecordMode) {
					var levelname = this._findLevelNameByLevel(this._currentLevel);
					this._record.inputCommand("// Change Level :" + levelname + ";");
				}
				this.start();
				return;
			}
			if (this._levels[i].level === this._currentLevel) {
				flag = true;
			}
		}
		// DebugInfo.Log.error('Game : 無下一關');
		throw new Error('Game : can\'t goto next level.');
	};

	/**
	 * 前往前一個關卡, 若沒有前一個關卡, 會throw exception	
	 * @method goToPreviousLevel
	 * @static
	 * @example
	 * 	Framework.Game.goToPreviousLevel();
	 */
	goToPreviousLevel() {
		this.pause();
		this._teardown();
		var flag = false;
		var prev = undefined;
		this.Replay.resetCycleCount();
		for (var i in this._levels) {
			if (this._levels[i].level === this._currentLevel) {
				if (!Util.isUndefined(prev)) {
					this._currentLevel = prev;
					if (this._isRecordMode) {
						var levelname = this._findLevelNameByLevel(this._currentLevel);
						this._record.inputCommand("// Change Level To : " + levelname + ";");
					}
					this.start();
					return;
				}
				break;
			}
			prev = this._levels[i].level;
		}
		// DebugInfo.Log.error('Game : 無前一關');
		throw new Error('Game : can\'t goto previous level.');
	};


	/**
	 * 讓遊戲開始執行
	 * @method start
	 * @static
	 * @example
	 * 	Framework.Game.start();
	 */
	start() {
		if (!this._isReplay) {
			if (this._isTestMode && this._isTestReady === false) {
				return;
			}
		}
		if (Util.isUndefined(this._currentLevel) || Util.isNull(this._currentLevel)) {
			this._currentLevel = this._levels[0].level;
		}
		var self = this;

		if (!this._isInit) {
			this.resizeEvent();
			if(!this._mainContainer.parentElement)
				document.body.appendChild(this._mainContainer);
			window.addEventListener("resize", this.resizeEvent, false);
		}

		this._tempDraw = self._currentLevel._draw;
		this._tempUpdate = self._currentLevel._update;
		this.initializeProgressResource();


		var runFunction = function() {
			self._isRun = true;
			self.pause();
			self.initialize();
			//bind會產生一個同樣的function, 但this為指定的參數
			self.draw = self._tempDraw.bind(self._currentLevel);
			self.update = self._tempUpdate.bind(self._currentLevel);
			this.Replay.setGameReady();
			self.run();
		}.bind(this);

		var initFunction = function() {
			if (ResourceManager.getRequestCount() !== ResourceManager.getResponseCount()) {
				return;
			}
			self._isInit = true;
			self.draw = self.loadingProgress;
			self.update = function() {};
			self.run();
			self._isRun = false;
			self.load();
			if (ResourceManager.getRequestCount() === ResourceManager.getResponseCount()) {
				runFunction();
			}
		};

		ResourceManager.setSubjectFunction(function() {
			if (!self._isInit) {
				initFunction();
				return;
			}
			if (!self._isRun) {
				runFunction();
			}
		});


		//if(ResourceManager.getRequestCount() === 0) {
		initFunction();
		//}
		//

		this.TouchManager.setSubject(self._currentLevel);
		this.TouchManager.setTouchstartEvent(self._currentLevel.touchstart);
		this.TouchManager.setTouchendEvent(self._currentLevel.touchend);
		this.TouchManager.setTouchmoveEvent(self._currentLevel.touchmove);

		this.MouseManager.setSubject(self._currentLevel);
		this.MouseManager.setClickEvent(self.click);
		this.MouseManager.setMousedownEvent(self.mousedown);
		this.MouseManager.setMouseUpEvent(self.mouseup);
		this.MouseManager.setMouseMoveEvent(self.mousemove);
		//this.MouseManager.setContextmenuEvent(self._currentLevel.contextmenu);

		this.KeyBoardManager.setSubject(self._currentLevel);
		this.KeyBoardManager.setKeyupEvent(self.keyup);
		this.KeyBoardManager.setKeydownEvent(self.keydown);

	};

	run() {
		var self = this,
			nowFunc = function() {
				return (new Date()).getTime();
			},
			updateTicks = 1000 / this.fps,
			drawTicks = 1000 / this.fps,
			previousUpdateTime = nowFunc(),
			previousDrawTime = previousUpdateTime,
			now = previousDrawTime;

		var nextGameTick = now,
			nextGameDrawTick = now;
		this.skipTicks = Math.round(1000 / this.fps);

		var updateFunc = function() {
			now = nowFunc();
			if (now > nextGameTick) {
				//console.log('now: ' + now + ', nextGameTick: ' + nextGameTick + ', diff:' + (now-nextGameTick));	
				this._fpsAnalysis.update();
				// show FPS information
				if (this.fpsContext) {
					this.fpsContext.innerHTML = 'update FPS:' + this._fpsAnalysis.getUpdateFPS() + '<br />draw FPS:' + this._drawfpsAnalysis.getUpdateFPS();
				}

				//Update static classes
				Input._update();
				Time._update();

				// run Game's update
				this.update();

				if (this._isRecording) {
					this._record.update();
					//console.log("record update")
				}
				this.Replay.update();
				nextGameTick += this.skipTicks;
			}
		}.bind(this);

		var drawFunc = function() {
			if (now >= nextGameDrawTick) {
				this.draw(this._context);
				this._drawfpsAnalysis.update();
				if (this.fpsContext) {
					this.fpsContext.innerHTML = 'update FPS:' + this._fpsAnalysis.getUpdateFPS() + '<br />draw FPS:' + this._drawfpsAnalysis.getUpdateFPS();
				}
				nextGameDrawTick += this.skipTicks;
			}
		}.bind(this);

		var gameLoopFunc = function() {

			var preDraw = Date.now();
			updateFunc();
			drawFunc();

			var drawTime = Date.now() - preDraw;
			if (drawTime > 5) {
				this.timelist.push(drawTime);
			}
			if (this.timelist.length >= 30) {
				var average = this.countAverage(this.timelist);
				this.timelist = [];
				//console.log("game loop time average " + average);
			}
		}.bind(this);

		this._isRun = true;
		this.runAnimationFrame(gameLoopFunc);
	};

	countAverage(list) {
		var sum = 0;
		for (var i = 0; i < list.length; i++) {
			sum += list[i];
		}
		return sum / list.length;
	};

	stopInterval() {
		clearInterval(this._runInstance);
	};

	stopAnimationFrame() {
		cancelAnimationFrame(this._runInstance);
	};

	runAnimationFrame(gameLoopFunc) {
		/*if(!Util.isUndefined(this._runInstance)) {
			this.stopAnimationFrame();
		}*/
		// dynamic product runnable function
		window.requestAnimationFrame = window.requestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.msRequestAnimationFrame;

		var then = Date.now(),
			startTime = then,
			frameCount = 0,
			fpsInterval = 1000 / this.fps;

		var _run = function() {
			if (this._isRun) {
				this._runInstance = requestAnimationFrame(_run);
				var now = Date.now(),
					elasepd = now - then;

				if(elasepd > fpsInterval) {
					then = now - (elasepd % fpsInterval);
					gameLoopFunc();

					// var sinceStart = now - startTime;
			  //       var currentFps = Math.round(1000 / (sinceStart / ++frameCount) * 100) / 100;
			        // console.log(currentFps);
				}
			}
		}.bind(this);
		_run();
		this.stopLoop = this.stopAnimationFrame;
	}; /**/

	runInterval(gameLoopFunc) {
		/*if(!Util.isUndefined(this._runInstance)) {
			this.stopInterval();
			this._runInstance = null;
		}*/
		// dynamic product runnable function
		var drawTicks = 1000 / this.fps;
		var _run = gameLoopFunc
			/*function () {
							gameLoopFunc.call(this);
						};*/

		this._runInstance = setInterval(gameLoopFunc, drawTicks);
		this.stopLoop = this.stopInterval;
	};

	pause() {
		if (this._isRun) {
			this.stopLoop();
			this._runInstance = null;
			this._isRun = false;
		}
	};

	resume() {
		if (!this._isRun) {
			this.run();
		}
	};

	// propetity
	setUpdateFPS(fps) {
		if (fps > 60) {
			// DebugInfo.Log.warring('FPS must be smaller than 60.');
			throw 'FPS must be smaller than 60.';
			fps = 60;
		}
		this.skipTicks = Math.round(1000 / this.fps);
		this.fps = fps;
		this.pause();
		this.run();
	};

	getUpdateFPS() {
		return this.fps;
	};

	setDrawFPS(fps) {
		if (fps > 60) {
			// DebugInfo.Log.warring('FPS must be smaller than 60.');
			throw 'FPS must be smaller than 60.';
			fps = 60;
		}
		this.fps = fps;
		this.pause();
		this.run();
	};

	getDrawFPS() {
		return this.fps;
	};

	setCanvas(canvas) {
		if (canvas) {
			this._canvas = null;
			this._context = null;
			this._canvas = canvas;
			this._canvasContainer.innerHTML = '';
			this._canvasContainer.appendChild(this._canvas);
			this._context = this._canvas.getContext('2d');
		}
	};

	setContext(context) {
		if (!Util.isUndefined(context)) {
			this.context = null;
			this._canvas = null;
			this.context = context;
		} else {
			// DebugInfo.Log.error('Game SetContext Error')
			throw new Error('Game SetContext Error')
		}
	};

	getContext() {
		return this.context;
	};


	/**
	 * 讓任何一個在網頁上的元件得以全螢幕, 一定要在有使用者可以觸發的事件內撰寫, 例如: 
	 * {{#crossLink "Level/click:event"}}{{/crossLink}},
	 * {{#crossLink "Level/mousedown:event"}}{{/crossLink}},
	 * {{#crossLink "Level/mouseup:event"}}{{/crossLink}},
	 * {{#crossLink "Level/mousemove:event"}}{{/crossLink}},
	 * {{#crossLink "Level/touchstart:event"}}{{/crossLink}},
	 * {{#crossLink "Level/touchmove:event"}}{{/crossLink}},
	 * {{#crossLink "Level/keydown:event"}}{{/crossLink}},
	 * {{#crossLink "Level/keyup:event"}}{{/crossLink}}
	 * 否則會無法全螢幕
	 * @method fullScreen
	 * @param {Object} ele 要被全螢幕的DOM, 若不設定則為遊戲的CANVAS
	 * @static
	 * @example
	 * 	Framework.Game.fullScreen();
	 */
	fullScreen(ele) {
		var ele = ele || this._canvas;
		if (!ele.fullscreenElement && // alternative standard method
			!ele.mozFullScreenElement &&
			!ele.webkitFullscreenElement &&
			!ele.msFullscreenElement) { // current working methods
			if (ele.requestFullscreen) {
				ele.requestFullscreen();
			} else if (ele.msRequestFullscreen) {
				ele.msRequestFullscreen();
			} else if (ele.mozRequestFullScreen) {
				ele.mozRequestFullScreen();
			} else if (ele.webkitRequestFullscreen) {
				ele.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
			}
			//ele.style.width = '100%'//window.innerWidth;
			//ele.style.height = '100%'//window.innerHeight;			
		}
	};

	/**
	 * 退出全螢幕	
	 * @method exitFullScreen
	 * @static
	 * @example
	 * 	Framework.Game.exitFullScreen();
	 */
	exitFullScreen() {
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.msExitFullscreen) {
			document.msExitFullscreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		}
	};

	resizeEvent() {
		var base = 0,
			baseWidth = window.innerWidth / this._ideaWidth,
			baseHeight = window.innerHeight / this._ideaHeight,
			scaledWidth = 0,
			scaledHeight = 0;
		if (this._isTestMode || this._isRecordMode) {
			baseWidth = window.innerWidth * 0.7 / this._ideaWidth;
			baseHeight = window.innerHeight * 0.7 / this._ideaHeight;
		}
		if (baseWidth < baseHeight) {
			base = baseWidth;
		} else {
			base = baseHeight;
		}

		scaledWidth = Math.round(base * this._ideaWidth);
		scaledHeight = Math.round(base * this._ideaHeight);
		this._widthRatio = scaledWidth / this._canvas.width;
		this._heightRatio = scaledHeight / this._canvas.height;
		//this._canvasContainer.style.width = scaledWidth;
		//this._canvasContainer.style.height = scaledHeight;
		this._canvas.style.width = scaledWidth + 'px'; // 2017.02.20, from V3.1.1
		this._canvas.style.height = scaledHeight + 'px'; // 2017.02.20, from V3.1.1

	};

	// _pushGameObj(ele, level) {
	// 	if(level)
	// 		level._allGameElement.push(ele);
	// 	else
	// 		this._currentLevel._allGameElement.push(ele);
	// };

	_showAllElement() {
		this._currentLevel._showAllElement();
	};
}

listMember = function(main, space, divId) {
	if (document.getElementById(divId + "_check")) {
		if (document.getElementById(divId + "_check").src.match("../../src/image/arrow_over.png")) {
			document.getElementById(divId + "_check").src = "../../src/image/arrow.png";
		} else {
			document.getElementById(divId + "_check").src = "../../src/image/arrow_over.png";
		}
	}
	var div = document.getElementById(divId);
	//	var length = div.childNodes.length;
	var length = 0;
	if ((div != null) && (div.childNodes != null)) {
		length = div.childNodes.length;
	}
	if (length > 4) {
		for (var i = 4; i < length; i++) {
			div.removeChild(div.childNodes[4]);
		}
	} else {
		for (key in eval(main)) {
			//not function
			try {
				if (eval(main)[key].toString().indexOf("function", 0) === -1) {
					if (key != "rootScene" && key != "autoDelete" && key != "_firstDraw" && key != "_allGameElement") {
						var varDiv = document.createElement("div");
						varDiv.id = key;
						varDiv.setAttribute("vertical-align", "baseline");
						var checkBox = document.createElement("img");
						checkBox.setAttribute("src", "../../src/image/arrow.png");
						checkBox.setAttribute("width", "5%");
						checkBox.setAttribute("id", key + "_check");
						if (isNaN(key)) {
							var func = 'listMember("' + main.toString() + '.' + key.toString() + '", "' + space + "&nbsp&nbsp&nbsp" + '", "' + key + '")';
						} else {
							var func = 'listMember("' + main.toString() + '[' + key.toString() + ']", "' + space + "&nbsp&nbsp&nbsp" + '", "' + key + '")';
						}
						checkBox.setAttribute("onclick", func);
						varDiv.innerHTML += space;
						varDiv.appendChild(checkBox);
						varDiv.innerHTML += key + "&nbsp&nbsp&nbsp";
						if (!isNaN(eval(main)[key])) {
							var btn = document.createElement("input");
							btn.setAttribute("type", "button");
							btn.value = "Assert";
							var func = 'addAssertion("' + main.toString() + '.' + key.toString() + '","' + eval(main)[key] + '")'
							btn.setAttribute("onclick", func);
							varDiv.appendChild(btn);
						}
						varDiv.innerHTML += "<br>";
						div.appendChild(varDiv);
						// console.log(key + ": " + eval(main)[key] + "\n");
					}
				}
			} catch (e) {

			}
		}
		space += "&nbsp&nbsp&nbsp";
	}
};

addAssertion = function(assertTarget, assertValue) {
	// var s = assertTarget.indexOf("Framework.Game._currentLevel.")
	assertTarget = assertTarget.substring(29, assertTarget.length);
	var recordDiv = document.getElementById("record_div");
	document.getElementById("record_div").innerHTML += '<p>&nbsp;&nbsp;&nbsp;&nbsp;replay.assertEqual("' + assertTarget + '", ' + assertValue + ');</p>';
};

console.log('Game loaded');

var instance = new Game();

module.exports = instance;