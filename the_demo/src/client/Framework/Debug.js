const GameObject = require('./GameObject.js'),
	Vector2 = require('./Vector2.js'),
	Camera = require('./Camera.js'),
	Screen = require('./Screen.js');

//Pushes gameObject and all its descendants to an array
const travelFunc = (gameObject, array) => {
	if (!gameObject.active)
		return;
	
	array.push(gameObject);

	if(Debug.renderChildren)
		gameObject.children.forEach(gameObject => travelFunc(gameObject, array));
};

//Returns an array of gameObject include self and all its descendants.
const getAllGameObjects = (gameObject) => {
	var gameObjects = [];
	if(gameObject)
		travelFunc(gameObject, gameObjects);
	return gameObjects;
}

class Debug {
	//This variable will be read by Level to determine determine whether to call Debug._render()
	static renderDebugInfo = false;

	//TODO: add setter/getter to each of following
	static renderPhysics = true;
	static renderTransform = true;
	static renderName = true;
	static renderReferencePoint = true;
	static renderBounds = false;
	static renderFps = true;
	static renderChildren = true;
	static renderCustom = true;

	static _renderSelectionOnly = false;
	static _selection = null;

	static _lineRequests = [];

	static get renderSelectionOnly() {
		return Debug._renderSelectionOnly;
	}

	static set renderSelectionOnly(value) {
		if(typeof(value) !== 'boolean')
			throw new Error('Invalid argument, boolean expected');
		Debug._renderSelectionOnly = value;
	}

	static get selection() {
		return Debug._selection;
	}

	static set selection(value) {
		if(value != null && value.constructor !== GameObject)
			throw new Error('Invalid argument, GameObject expected');
		Debug._selection = value;
	}

	static drawRay(start, dir, color = 'green', duration = 0, lineWidth = 1) {
		if(!start || start.constructor !== Vector2)
			throw new Error('Invalid argument, start point Vector2 as first parameter expected');
		if(!dir || dir.constructor !== Vector2)
			throw new Error('Invalid argument, dir point Vector2 as second parameter expected');
		if(typeof(color) !== 'string')
			throw new Error('Invalid argument, color string as third parameter expected (if passed in)');
		if(typeof(duration) !== 'number' || duration < 0)
			throw new Error('Invalid argument, positive duration number as fourth parameter expected (if passed in)');

		Debug._lineRequests.push({
			start,
			end: start.add(dir),
			color,
			duration,
			lineWidth
		});
	}

	static drawLine(start, end, color = 'green', duration = 0, lineWidth = 1) {
		if(!start || start.constructor !== Vector2)
			throw new Error('Invalid argument, start point Vector2 as first parameter expected');
		if(!end || end.constructor !== Vector2)
			throw new Error('Invalid argument, end point Vector2 as second parameter expected');
		if(typeof(color) !== 'string')
			throw new Error('Invalid argument, color string as third parameter expected (if passed in)');
		if(typeof(duration) !== 'number' || duration < 0)
			throw new Error('Invalid argument, positive duration number as fourth parameter expected (if passed in)');
		if(typeof(duration) !== 'number' || lineWidth <= 0)
			throw new Error('Invalid argument, positive lineWidth number as fifth parameter expected (if passed in)');

		Debug._lineRequests.push({
			start,
			end,
			color,
			duration,
			lineWidth
		});
	}

	static drawMark(position, size = 100, color = 'green', duration = 0) {
		if(!position || position.constructor !== Vector2)
			throw new Error('Invalid argument, position Vector2 as first parameter expected');
		if(typeof(size) !== 'number')
			throw new Error('Invalid argument, size number as second parameter expected');
		if(typeof(color) !== 'string')
			throw new Error('Invalid argument, color string as third parameter expected (if passed in)');
		if(typeof(duration) !== 'number' || duration < 0)
			throw new Error('Invalid argument, positive duration number as fourth parameter expected (if passed in)');
		if(typeof(duration) !== 'number' || lineWidth <= 0)
			throw new Error('Invalid argument, positive lineWidth number as fifth parameter expected (if passed in)');

		var v1 = Vector2.one.multi(size),
			v2 = new Vector2(-1, 1).multi(size);
		Debug.drawLine(position.sub(v1), position.add(v1), color, duration);
		Debug.drawLine(position.sub(v2), position.add(v2), color, duration);
	}

