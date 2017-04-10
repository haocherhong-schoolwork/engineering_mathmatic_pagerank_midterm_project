const Config = require('../Config.js'),
	Vector2 = require('../Vector2.js'),
	Box2dWeb = require('./Box2dWeb-2.1.a.3.js'),
	Component = require('../Component.js');

const { b2_dynamicBody, b2_staticBody, b2_kinematicBody } = Box2dWeb.Dynamics.b2Body,
	{ b2Vec2 } = Box2dWeb.Common.Math;

class Rigidbody extends Component {

	_isKinematic = false;
	_bodyDef = {
		gravityScale: 1,
		allowSleep: true,
		linearVelocity: new b2Vec2(0, 0),
		angularVelocity: 0,
		linearDamping: 0,
		angularDamping: 0
	};

	_force;

	__body;

	start() {
		if(!this.gameObject.collider)
			throw new Error('Collider not found, make sure you add Collider before Rigidbody');
		this.__body = this.gameObject.collider._body;
	}

	get _body() {
		return this.__body || (this.gameObject && this.gameObject.collider && this.gameObject.collider._body);
	}

	get isKinematic() {
		return this._isKinematic;
	}

	set isKinematic(isKinematic) {
		this._isKinematic = isKinematic;

		if(this._body)
			this._body.SetType(isKinematic ? b2_kinematicBody : b2_dynamicBody);
	}

	get position() {
		return new Vector2(this._body.GetPosition()).multi(Config.physicScale);
	}

	set position(value) {
		if(typeof(value) !== 'object' || typeof(value.x) !== 'number' || typeof(value.y) !== 'number')
			throw new Error('Invalid argument, object with x, y number properties expected');
		this._body.SetPosition(new b2Vec2(
			value.x / Config.physicScale,
			value.y / Config.physicScale
		));
	}

	get velocity() {
		if(this._body)
			return new Vector2(this._body.GetLinearVelocity()).multi(Config.physicScale);
		else
			return new Vector2(this._body._bodyDef.linearVelocity).multi(Config.physicScale);
	}

	set velocity(value) {
		if(typeof(value) !== 'object' || typeof(value.x) !== 'number' || typeof(value.y) !== 'number')
			throw new Error('Invalid argument, object with x, y number properties expected');

		var velocity = new b2Vec2(
			value.x / Config.physicScale,
			value.y / Config.physicScale
		);

		if(this._body)
			this._body.SetLinearVelocity(velocity);
		else
			this._bodyDef.linearVelocity = velocity;
	}

	get angularVelocity() {
		if(this._body)
			return this._body.GetAngularVelocity();
		else
			return this._bodyDef.angularVelocity;
	}

	set angularVelocity(value) {
		if(typeof(value) !== 'number')
			throw new Error('Invalid argument, number expected');
		if(this._body)
			this._body.SetAngularVelocity(value);
		else
			this._bodyDef.angularVelocity = value;
	}

	// get gravityScale() {
	// 	if(!this._body)
	// 		return this._gravityScale;
	// 	return this._body.GetGravityScale();
	// }

	// set gravityScale(value) {
	// 	if(typeof(value) !== 'number')
	// 		throw new Error('Invalid argument, number expected');
	// 	if(this._body)
	// 		this._body.SetGravityScale(value);
	// 	else
	// 		this._gravityScale = value;
	// }

	get allowSleep() {
		if(this._body)
			return this._body.IsSleepingAllowed();
		else
			return this._bodyDef.allowSleep;
	}

	set allowSleep(value) {
		if(typeof(value) !== 'boolean')
			throw new Error('Invalid argument, boolean expected');

		if(this._body)
			this._body.SetSleepingAllowed(value)
		else
			this._bodyDef.allowSleep = value;
	}

	get freezeRotation() {
		if(this._body)
			return this._body.IsFixedRotation();
		else
			return this._bodyDef.fixedRotation;
	}

	set freezeRotation(value) {
		if(typeof(value) !== 'boolean')
			throw new Error('Invalid argument, boolean expected');
		
		if(this._body)
			this._body.SetFixedRotation(value);
		else
			this._bodyDef.fixedRotation = value;
	}

	get drag() {
		if(this._body)
			return this._body.GetLinearDamping() * Config.physicScale;
		else
			return this._bodyDef.linearDamping;
	}

	set drag(value) {
		if(typeof(value) !== 'number')
			throw new Error('Invalid argument, number expected');

		if(this._body)
			this._body.SetLinearDamping(value) / Config.physicScale;
		else
			this._bodyDef.linearDamping = value / Config.physicScale;
	}

	get angularDrag() {
		if(this._body) {
			return this._body.GetAngularDamping();
		}
		else
			return this._bodyDef.angularDamping;
	}

	set angularDrag(value) {
		if(typeof(value) !== 'number')
			throw new Error('Invalid argument, number expected');

		if(this._body)
			this._body.SetAngularDamping(value);
		else
			this._bodyDef.angularDamping = value;
	}

	get mass() {
		if(this._body)
			return this._body.GetMass();
		else
			return 0;
	}

	addForce(force, impulse) {
		if(!this._body) {
			//Body is not created, save the parameters. Collider will call again with them when body created.
			this._force = {
				force,
				impulse
			}
			return;
		}

		if(!force || typeof(force.x) !== 'number' || typeof(force.y) !== 'number')
			throw new Error('Invalid argument, object with x, y number properties expected');

		force = new b2Vec2(
			force.x / Config.physicScale,
			force.y / Config.physicScale
		);

		var torque = this._body.GetWorldCenter();

		if(impulse)
			this._body.ApplyImpulse(force, torque);
		else
			this._body.ApplyForce(force, torque);
	}
}

module.exports = Rigidbody;