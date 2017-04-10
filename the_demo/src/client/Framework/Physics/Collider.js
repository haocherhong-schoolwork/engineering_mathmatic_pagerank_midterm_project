const Box2dWeb = require('./Box2dWeb-2.1.a.3.js'),
		Component = require('../Component.js'),
		Vector2 = require('../Vector2.js'),
		Config = require('../Config.js');

const { b2Vec2 } = Box2dWeb.Common.Math,
	{ b2BodyDef, b2Body, b2FixtureDef, b2Fixture, b2World, b2DebugDraw } = Box2dWeb.Dynamics,
	{ b2MassData, b2PolygonShape, b2CircleShape } = Box2dWeb.Collision.Shapes,
	{ b2_dynamicBody, b2_staticBody, b2_kinematicBody } = Box2dWeb.Dynamics.b2Body,
	b2RevoluteJointDef = Box2dWeb.Dynamics.Joints.b2RevoluteJointDef,
	b2WeldJointDef = Box2dWeb.Dynamics.Joints.b2WeldJointDef;

class Collider extends Component {
	constructor() {
		super();
		this._isTrigger = false;
		this._body = null;
		this._fixture = null;
		this._offset = new Vector2();

		this._contactCallback = this._contactCallback.bind(this);
	}

	get isTrigger() {
		return this._isTrigger;
	}

	set isTrigger(value) {
		this._isTrigger = value;
		if(this._body)
			this._body.m_fixtureList.SetSensor(value);
	}

	get position() {
		if(!this._body)
			return this._gameObject.absolutePosition;
		var physicsPosition = this._body.GetPosition();
		return new Vector2(physicsPosition.x, physicsPosition.y).multi(Config.physicScale);
	}

	get rotation() {
		if(!this._body)
			return this._gameObject.absoluteRotation;
		return this._body.GetAngle() / Math.PI * 180;
	}

	get offset() {
		return this._offset;
	}

	set offset(value) {
		if(value.constructor !== Vector2)
			throw new Error('Invalid argument, Vector2 expected');
		this._offset = value;
	}

	_contactCallback(body, force) {
		//TODO: remove, only fire to components only
		if(this.gameObject.onCollision)
			this.gameObject.onCollision(body, force);
		this.gameObject._components.forEach((component)=>{
			if(component.onCollision)
				component.onCollision(body, force);
		});
	}

	start() {
		if(this._shape == null)
			throw new Error('shape is not defined, are you using Collider directly?');
		
		

		var bodyDef = new b2BodyDef;

		if(this.gameObject.rigidbody) {
			if(this.gameObject.rigidbody.isKinematic)
				bodyDef.type = b2_kinematicBody;
			else
				bodyDef.type = b2_dynamicBody;

			bodyDef = {
				...bodyDef,
				...this.gameObject.rigidbody._bodyDef
			};
		} else
			bodyDef.type = b2_staticBody;

		bodyDef.position.x = this.gameObject.absolutePosition.x / Config.physicScale;
		bodyDef.position.y = this.gameObject.absolutePosition.y / Config.physicScale;

		bodyDef.userData = {
			collider: this,
			lastContacts: []
		};

		this._box2D = this.gameObject.level._box2D;
		this._body = this._box2D.world.CreateBody(bodyDef);
		this.createFixture();

		if(this.gameObject.rigidbody) {
			var force;
			if(force = this.gameObject.rigidbody._force) {
				this.gameObject.rigidbody.addForce(force.force, force.impulse);
			}
		}

		// this._box2D.addDictionary(this._body, this._beginContactCallback, this._endContactCallback);
	}

	destroyFixture() {
		this._body.DestroyFixture(this._fixture);
	}

	createFixture() {
		var fixDef = new b2FixtureDef;
		fixDef.density = 1.0;
		fixDef.friction = 0.5;
		fixDef.restitution = 0.2;
		fixDef.isSensor = this._isTrigger;
		fixDef.shape = this._shape;
		this._fixture = this._body.CreateFixture(fixDef);
	}

	update() {
		var gameObject = this.gameObject.parent;

		if(this._body.GetType() === b2_dynamicBody) {
			//Dynamic body, update gameObject position by physics position
			var physicsPosition = new Vector2(this.position).sub(this._offset.multi(this.gameObject.absoluteScale)),
				physicsRotation = this.rotation;

			//Update gameobject's absolute position 
			while(gameObject) {
				physicsPosition.x -= gameObject.position.x;
				physicsPosition.y -= gameObject.position.y;
				physicsPosition.x /= gameObject.scale;
				physicsPosition.y /= gameObject.scale;
				physicsRotation -= gameObject.rotation;
				gameObject = gameObject.parent;
			}

			this.gameObject.position = physicsPosition;
			this.gameObject.rotation = physicsRotation;
		} else {
			//Kinematic or static body, update physics position by gameObject position
			if(this.gameObject.isAbsolutePositionChanged) {
				var position = this.gameObject.absolutePosition.div(Config.physicScale),
					b2Position = new b2Vec2(position.x, position.y);
				this._body.SetPosition(b2Position);
			}
			if(this.gameObject.isAbsoluteRotationChanged) {
				var radianAngle = this.gameObject.absoluteRotation * Math.PI / 180;
				this._body.SetAngle(radianAngle);
			}
		}
	}

	onDestroy() {
		if(this._body) {
			this._box2D.removeDictionary(this._body);
			this._box2D.destroyBody(this._body);
		}
	}
}

module.exports = Collider;