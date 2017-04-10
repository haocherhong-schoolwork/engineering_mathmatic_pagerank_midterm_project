const Box2dWeb = require('./Box2dWeb-2.1.a.3.js');

const	{ b2Vec2 } = Box2dWeb.Common.Math,
		{ b2BodyDef, b2Body, b2FixtureDef, b2Fixture, b2World, b2DebugDraw } = Box2dWeb.Dynamics,
		{ b2MassData, b2PolygonShape, b2CircleShape } = Box2dWeb.Collision.Shapes,
		b2RevoluteJointDef = Box2dWeb.Dynamics.Joints.b2RevoluteJointDef,
		b2WeldJointDef = Box2dWeb.Dynamics.Joints.b2WeldJointDef;

class Box2D {
	constructor() {
		// var debugFlag = true;
		
		this.componentDictionary = [];	
		this.toBeDestroy = [];
		this.bodyType_Dynamic = Box2dWeb.Dynamics.b2Body.b2_dynamicBody;
		this.bodyType_Static = Box2dWeb.Dynamics.b2Body.b2_staticBody;
		this.b2Vec2 = b2Vec2;

		// var options = {
		// 	density : 1,
		// 	friction : 0.5
		// };

		this.world = null;
	}

	destroyBody(body) {
		this.toBeDestroy.push(body);
	}

	addDictionary(componentBody, componentCallBack) {
		var component = {
			body: componentBody,
			callBack: componentCallBack
		};
		this.componentDictionary.push(component);
	};

	removeDictionary(body) {
		var index = this.componentDictionary.map(component => component.body).indexOf(body);
		this.componentDictionary.splice(index, 1);
	}
	
	createWorld(options) {
		if (this.world instanceof b2World) {
			return;
		}

		options = options || {};
		options.gravityY = options.gravityY || 10;
		options.gravityX = options.gravityX || 0;

		if (typeof options.allowSleep === 'undefined') {
			options.allowSleep = true;
		}

		this.world = new b2World(new b2Vec2(options.gravityX, options.gravityY), options.allowSleep);
		this.world.e_locked = 0;
		return this.world;
	};

	setContactListener() {
		var listener = new Box2dWeb.Dynamics.b2ContactListener;
		this.world.SetContactListener(listener);
		listener.BeginContact = (contact) => {
			for(var i=0; i<this.componentDictionary.length; i++){
				if(this.componentDictionary[i].body === contact.GetFixtureA().GetBody()){
					var body = contact.GetFixtureB().GetBody();
					this.componentDictionary[i].callBack(body, body.m_angularVelocity);
				}
			}
		}
	};

	createSquareBody(width, height, bodyType, options) {
		var fixDef = new b2FixtureDef;
		fixDef.density = 1.0;
		fixDef.friction = 0.5;
		fixDef.restitution = 0.2;

		var bodyDef = new b2BodyDef;

		bodyDef.type = bodyType;
		bodyDef.position.x = 0;
		bodyDef.position.y = 0;
		fixDef.shape = new b2PolygonShape;
		fixDef.shape.SetAsBox(width, height);
		var squareBody = this.world.CreateBody(bodyDef);
		var squareFixture = squareBody.CreateFixture(fixDef);

		return squareBody;
	};

	createCircleBody(radius, bodyType, options) {
		var fixDef = new b2FixtureDef;
		fixDef.density = 1.0;
		fixDef.friction = 0.5;
		fixDef.restitution = 0.2;

		var bodyDef = new b2BodyDef;

		bodyDef.type = bodyType;
		bodyDef.position.x = 0;
		bodyDef.position.y = 0;
		fixDef.shape = new b2CircleShape(radius);
		var circleBody = this.world.CreateBody(bodyDef);
		var circleFixture = circleBody.CreateFixture(fixDef);

		return circleBody;
	};

	weldJoint(body1, body2) {
		var jointDef = new b2WeldJointDef();
		jointDef.Initialize(body1, body2, body1.GetWorldCenter());
		var jointBody = this.world.CreateJoint(jointDef);

		return jointBody;
	};
	
	revoluteJoint(body1, body2) {
		var jointDef = new b2WeldJointDef();
		jointDef.Initialize(body1, body2, body1.GetWorldCenter());
		var jointBody = this.world.CreateJoint(jointDef);

		return jointBody;
	};

	initDebugDraw(ctx) {
		var debugDraw = new b2DebugDraw();
		debugDraw.SetSprite(ctx);
		debugDraw.SetDrawScale(30.0);
		debugDraw.SetFillAlpha(0.3);
		debugDraw.SetLineThickness(1.0);
		debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
		this.world.SetDebugDraw(debugDraw);
	};

	update() {
		while(this.toBeDestroy.length > 0) {
			var body = this.toBeDestroy.shift();
			this.world.DestroyBody(body);
		}

		this.world.Step(
			1 / 60 //frame-rate
		, 10 //velocity iterations
		, 10 //position iterations
		);
		this.world.ClearForces();
	};

	drawDebug() {
		this.world.DrawDebugData();
	}
}

module.exports = Box2D;