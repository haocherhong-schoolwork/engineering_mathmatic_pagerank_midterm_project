const Vector2 = require('../Vector2.js'),
	Rect = require('../Rect.js'),
	ResourceManager = require('../ResourceManager.js'),
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

class SpriteRenderer extends Renderer {

	_currentFramesetId = null;
	_currentFrameset = null;
	_currentFrame = 0;
	_framesets = {};
	_flip = {
		x: false,
		y: false
	};
	_origin = 'middleCenter';
	_clipRect = null;
	_offset = Vector2.zero;
	_opacity = 1;

	constructor(defaultFramesetId, framesets, options) {
		super(options);

		if (!framesets || framesets.constructor !== Object)
			throw new Error('Invalid argument, framesets object parameter expected');

		for (var framesetId in framesets) {
			var frameset = framesets[framesetId];
			if (typeof(frameset) !== 'object')
				throw new Error('Invalid argument, frameset ' + framesetId + ' is not an object');
			if (typeof(frameset.framesPerRow) !== 'number')
				frameset.framesPerRow = 1;
			if (typeof(frameset.framesPerColumn) !== 'number')
				frameset.framesPerColumn = 1;
			if (typeof(frameset.textureId) !== 'string')
				throw new Error('Invalid argument, frameset must contain a string texture id');
			frameset.texture = ResourceManager.getResource(frameset.textureId);
		}

		this._framesets = framesets;

		if (typeof(defaultFramesetId) !== 'string')
			throw new Error('Invalid argument, default frameset id string expected');

		//The setter will set this._currentFrameset automatically
		this.currentFramesetId = defaultFramesetId;

		if (options) {
			if (options.currentFrame !== undefined)
				this._currentFrame = options.currentFrame;
			if (options.flip !== undefined)
				this.flip = options.flip;
			if (options.origin !== undefined)
				this.origin = options.origin;
			if (options.clipRect !== undefined)
				this.clipRect = options.clipRect;
			if (options.offset !== undefined)
				this.offset = options.offset;
			if(options.opacity !== undefined)
				this.opacity = options.opacity;
		}
	}

	get size() {
		if (!this._currentFrameset.texture)
			return new Vector2();
		return new Vector2(
			this._currentFrameset.texture.width / this._currentFrameset.framesPerRow,
			this._currentFrameset.texture.height / this._currentFrameset.framesPerColumn
		);
	}

	get bounds() {
		var frameSize = {
			width: this._currentFrameset.texture.width / this._currentFrameset.framesPerRow,
			height: this._currentFrameset.texture.height / this._currentFrameset.framesPerColumn
		};
		var offset = getOffsetByOrigin(this._origin, frameSize).add(this._offset);
		return new Rect(offset.x, offset.y, frameSize.width, frameSize.height);
	}

	get currentFrame() {
		return this._currentFrame;
	}

	set currentFrame(value) {
		if (this._currentFrame === value)
			return;
		this._currentFrame = value;
		if (this.gameObject)
			this.gameObject._changeFrame = true;
	}

	get currentFramesetId() {
		return this._currentFramesetId;
	}

	set currentFramesetId(value) {
		if (typeof(value) !== 'string')
			throw new Error('Invalid argument, string expected');
		if (!this._framesets[value])
			throw new Error('Frameset not found: ' + value);

		this._currentFramesetId = value;
		this._currentFrameset = this._framesets[value];
	}

	get flip() {
		return this._flip;
	}

	set flip(value) {
		if (typeof(value.x) == 'boolean') {
			this._flip.x = value.x;
			if (this.gameObject)
				this.gameObject._changeFrame = true;
		}
		if (typeof(value.y) == 'boolean') {
			this._flip.y = value.y;
			if (this.gameObject)
				this.gameObject._changeFrame = true;
		}
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

	get clipRect() {
		return this._clipRect;
	}

	set clipRect(value) {
		if (value != null && value.constructor !== Rect)
			throw new Error('Unexpected argument, Rect expected');

		if (this._clipRect == value)
			return;

		this._clipRect = value;

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

	get framesets() {
		return {
			...this._framesets
		};
	}

	render(ctx) {

		if(this._opacity == 0)
			return;

		ctx.save();
		ctx.globalAlpha = this._opacity;

		// var scale = this.gameObject.absoluteScale;

		//TODO cache these
		var frameSize = {
			width: this._currentFrameset.texture.width / this._currentFrameset.framesPerRow,
			height: this._currentFrameset.texture.height / this._currentFrameset.framesPerColumn
		};
		var index = {
			x: this._currentFrame % this._currentFrameset.framesPerRow,
			y: Math.floor(this._currentFrame / this._currentFrameset.framesPerRow)
		};

		var offset = getOffsetByOrigin(this._origin, frameSize).add(this._offset);

		ctx.scale(this._flip.x ? -1 : 1, this._flip.y ? -1 : 1);

		if (this._clipRect) {
			ctx.beginPath();
			ctx.rect(
				this._clipRect.x,
				this._clipRect.y,
				this._clipRect.width,
				this._clipRect.height);
			// ctx.fill();
			ctx.clip();
		}

		ctx.drawImage(
			this._currentFrameset.texture,
			index.x * frameSize.width,
			index.y * frameSize.height,
			frameSize.width,
			frameSize.height,
			offset.x,
			offset.y,
			frameSize.width,
			frameSize.height,
		);

		ctx.restore();
	}
}

module.exports = SpriteRenderer;