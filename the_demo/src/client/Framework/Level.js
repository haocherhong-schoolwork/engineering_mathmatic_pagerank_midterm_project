const Config = require('./Config.js'),
	Game = require('./Game.js'),
	BaseObject = require('./BaseObject.js'),
	GameObject = require('./GameObject.js'),
	Renderer = require('./Components/Renderer.js'),
	Camera = require('./Camera.js'),
	Debug = require('./Debug.js'),
	Box2D = require('./Physics/Box2D.js'),
	Physics = require('./Physics/Physics.js'),
	Collider = require('./Physics/Collider.js'),
	Util = require('./Util.js'),
	ResourceManager = require('./ResourceManager.js');

const rendererComparator = (a, b) => {
	return	(a.renderPriority - b.renderPriority) ||
			(a.referencePoint.multi(a.gameObject.absoluteScale).add(a.gameObject.absolutePosition).y - b.referencePoint.multi(b.gameObject.absoluteScale).add(b.gameObject.absolutePosition).y) ||
			(a.instanceId - b.instanceId);
}

class Level extends BaseObject {
	/**
	 * 遊戲關卡的Class, 一個Game中可能有無數個Level
	 * (當然Game的開始和結束頁面也可以是一個Level)
	 * 每個Level都會有 
	 * {{#crossLink "Level/initializeProgressResource:method"}}{{/crossLink}},
	 * {{#crossLink "Level/loadingProgress:method"}}{{/crossLink}},
	 * {{#crossLink "Level/initialize:method"}}{{/crossLink}},
	 * {{#crossLink "Level/update:method"}}{{/crossLink}},
	 * {{#crossLink "Level/draw:method"}}{{/crossLink}},
	 * 五個基本的生命週期
	 * @class Level
	 * @constructor 
	 * @example
	 *     new Framework.Level();
	 * 
	 */
	constructor() {
		/**
		 * 每個Level一定會有一個rootScene, 
		 * 建議所有的GameObject都應該要attach到rootScene上
		 * @property rootScene 
		 * @type Scene
		 */
		super('Level');
		// this._allGameElement = [];
		this.rootScene = new GameObject("Root");

		//Set rootScene's _level, all other gameobjects attached under rootScene will have a reference of this level automatically,
		//check the parent setter of GameObject
		this.rootScene._level = this;

		this._firstDraw = true;
		this.timelist = [];
		this.updatetimelist = [];
		this.cycleCount = 0;

		//Components
		this._newComponents = [];

		//Physics
		this._box2D = new Box2D();

		this._box2D.createWorld();
		this._box2D.setContactListener();
		this._box2D.initDebugDraw(Game._context);

		Physics._world = this._box2D.world;

		//Default Camera
		var mainCamera = new GameObject('Main Camera');
		mainCamera.parent = this.rootScene;
		mainCamera.addComponent(new Camera());
	}

	//Travel all gameObjects in scene and call func with the gameObject as first parameter
	_traversalAllElement(func, activeOnly) {
		this._traversalElement(this.rootScene, func, activeOnly);
	}

	_traversalElement(gameObject, func, activeOnly) {
		if(activeOnly && !gameObject.active)
			return;

		func(gameObject);

		for(var i = 0; i < gameObject.children.length; i++)
			this._traversalElement(gameObject.children[i], func, activeOnly);
	}

	//Get all renderers that is enabled and in camera rect
	_getRenderTargets(camera, gameObject = this.rootScene, result = []) {
		if(!gameObject.active)
			return;
		var renderer = gameObject.renderer;
		if(renderer && renderer.enabled) {
			var bounds = renderer.bounds;
			//Check if it's visible from camera
			if(camera.rect.intersect(bounds.scale(gameObject.absoluteScale).translate(gameObject.absolutePosition)))
				result.push(renderer);
		}
		for(var i = 0; i < gameObject.children.length; i++)
			this._getRenderTargets(camera, gameObject.children[i], result);
		
		return result;
	}

	_initializeProgressResource() {
		this.initializeProgressResource();
	}

	_load() {
		this.load();
	}

	_loadingProgress(ctx, requestInfo) {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		this.loadingProgress(ctx, requestInfo);
	}

	_initialize() {
		this.cycleCount = 0;
		this.initialize();
	}

