const Vector2 = require('../Vector2.js'),
	Rect = require('../Rect.js'),
	Renderer = require('./Renderer.js');

const origins = [
	'topLeft',
	'topCenter',
	'topRight',
	'middleLeft',
	'middleCenter',
	'middleRight',
	'bottomLeft',
	'bottomCenter',
	'bottomRight'
]

const modes = ['source-over', 'source-in', 'source-out', 'source-atop', 'destination-over', 'destination-in', 'destination-out', 'destination-atop', 'lighter', 'copy', 'xor', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'];

const getOffsetByOrigin = (origin, radius) => {
	if (origins.indexOf(origin) == -1)
		throw new Error('Unexpected origin');

	var x = 0,
		y = 0;

	if (/middle/.test(origin))
		y = -radius;
	else if (/bottom/.test(origin))
		y = -radius * 2;

	if (/Center/.test(origin))
		x = -radius;
	else if (/Right/.test(origin))
		x = -radius * 2;

	return new Vector2(x, y);
}

class CircleRenderer extends Renderer {

	static MODES = {
		SOURCE_OVER: "source-over",
		SOURCE_IN: "source-in",
		SOURCE_OUT: "source-out",
		SOURCE_ATOP: "source-atop",
		DESTINATION_OVER: "destination-over",
		DESTINATION_IN: "destination-in",
		DESTINATION_OUT: "destination-out",
		DESTINATION_ATOP: "destination-atop",
		LIGHTER: "lighter",
		COPY: "copy",
		XOR: "xor",
		MULTIPLY: "multiply",
		SCREEN: "screen",
		OVERLAY: "overlay",
		DARKEN: "darken",
		LIGHTEN: "lighten",
		COLOR_DODGE: "color-dodge",
		COLOR_BURN: "color-burn",
		HARD_LIGHT: "hard-light",
		SOFT_LIGHT: "soft-light",
		DIFFERENCE: "difference",
		EXCLUSION: "exclusion",
		HUE: "hue",
		SATURATION: "saturation",
		COLOR: "color",
		LUMINOSITY: "luminosity"
	}

	_rect;
	_origin = 'topLeft';
	_opacity = 1;
	_color = 'black';
	_mode = CircleRenderer.MODES.SOURCE_OVER;

	constructor(radius, options = {}) {
		super(options);

		if (typeof(radius) !== 'number')
			throw new Error('Invalid argument, radius number expected');

		this._radius = radius;

		if (options.opacity !== undefined)
			this.opacity = options.opacity;
		if (options.color !== undefined)
			this.color = options.color;
		if (options.origin !== undefined)
			this.origin = options.origin;
		if (options.mode !== undefined)
			this.mode = options.mode;
	}

	get color() {
		return this._text;
	}

	set color(value) {
		if (typeof(value) !== 'string')
			throw new Error('Invalid argument, string expected');
		this._color = value;
	}

	get origin() {
		return this._origin;
	}

	set origin(value) {
		if (origins.indexOf(value) == -1)
			throw new Error('Invalid argument, not a valid origin');
		if (this._origin === value)
			return;
		this._origin = value;

		if (this.gameObject)
			this.gameObject._changeFrame = true;
	}

	get opacity() {
		return this._opacity;
	}

	set opacity(value) {
		if (typeof(value) !== 'number' || value < 0 || value > 1)
			throw new Error('Invalid argument, a number between 0 and 1 expected');
		this._opacity = value;
	}

	get mode() {
		return this._mode;
	}

	set mode(value) {
		if (modes.indexOf(value) === -1)
			throw new Error('Invalid mode');
		this._mode = value;
	}

	render(ctx) {
		if (this._opacity == 0)
			return;

		ctx.save();

		var offset = getOffsetByOrigin(this._origin, this._radius);
		ctx.translate(offset._x, offset._y);

		ctx.globalAlpha = this._opacity;
		ctx.globalCompositeOperation = this._mode;
		ctx.fillStyle = this._color;

		ctx.beginPath();
		ctx.arc(0, 0, this._radius, 0, Math.PI * 2);
		ctx.fill();

		ctx.restore();
	}
}

module.exports = CircleRenderer;