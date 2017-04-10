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

const getOffsetByOrigin = (origin, frameSize) => {
	if (origins.indexOf(origin) == -1)
		throw new Error('Unexpected origin');

	var x = 0,
		y = 0;

	if (/middle/.test(origin))
		y = -frameSize.height / 2;
	else if (/bottom/.test(origin))
		y = -frameSize.height;

	if (/Center/.test(origin))
		x = -frameSize.width / 2;
	else if (/Right/.test(origin))
		x = -frameSize.width;

	return new Vector2(x, y);
}

class TextRenderer extends Renderer {

	_origin = 'topLeft';
	_offset = Vector2.zero;
	_opacity = 1;
	_text = '';
	_color = 'black';
	_fontSize = 32;
	_fontType = 'Visitor';

	constructor(text = '', options = {}) {
		super(options);

		this._text = text;

		if (options.offset !== undefined)
			this.offset = options.offset;
		if(options.opacity !== undefined)
			this.opacity = options.opacity;
		if (options.color !== undefined)
			this.color = options.color;
		if (options.fontSize !== undefined)
			this.fontSize = options.fontSize;
		if (options.fontType !== undefined)
			this.fontType = options.fontType;
		if (options.origin !== undefined)
			this.origin = options.origin;
	}

	get text() {
		return this._text;
	}

	set text(value) {
		if (typeof(value) !== 'string')
			throw new Error('Invalid argument, string expected');
		this._text = value;
	}

	get color() {
		return this._text;
	}

	set color(value) {
		if (typeof(value) !== 'string')
			throw new Error('Invalid argument, string expected');
		this._color = value;
	}

	get fontSize() {
		return this._text;
	}

	set fontSize(value) {
		if (typeof(value) !== 'number')
			throw new Error('Invalid argument, number expected');
		this._fontSize = value;
	}

	get fontType() {
		return this._text;
	}

	set fontType(value) {
		if (typeof(value) !== 'string')
			throw new Error('Invalid argument, string expected');
		this._fontType = value;
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

	get offset() {
		return this._offset;
	}

	set offset(value) {
		if (value.constructor !== Vector2)
			throw new Error('Invalid argument, Vector2 expected');
		this._offset = value;

		if (this.gameObject)
			this.gameObject._changeFrame = true;
	}

	get opacity() {
		return this._opacity;
	}

	set opacity(value) {
		if(typeof(value) !== 'number' || value < 0 || value > 1)
			throw new Error('Invalid argument, a number between 0 and 1 expected');
		this._opacity = value;
	}

	render(ctx) {
		if(this._opacity == 0)
			return;

		ctx.save();
		ctx.globalAlpha = this._opacity;

		ctx.translate(this._offset._x, this._offset._y);

		if(/top/.test(this._origin))
			ctx.textBaseline = 'top';
		else if(/middle/.test(this._origin))
			ctx.textBaseline = 'middle';
		else if(/bottom/.test(this._origin))
			ctx.textBaseline = 'bottom';

		if(/Left/.test(this._origin))
			ctx.textAlign = 'left';
		else if(/Center/.test(this._origin))
			ctx.textAlign = 'center';
		else if(/Right/.test(this._origin))
			ctx.textAlign = 'right';

		ctx.font = this._fontSize.toString() + 'px "' + this._fontType + '"';
		ctx.fillStyle = this._color;

		ctx.fillText(this._text, 0, 0);

		ctx.restore();
	}
}

module.exports = TextRenderer;