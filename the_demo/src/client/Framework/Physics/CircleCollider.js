const Box2dWeb = require('./Box2dWeb-2.1.a.3.js'),
	Config = require('../Config.js'),
	Collider = require('./Collider.js');

class CircleCollider extends Collider {
	constructor(radius) {
		super();
		if(typeof(radius) !== 'number')
			throw new Error('Invalid argument, a radius number argument should be passed as parameter');
		this._radius = radius;
	}

	start() {
		this._shape = new Box2dWeb.Collision.Shapes.b2CircleShape(this._radius * this._gameObject.absoluteScale / Config.physicScale);
		super.start();
	}

	update() {
		if(this.gameObject.isAbsoluteScaleChanged) {
			this._shape = new Box2dWeb.Collision.Shapes.b2CircleShape(this._radius * this._gameObject.absoluteScale / Config.physicScale);
			this.destroyFixture();
			this.createFixture();
		}
		super.update()
	}
}

module.exports = CircleCollider;