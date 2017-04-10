class Screen {
	_canvas = null;

	static get width() {
		return Screen._canvas.width;
	}

	static get height() {
		return Screen._canvas.height;
	}

	static get showCursor() {
		return Screen._canvas.style.cursor != 'none';
	}

	static set showCursor(value) {
		if(typeof(value) !== 'boolean')
			throw new Error('Invalid argument, boolean expected');
		Screen._canvas.style.cursor = value ? 'auto' : 'none';	
	}
}

module.exports = Screen;