	_update() {
		while(this._newComponents.length > 0) {
			var component = this._newComponents.shift();
			if(component.start.constructor.name === 'GeneratorFunction') {
				//Call start as coroutine
				component.startCoroutine(component.start);
			} else {
				component.start();
			}
			component._startCalled = true;
		}

		this.rootScene.clearDirtyFlag();
		this._traversalAllElement(function(ele) {
			ele.clearDirtyFlag();
		});

		var preDraw = Date.now();

		//Update Physics
		this._box2D.update();

		//Get all enabled components and colliders
		var allEnabledComponents = [],
			allEnabledColliders = [];
		this._traversalAllElement(function(gameObject) {
			gameObject._components.forEach((component)=>{
				if(!component.enabled)
					return;

				allEnabledComponents.push(component)

				if(component instanceof Collider)
					allEnabledColliders.push(component)
			})
		}, true);

		//Fire physics events
		allEnabledColliders.forEach(collider => {
			var gameObject = collider.gameObject;

			//Determine contact is new, old, or exited
			var lastContacts = collider._body.m_userData.lastContacts,
				contacts = [],
				enterContacts = [],
				stayContacts = [],
				exitContacts;

			var node = collider._body.GetContactList();
			while(node) {
				contacts.push(node.other);
				node = node.next;
			}

			for(var contact of contacts) {
				var index = lastContacts.indexOf(contact);
				if(index == -1) {
					//New Contact
					enterContacts.push(contact);
				} else {
					//Old Contact, remove from lastContacts list
					stayContacts.push(contact);
					lastContacts.splice(index, 1);
				}
			}
			//All contacts remains in lastContacts are contacts that exits
			exitContacts = lastContacts;

			//Save contacts to body
			collider._body.m_userData.lastContacts = contacts;

			//Fire onContactEnter event
			while(enterContacts.length > 0) {
				//Get and remove contact from the list
				var contact = enterContacts.shift();
				gameObject.sendMessage('onContactEnter', {
					collider: contact.m_userData.collider,
				})

			}

			//Fire onContactStay event
			while(stayContacts.length > 0) {
				//Get and remove contact from the list
				var contact = stayContacts.shift();
				gameObject.sendMessage('onContactStay', {
					collider: contact.m_userData.collider,
				})
			}

			//Fire onContactExit event
			while(exitContacts.length > 0) {
				//Get and remove contact from the list
				var contact = exitContacts.shift();
				gameObject.sendMessage('onContactExit', {
					collider: contact.m_userData.collider,
				})
			}
		})

		//Execute coroutines; fire update events
		allEnabledComponents.forEach(component => {
			component._executeCoroutines();
			component.update();
		})
		this.cycleCount++;
		this.update();

		var drawTime = Date.now() - preDraw;
		this.updatetimelist.push(drawTime);
		if (this.updatetimelist.length >= 30) {
			var average = this.countAverage(this.updatetimelist);
			this.updatetimelist = [];
			//console.log("update time average " + average);
		}
	}

	_draw(ctx) {
		if (true || this.canvasChanged) {
			var preDraw = Date.now();
			ctx.save();

			ctx.fillStyle = 'gray';
			ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

			var camera = Camera.main,
				cameraRect = camera.rect;

			//TODO: implement camera rotation
			ctx.translate(
				-camera.position.x + ctx.canvas.width / 2,
				-camera.position.y + ctx.canvas.height / 2
			);
			
			//Travel through all active renderers in scene and sort it before render
			var renderers = this._getRenderTargets(camera);

			//Sorting
			renderers.sort(rendererComparator).forEach((renderer)=>{
				//Render
				ctx.save();
				var gameObject = renderer.gameObject;
				ctx.translate(gameObject.absolutePosition.x, gameObject.absolutePosition.y);
				ctx.rotate(gameObject.absoluteRotation / 180 * Math.PI);
				ctx.scale(gameObject.absoluteScale, gameObject.absoluteScale);
				renderer.render(ctx);
				ctx.restore();
			})

			//Render Debug info
			if(Debug.renderDebugInfo)
				Debug._render(ctx, this);

			this.draw(ctx);

			var drawTime = Date.now() - preDraw;
			this.timelist.push(drawTime);
			if (this.timelist.length >= 30) {
				var average = this.countAverage(this.timelist);
				this.timelist = [];
				//console.log("draw time average " + average);
			}

			ctx.restore();
		}

	}

	countAverage(list) {
		var sum = 0;
		for (var i = 0; i < list.length; i++) {
			sum += list[i];
		}
		return sum / list.length;
	}

	_destroy() {
		BaseObject.destroy(this.rootScene);
	}

