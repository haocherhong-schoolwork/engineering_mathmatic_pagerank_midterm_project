const Vector2 = require('./Vector2.js');

class Rect {

	_x = 0;
	_y = 0;
	_width = 0;
	_height = 0;

	static get zero() {
		return new Rect(0, 0, 0, 0);
	}

	constructor(x, y, width, height) {
		if(arguments.length = 0) {
			x = 0;
			y = 0;
			width = 0;
			height = 0;
		}

		if(typeof(x) !== 'number' ||
			typeof(y) !== 'number' ||
			typeof(width) !== 'number' ||
			typeof(height) !== 'number')
			throw new Error('Invalid arguments, x, y, width and height numbers expected');
		
		this._x = x;
		this._y = y;
		this._width = width;
		this._height = height;
	}

	get x() {
		return this._x;
	}

	get y() {
		return this._y;
	}

	get width() {
		return this._width;
	}

	get height() {
		return this._height;
	}

	translate(vector2) {
		if(!vector2 || vector2.constructor !== Vector2)
			throw new Error('Invalid argument, Vector2 expected');

		return new Rect(
			this._x + vector2.x,
			this._y + vector2.y,
			this._width,
			this._height
		);
	}

	scale(scalar) {
		if(typeof(scalar) !== 'number')
			throw new Error('Invalid argument, number expected');
		return new Rect(
			this._x * scalar,
			this._y * scalar,
			this._width * scalar,
			this._height * scalar
		);
	}

	//TODO: type check
	intersect(rect) {
		var minAx = this._x,
			maxAx = this._x + this._width,
			minAy = this._y,
			maxAy = this._y + this._height,
			minBx = rect._x,
			maxBx = rect._x + rect._width,
			minBy = rect._y,
			maxBy = rect._y + rect._height,
	    	aLeftOfB = maxAx < minBx,
	    	aRightOfB = minAx > maxBx,
	    	aAboveB = minAy > maxBy,
	    	aBelowB = maxAy < minBy;

	    return !( aLeftOfB || aRightOfB || aAboveB || aBelowB );
	}

	//TODO: type check
	testPoint(point) {
		return	point._x >= this._x &&
				point._x <= this._x + this._width &&
				point._y >= this._y &&
				point._y <= this._y + this._height;
	}

	toString() {
		return '(' + this._x.toFixed(2) + ', ' + this._y.toFixed(2) + ', ' + this._width.toFixed(2) + ', ' + this._height.toFixed(2) + ')';
	}
}

module.exports = Rect;