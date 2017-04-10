const Box2DWeb = require('./Box2dWeb-2.1.a.3.js');

const { b2Vec2 } = Box2DWeb.Common.Math;

class Physics {
	static _world = null;

	static get gravity() {
		return Physics._world.GetGravity();
	}

	static set gravity(value) {
		if(typeof(value) !== 'object' || typeof(value.x) !=='number' || typeof(value.y) !=='number')
			throw new Error('Invalid argument, object with x, y number properties expected');

		Physics._world.SetGravity(new b2Vec2(value.x, value.y));
	}
}

module.exports = Physics;