const Box2dWeb = require('./Box2dWeb-2.1.a.3.js'),
	Config = require('../Config.js'),
	Collider = require('./Collider.js'),
	{ b2Vec2 } = Box2dWeb.Common.Math;

class BoxCollider extends Collider {
	constructor(vertices) {
		super();

		if(!vertices || vertices.constructor !== Array)
			throw 'vertices array must be passed in as first argument of constructor'

		vertices = vertices.map((vertex)=>{
			if(vertex.constructor === Array) {
				if(vertex.length == 2 && typeof(vertex[0]) === 'number' && typeof(vertex[1]) === 'number')
					return new b2Vec2(vertex[0], vertex[1]);
				else
					throw new Error('Unexpected array format, 2 number elements expected');
			} else if(typeof(vertex) === 'Object') {
				if(typeof(vertex.x) === 'number' && typeof(vertex.y) === 'number')
					return new b2Vec2(vertex.x, vertex.y)
				else
					throw new Error('Unexpected object format, x, y number property expected');
			}
		});

		this._shape = new Box2dWeb.Collision.Shapes.b2PolygonShape;
		this._shape.SetAsArray(vertices);
	}
}

module.exports = BoxCollider;