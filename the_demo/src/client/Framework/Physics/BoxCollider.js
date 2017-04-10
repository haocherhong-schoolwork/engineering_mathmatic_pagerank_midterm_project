const Box2dWeb = require('./Box2dWeb-2.1.a.3.js'),
	Config = require('../Config.js'),
	Collider = require('./Collider.js');

class BoxCollider extends Collider {
	constructor(width, height) {
		super();
		
		if(typeof(width) !== 'number' || typeof(height) !== 'number')
			throw new Error('Invalid argument, width and height number should be passed in as parameters');

		this._width = width;
		this._height = height;
	}

	start() {
		this._shape = new Box2dWeb.Collision.Shapes.b2PolygonShape;
		// console.log(this.gameObject);
		this._shape.SetAsBox(
			this._width / Config.physicScale * this.gameObject.absoluteScale / 2,
			this._height / Config.physicScale * this.gameObject.absoluteScale / 2);
			// this._width / Config.physicScale,
			// this._height / Config.physicScale);
		super.start();
	}
}

module.exports = BoxCollider;