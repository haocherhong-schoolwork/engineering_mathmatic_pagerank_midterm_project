const MathUtils = require('./MathUtils.js');

class Vector2 {
	constructor(x, y) {
		if(typeof(x) === 'object' && typeof(x.x) === 'number' && typeof(x.y) === 'number') {
			y = x.y;
			x = x.x;
		}

		if(arguments.length == 0) {
			x = 0;
			y = 0;
		};

		if(typeof(x) !== 'number' || typeof(y) !== 'number')
			throw new Error('Invalid argument, x and y number parameters expected');

		this._x = x;
		this._y = y;
	}

	get x() {
		return this._x;
	}

	set x(value) {
		if(typeof(value) !== 'number')
			throw new Error('Invalid argument, number expected');
		this._x = value;
	}

	get y() {
		return this._y;
	}

	set y(value) {
		if(typeof(value) !== 'number')
			throw new Error('Invalid argument, number expected');
		this._y = value;
	}

	get magnitude() {
		return Math.sqrt(this._x * this._x + this._y * this._y);
	}

	get normalized() {
		var magnitude = this.magnitude;
		if(magnitude != 0)
			return this.div(this.magnitude);
		else
			return new Vector2();
	}

	add(b) {
		return Vector2.add(this, b);
	}

	sub(b) {
		return Vector2.sub(this, b);
	}

	multi(scalar) {
		return Vector2.multi(this, scalar);
	}

	div(scalar) {
		return Vector2.div(this, scalar);
	}

	toString() {
		return '(' + this._x.toFixed(2) + ', ' + this._y.toFixed(2) + ')';
	}

	static add(a, b) {
		if(!(a instanceof Vector2 && b instanceof Vector2))
			throw new Error('Invalid argument, two Vector2 expected');
		return new Vector2(a._x + b._x, a._y + b._y);
	}

	static sub(a, b) {
		if(!(a instanceof Vector2 && b instanceof Vector2))
			throw new Error('Invalid argument, two Vector2 expected');
		return new Vector2(a._x - b._x, a._y - b._y);
	}

	static multi(vec, scalar) {
		if(!(vec instanceof Vector2 && typeof(scalar) === 'number'))
			throw new Error('Invalid argument, Vector2 and number expected');
		return new Vector2(vec._x * scalar, vec._y * scalar);
	}

	static div(vec, scalar) {
		if(!(vec instanceof Vector2 && typeof(scalar) === 'number'))
			throw new Error('Invalid argument, Vector2 and number expected');
		return new Vector2(vec._x / scalar, vec._y / scalar);
	}

	static lerp(a, b, t) {
		if(!(a instanceof Vector2 && b instanceof Vector2 && typeof(t) === 'number'))
			throw new Error('Invalid argument, two Vector2 and one number expected');
		return new Vector2(
			MathUtils.lerp(a._x, b._x, t),
			MathUtils.lerp(a._y, b._y, t)
		);
	}

	static smoothDamp(current, velocity, target, timeStep) {
		var x = MathUtils.smoothDamp(current._x, velocity._x, target._x, timeStep),
			y = MathUtils.smoothDamp(current._y, velocity._y, target._y, timeStep);
		return {
			value: new Vector2(x.value, y.value),
			velocity: new Vector2(x.velocity, y.velocity)
		};
	}

	static get zero() {
		return new Vector2();
	}

	static get one() {
		return new Vector2(1, 1);
	}

	static get right() {
		return new Vector2(1, 0);
	}

	static get down() {
		return new Vector2(0, 1);
	}

	static get right() {
		return new Vector2(-1, 0);
	}

	static get up() {
		return new Vector2(0, -1);
	}

	static radianToVector2(radian) {
		return new Vector2(Math.cos(radian), -Math.sin(radian));
	}

	static degreeToVector2(degree) {
		return Vector2.radianToVector2(degree * MathUtils.deg2Rad);
	}

	static vector2ToRadian(vector2) {
		return Math.atan2(vector2.x, vector2.y) - 90 * MathUtils.deg2Rad;
	}

	static vector2ToDegree(vector2) {
		return Vector2.vector2ToRadian(vector2) * MathUtils.rad2Deg;
	}
}

module.exports = Vector2;