const Framework = require('../Framework/Framework.js'),
	Controller = require('./Controller.js');

class GameLevel extends Framework.Level {

	constructor() {
		super();
	}
	
	load() {
		super.load();
		Framework.Physics.gravity = {
			x: 0,
			y: 9.8
		};

		var gameObject = new Framework.GameObject('Controller');

		gameObject.position = Framework.Vector2.zero;

		var controller = new Controller();
		gameObject.addComponent(controller);
		gameObject.position = new Framework.Vector2(-800, -500)

		var ground = new Framework.GameObject('Ground');
		var boxCollider = new Framework.BoxCollider(1920, 10);
		ground.position = new Framework.Vector2(0, 500);
		ground.addComponent(boxCollider);

		var leftWall = new Framework.GameObject('leftWall');
		var leftWallBoxCollider = new Framework.BoxCollider(10, 1080);
		leftWall.position = new Framework.Vector2(-900, 0);
		leftWall.addComponent(leftWallBoxCollider);

		var rightWall = new Framework.GameObject('rightWall');
		var rightWallBoxCollider = new Framework.BoxCollider(10, 1080);
		rightWall.position = new Framework.Vector2(900, 0);
		rightWall.addComponent(rightWallBoxCollider);
	}
}

module.exports = GameLevel;