	_getChangedRect(maxWidth, maxHeight) {
		var rect = {
			x: maxWidth,
			y: maxHeight,
			x2: 0,
			y2: 0
		};

		this._traversalAllElement(function(ele) {
			if (ele.isObjectChanged) {
				var nowDiagonal = Math.ceil(Math.sqrt(ele.width * ele.width + ele.height * ele.height)),
					nowX = Math.ceil(ele.absolutePosition.x - nowDiagonal / 2),
					nowY = Math.ceil(ele.absolutePosition.y - nowDiagonal / 2),
					nowX2 = nowDiagonal + nowX,
					nowY2 = nowDiagonal + nowY,
					preDiagonal = Math.ceil(Math.sqrt(ele.previousWidth * ele.previousWidth + ele.previousHeight * ele.previousHeight)),
					preX = Math.ceil(ele.previousAbsolutePosition.x - preDiagonal / 2),
					preY = Math.ceil(ele.previousAbsolutePosition.y - preDiagonal / 2),
					preX2 = preDiagonal + preX,
					preY2 = preDiagonal + preY,
					x = (nowX < preX) ? nowX : preX,
					y = (nowY < preY) ? nowY : preY,
					x2 = (nowX2 > preX2) ? nowX2 : preX2,
					y2 = (nowY2 > preY2) ? nowY2 : preY2;

				if (x < rect.x) {
					rect.x = x;
				}

				if (y < rect.y) {
					rect.y = y;
				}

				if (x2 > rect.x2) {
					rect.x2 = x2;
				}

				if (y2 > rect.y2) {
					rect.y2 = y2;
				}
			}
		});

		rect.width = rect.x2 - rect.x;
		rect.height = rect.y2 - rect.y;

		return rect;
	}

	_showAllElement() {
		this._traversalAllElement(function(ele) {
			console.log(ele, "ele.isMove", ele._isMove, "ele.isRotate", ele._isRotate, "ele.isScale", ele._isScale, "ele.changeFrame", ele._changeFrame, "ele.isObjectChanged", ele.isObjectChanged);
		});
	}

	start() {
	}

	/**
	 * 初始化loadingProgress事件中會用到的圖片素材, 
	 * 建議降低此處要載入的圖片數量, 主要Game要用的圖片可以等到initialize再載入
	 * @method initializeProgressResource   
	 */
	initializeProgressResource() {

	}

	load() {

	}

	/**
	 * 在載入圖片資源時, 要被繪製的畫面, 當不設定時, 會有預設的顯示畫面
	 * 若不想要有該畫面, 可以override一個空的function
	 * @param {Object} context 用來繪製的工具
	 * @param {Object} requestInfo requestInfo.requset為發送request的數量, 
	 * requestInfo.response為已經有response的數量
	 * requestInfo.percent為已完成的百分比
	 * @method loadingProgress   
	 */
	loadingProgress(context, requestInfo) {
		context.font = '90px Arial';
		context.fillText(Math.floor(ResourceManager.getFinishedRequestPercent()) + '%', context.canvas.width / 2 - 50, context.canvas.height / 2);
	}

	/**
	 * 初始化整個Level, 並載入所有圖片資源
	 * @method initialize   
	 */
	initialize() {

	}

	/**
	 * 用來撰寫遊戲邏輯, 不會去處理繪製的工作
	 * 第一行必須撰寫 this.rootScene.update();
	 * @method update   
	 */
	update() {

	}

	/**
	 * 用來繪製需要被繪製的GameObject
	 * 第一行必須撰寫 this.rootScene.draw(context);
	 * @param {Object} context 用來繪製的工具
	 * @method draw   
	 */
	draw(context) {

	}

	/**
	 * 處理點擊的事件, 當mousedown + mouseup 都成立時才會被觸發
	 * @event click
	 * @param {Object} e 事件的參數, 會用到的應該是e.x和e.y兩個參數,
	 * 表示的是目前點擊的絕對位置
	 */
	click(e) {

	}

	/**
	 * 處理滑鼠點下的事件
	 * @event mousedown
	 * @param {Object} e 事件的參數, 會用到的應該是e.x和e.y兩個參數,
	 * 表示的是目前點擊的絕對位置
	 */
	mousedown(e) {

	}

	/**
	 * 處理滑鼠放開的事件
	 * @event mouseup
	 * @param {Object} e 事件的參數, 會用到的應該是e.x和e.y兩個參數,
	 * 表示的是目前放開的絕對位置
	 */
	mouseup(e) {

	}

	/**
	 * 處理滑鼠移動的事件(不論是否有點下, 都會觸發該事件)
	 * @event mousemove
	 * @param {Object} e 事件的參數, 會用到的應該是e.x和e.y兩個參數,
	 * 表示的是目前滑鼠的絕對位置
	 */
	mousemove(e) {

	}

	/**
	 * 處理觸控到螢幕時的事件, 若是在一般電腦上跑, 是不會觸發此事件的
	 * (除非使用debugger模擬, https://developers.google.com/chrome-developer-tools/docs/mobile-emulation?hl=zh-TW)
	 * @event touchstart
	 * @param {Object} e 事件的參數, 
	 * 會用到的應該是e.touches[0].clientX和e.touches[0].clientY兩個參數,
	 * 表示的是目前觸控到的位置
	 */
	touchstart(e) {

	}

	touchend(e) {

	}