	//This will be called by Level if Debug.renderDebugInfo is true. Context passed in is already translated by camera position
	static _render(ctx, level) {
		//Render physics
		if (Debug.renderPhysics)
			level._box2D.drawDebug();

		//Render transform information
		if (Debug.renderTransform || Debug.renderName || Debug.renderBounds || Debug.renderReferencePoint) {
			var target = Debug._renderSelectionOnly ? Debug._selection : level.rootScene;
			getAllGameObjects(target).forEach((gameObject) => {
				var screenPoint = Camera.main.worldToScreenPoint(gameObject.absolutePosition);
				if(screenPoint.x < 0 || screenPoint.x > Screen.width || screenPoint.y < 0 || screenPoint.y > Screen.height)
					return;

				ctx.save();

				//Translate
				ctx.translate(gameObject.absolutePosition.x, gameObject.absolutePosition.y);

				//Render name
				if(Debug.renderName) {
					ctx.textAlign = 'center';
					ctx.fillStyle = 'black';
					ctx.fillText(gameObject.name || gameObject.constructor.name, 0, 0);
				}

				//Rotate
				ctx.rotate(gameObject.absoluteRotation / 180 * Math.PI);

				//Render transform
				if(Debug.renderTransform) {
					//Draw X axis
					ctx.lineWidth = 2;
					ctx.strokeStyle = 'red';
					ctx.beginPath();
					ctx.moveTo(0, 0);
					ctx.lineTo(100, 0);
					ctx.stroke();
					//Draw Y axis
					ctx.strokeStyle = 'green';
					ctx.beginPath();
					ctx.moveTo(0, 0);
					ctx.lineTo(0, 100);
					ctx.stroke();
				}

				//Render reference point
				if(Debug.renderReferencePoint && gameObject.renderer) {
					ctx.save();
					var referencePoint = gameObject.renderer.referencePoint;
					ctx.translate(referencePoint.x * gameObject.absoluteScale, referencePoint.y * gameObject.absoluteScale);
					ctx.lineWidth = 2;
					ctx.strokeStyle = 'lightseagreen';
					ctx.beginPath();
					ctx.moveTo(-10, -10);
					ctx.lineTo(10, 10);
					ctx.stroke();
					ctx.beginPath();
					ctx.moveTo(-10, 10);
					ctx.lineTo(10, -10);
					ctx.stroke();
					ctx.restore();
				}

				//Render bounds
				if(Debug.renderBounds && gameObject.renderer) {
					var bounds = gameObject.renderer.bounds;
					var scale = gameObject.absoluteScale;
					ctx.lineWidth = 2;
					ctx.strokeStyle = 'red';
					ctx.strokeRect(bounds.x * scale, bounds.y * scale, bounds.width * scale, bounds.height * scale);
				}

				ctx.restore();
			});
		}

		//TODO: render FPS
		if (Debug.renderFps) {
			// var fps = level._fpsAnalysis.getUpdateFPS();
			// ctx.save();
			// ctx.font ='32px Arial bold';
			// ctx.textAlign = 'left';
			// ctx.textBaseline = 'top';
			// ctx.fillStyle = 'green';
			// ctx.fillText(fps.toString(), 10, 10);
			// ctx.restore();
		}

		if(Debug.renderCustom && Debug._lineRequests.length > 0) {
			ctx.save();
			var lineRequests = [...Debug._lineRequests];

			//TODO: Determine whether to draw line (don't draw when bounds out of screen)

			var now = Date.now();
			for(var request of lineRequests) {
				ctx.beginPath();
				ctx.moveTo(request.start.x, request.start.y);
				ctx.lineTo(request.end.x, request.end.y);
				ctx.lineWidth = request.lineWidth;
				ctx.strokeStyle = request.color;
				ctx.stroke();

				//Remove fulfilled request from array

				var fulfilled = false;
				if(request.duration == 0) {
					fulfilled = true;
				} else {
					if(request.beginTime) {
						if((now - request.beginTime) / 1000 >= request.duration)
							fulfilled = true;
					} else {
						request.beginTime = now;
					}
				}

				if(fulfilled)
					Debug._lineRequests.splice(Debug._lineRequests.indexOf(request), 1);
			}
			ctx.restore();
		}
	}
}

module.exports = Debug;