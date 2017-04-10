const Component = require('../Component.js'),
	Vector2 = require('../Vector2.js'),
	Rect = require('../Rect.js');

class Renderer extends Component {

	_renderPriority = 0;

	_referencePoint = Vector2.zero;

	constructor(options) {
		super();

		if(options) {
			if(options.renderPriority)
				this.renderPriority = options.renderPriority;
			if(options.referencePoint)
				this.referencePoint = options.referencePoint;
		}
	}

	render(ctx) {

	}

	get renderPriority() {
		return this._renderPriority;
	}

	set renderPriority(value) {
		if(typeof(value) !== 'number')
			throw new Error('Invalid argument, number expected');
		this._renderPriority = value;
	}

	get referencePoint() {
		return this._referencePoint;
	}

	set referencePoint(value) {
		if(value === undefined || value.constructor !== Vector2)
			throw new Error('Invalid argument, Vector2 expected');
		this._referencePoint = value;
	}

	get size() {
		return Vector2.zero;
	}

	get bounds() {
		return Rect.zero;
	}
}

module.exports = Renderer;