	/**
	 * 處理觸控到螢幕並移動時的事件, 若是在一般電腦上跑, 是不會觸發此事件的
	 * (除非使用debugger模擬, https://developers.google.com/chrome-developer-tools/docs/mobile-emulation?hl=zh-TW)
	 * @event touchmove
	 * @param {Object} e 事件的參數, 
	 * 會用到的應該是e.touches[0].clientX和e.touches[0].clientY兩個參數,
	 * 表示的是目前最新觸控到的位置
	 */
	touchmove(e) {

	}

	/**
	 * 處理鍵盤被壓下按鈕的事件
	 * @event keydown
	 * @param {Object} e 改寫過後的事件的參數表示按下去的最後一個鍵, 其包含有
	 * altKey, ctrlKey, shiftKey表示是否按下的狀態,
	 * firstTimeStamp 表示剛按下去這個按鈕的時間, 
	 * key 存的是按下去的鍵的string, 
	 * lastTimeDiff 則為剛按下這個鍵到目前有多久了        
	 * @param {Object} list 目前按下去所有可以被偵測到的鍵
	 * @param {Object} oriE W3C定義的事件的e
	 * 表示的是目前最新觸控到的位置
	 * @example
	 *     
	 *     keydown: function(e, list) {
	 *         if(e.key === 'A' && e.key.lastTimeDiff > 3000) {
	 *             console.log('A');     //當A按下超過3秒, 才會印出A
	 *         } 
	 *         if(list.A && list.B) {
	 *             console.log('A+B');   //當A和B都被按下時, 才會印出A+B
	 *         }
	 *     }         
	 *     //FYI: 每個真正的keyCode與相對應的string
	 *     _keyCodeToChar = {
	 *         8:'Backspace',9:'Tab',13:'Enter',
	 *         16:'shiftKey',17:'ctrlKey',18:'altKey',19:'Pause/Break',
	 *         20:'Caps Lock',27:'Esc',32:'Space',33:'Page Up',34:'Page Down',
	 *         35:'End',36:'Home',37:'Left',38:'Up',39:'Right',40:'Down',
	 *         45:'Insert',46:'Delete',48:'0',49:'1',50:'2',51:'3',52:'4',
	 *         53:'5',54:'6',55:'7',56:'8',57:'9',65:'A',66:'B',67:'C',
	 *         68:'D',69:'E',70:'F',71:'G',72:'H',73:'I',74:'J',75:'K',
	 *         76:'L',77:'M',78:'N',79:'O',80:'P',81:'Q',82:'R',83:'S',
	 *         84:'T',85:'U',86:'V',87:'W',88:'X',89:'Y',90:'Z',91:'Windows',
	 *         93:'Right Click',96:'Numpad 0',97:'Numpad 1',98:'Numpad 2',
	 *         99:'Numpad 3',100:'Numpad 4',101:'Numpad 5',102:'Numpad 6',
	 *         103:'Numpad 7',104:'Numpad 8',105:'Numpad 9',106:'Numpad *',
	 *         107:'Numpad +',109:'Numpad -',110:'Numpad .',111:'Numpad /',
	 *         112:'F1',113:'F2',114:'F3',115:'F4',116:'F5',117:'F6',118:'F7',
	 *         119:'F8',120:'F9',121:'F10',122:'F11',123:'F12',144:'Num Lock',
	 *         145:'Scroll Lock',182:'My Computer',
	 *         183:'My Calculator',186:';',187:'=',188:',',189:'-',
	 *         190:'.',191:'/',192:'`',219:'[',220:'\\',221:']',222:'\''
	 *     };
	 *     
	 */
	keydown(e) {

	}

	/**
	 * 處理鍵盤被壓下按鈕的事件, 除了W3C定義的參數外, 
	 * Framework尚支援進階的功能history
	 * @event keyup
	 * @param {Object} e 原生的事件參數
	 * @param {Object} history 儲存最近幾秒內keyup的按鍵 
	 * (可以用來處理類似小朋友齊打交, 發動攻擊技能的Scenario)
	 * history可以設定多久清除一次, 請參考 
	 * {{#crossLink "KeyBoardManager/setClearHistoryTime:method"}}{{/crossLink}}
	 * @example
	 *     keyup: function(e, history) {
	 *         var right = history.length >= 3, i;
	 *         if (history.length > 2) {
	 *             for (i = 3; i > 0; i--) {
	 *                 right = right && (history[history.length - i].key === 'Right');
	 *             }
	 *         }
	 *         if (right) {
	 *             console.log(right);   //當一秒內按了右鍵超過3次, 才會印出true
	 *         }
	 *     },
	 */
	keyup(e) {

	}

	keypress(e) {

	}
}

Object.defineProperty(Level.prototype, 'canvasChanged', {
	get: function() {
		var isCanvasChanged = false;
		this._traversalAllElement(function(ele) {
			if (ele.isObjectChanged) {
				isCanvasChanged = true;
			}
		});
		return isCanvasChanged;
	}

});

module.exports = Level;