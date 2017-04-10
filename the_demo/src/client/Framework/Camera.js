const Component = require('./Component.js'),
	Vector2 = require('./Vector2.js'),
	Rect = require('./Rect.js'),
	Screen = require('./Screen.js');

class Camera extends Component {
	constructor() {
		super('Camera');

		//Set this as new main camera if there is no main camera
		if(Camera.main == null)
			Camera.main = this;
	}

	get position() {
		if(!this.gameObject)
			return Vector2.zero;
		else
			return this.gameObject.absolutePosition;
	}

	get rotation() {
		if(!this.gameObject)
			return 0;
		else
			return this.gameObject.absoluteRotation;
	}

	get rect() {
		if(!this.gameObject)
			return Rect.zero;

		var position = this.position;		

		return new Rect(
			position.x - Screen.width / 2,
			position.y - Screen.height / 2,
			Screen.width,
			Screen.height
		);
	}

	screenToWorldPoint(point) {
		return new Vector2(
			this.position.x - Screen.width / 2 + point.x,
			this.position.y - Screen.height / 2 + point.y
		);
	}

	worldToScreenPoint(point) {
		return new Vector2(
			point.x - this.position.x + Screen.width / 2,
			point.y - this.position.y + Screen.height / 2
		);
	}
}

module.exports = Camera;