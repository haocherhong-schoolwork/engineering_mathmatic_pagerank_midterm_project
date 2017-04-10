const Util = require('../Util.js'),
	Screen = require('../Screen.js'),
	Camera = require('../Camera.js'),
	Vector2 = require('../Vector2.js'),
	Rect = require('../Rect.js'),
	GameObject = require('../GameObject.js'),
	BoxCollider = require('../Physics/BoxCollider.js'),
	ResourceManager = require('../ResourceManager.js'),
	Renderer = require('./Renderer.js');

class HorizontalLayer extends Renderer {

	_data;
	_tileWidth;
	_opacity;
	_layer;

	_canvas;
	_context;

	_bounds;

	constructor(options) {
		super(options);

		this._data = options.data;
		this._tileWidth = options.tileWidth;
		this._layer = options.layer;

		//Initialize and prerender Canvas
		this._canvas = document.createElement('canvas');
		var tileWidth = this._tileWidth,
			canvasWidth = Math.max(...this._data.map((data)=>(data.x * tileWidth + data.tile.width))),
			canvasHeight = Math.max(...this._data.map((data)=>(data.tile.height)));
		this._canvas.width = canvasWidth;
		this._canvas.height = canvasHeight;
		this._context = this._canvas.getContext('2d');

		this.startCoroutine(this._renderToCanvas.bind(this, this._context));
		// this._renderToCanvas(this._context);

		this._bounds = new Rect(0, 0, canvasWidth, canvasHeight);
	}

	get bounds() {
		return this._bounds;
	}

	*_renderToCanvas(ctx) {
		ctx.save();

		const tileWidth = this._tileWidth;

		ctx.globalAlpha = this._layer.opacity;

		for (var i = 0; i < this._data.length; i++) {

			var data = this._data[i],
				{ tile, x } = data;

			ctx.drawImage(
				tile.texture,
				tile.x,
				tile.y,
				tile.width,
				tile.height,
				x * tileWidth,
				0,
				tile.width,
				tile.height,
			);
			// yield;
		}

		ctx.restore();
	}

	render(ctx) {
		ctx.drawImage(this._canvas, 0, 0);
	}
}

class TiledMap extends Renderer {

	_tiledMap;
	_tiles = {};
	_collisionLayers = [];
	_groundLayers = [];

	_canvas;
	_context;

	_bounds;

	constructor(tiledMap, options) {
		super();


		if (typeof(tiledMap) !== 'object')
			throw new Error('Invalid argument, tiledMap object parameter expected');

		this._tiledMap = tiledMap;

		for (var tileset of tiledMap.tilesets) {
			var texture = ResourceManager.getResource(tileset.name);
			for (var i = 0; i < tileset.tilecount; i++) {
				var index = {
					x: i % tileset.columns,
					y: Math.floor(i / tileset.columns)
				}
				this._tiles[i + tileset.firstgid] = {
					x: index.x * tileset.tilewidth,
					y: index.y * tileset.tileheight,
					width: tileset.tilewidth,
					height: tileset.tileheight,
					texture
				};
			}
		}

		//Make colliders
		options = options || {};
		if(options.collisionLayers && options.collisionLayers.constructor === Array) {
			this._collisionLayers = options.collisionLayers;
		}

		//Determine ground layers
		for(var layer of tiledMap.layers)
			if(layer.properties && layer.properties.ground)
				this._groundLayers.push(layer);

		//Initialize and prerender Canvas
		this._canvas = document.createElement('canvas');
		this._canvas.width = tiledMap.tilewidth * tiledMap.width;
		this._canvas.height = tiledMap.tilewidth * tiledMap.height;
		this._context = this._canvas.getContext('2d');

		this.startCoroutine(this._renderToCanvas.bind(this, this._context));
		// this._renderToCanvas(this._context);

		this._bounds = new Rect(0, 0, this._canvas.width, this._canvas.height);
	}

	get bounds() {
		return this._bounds;
	}

	start() {
		this._generateColliders();
		this.startCoroutine(this._generateHorizontalLayers);
	}

	_generateColliders() {
		//Generate colliders for layers
		var collidersGameObject = new Framework.GameObject('Colliders');
		collidersGameObject.parent = this.gameObject;
		for(var layerName of this._collisionLayers) {
			for(var layer of this._tiledMap.layers) {
				if(layer.name === layerName) {
					for(var i = 0; i < layer.data.length; i++) {

						var tileId = layer.data[i];
						if(tileId == 0)
							continue;

						var tile = this._tiles[tileId];

						var index = {
							x: i % layer.width,
							y: Math.floor(i / layer.width)
						};

						var gameObject = new GameObject(layer.name + '_' + index.x + '_' + index.y);
						gameObject.tag = 'TiledObstacles';
						
						var collider = new BoxCollider(tile.width, tile.height);
						gameObject.addComponent(collider);

						gameObject.parent = collidersGameObject;
						gameObject.position = new Vector2(
							index.x * tile.width + tile.width / 2,
							index.y * tile.height + tile.height / 2
						);
						// console.log(gameObject);
					}
					break;
				}
			}
		}
	}

	*_generateHorizontalLayers() {
		//Generate horizontal layers
		var hLayersGameObject = new Framework.GameObject('H Layers');
		hLayersGameObject.parent = this.gameObject;
		for(var layer of this._tiledMap.layers) {
			if(layer.type !== 'tilelayer')
				continue;
			//Ignore ground layer
			if(layer.properties && layer.properties.ground)
				continue;

			if (!layer.visible || layer.opacity == 0)
				continue;

			//Set parent
			var layerGameObjet = new Framework.GameObject(layer.name);
			layerGameObjet.parent = hLayersGameObject;

			//Determine reference point by custom property 'height'
			var tileWidth = this._tiledMap.tilewidth,
				referencePoint;
			if(layer.properties && layer.properties.height)
				referencePoint = new Vector2(0, (1 + layer.properties.height) * tileWidth);
			else
				referencePoint = new Vector2(0, tileWidth);

			//dataInY is an array with data with following format:
			// {
			// 	tile: {	//represents tile position and size in the texture
			// 		x: Number,
			// 		y: Number,
			// 		width: Number,
			// 		height: Number,
			//		texture: Object
			// 	},
			// 	x: Number,	//x position in grid space
			// }

			
			for(var y = 0; y < layer.height; y++) {
				var dataInY = [];
				var firstX = null;
				for(var x = 0; x < layer.width; x++) {
					var i = y * layer.width + x;
					if(layer.data[i] == 0)
						continue;
					if(firstX == null)
						firstX = x;
					var tile = this._tiles[layer.data[i]];
					dataInY.push({
						tile,
						x: x - firstX
					})
				}

				if(dataInY.length > 0) {
					//Create horizontal layer
					var hLayer = new GameObject('hLayer_' + y);
					var horizontalLayer = new HorizontalLayer({
						renderPriority: 2,
						data: dataInY,
						tileWidth,
						referencePoint,
						layer
					});
					hLayer.addComponent(horizontalLayer);
					hLayer.parent = layerGameObjet;
					var offset = new Vector2(
						layer.offsetx || 0,
						layer.offsety || 0
					);
					hLayer.position = new Vector2(firstX * tileWidth, y * tileWidth).add(offset);

					yield;
				}
			}
			yield;
		}
	}

	get size() {
		return new Vector2();
	}

	*_renderToCanvas(ctx) {
		var tileWidth = this._tiledMap.tilewidth;
		for (var layer of this._groundLayers) {

			if(layer.type !== 'tilelayer')
				continue;

			if (!layer.visible || layer.opacity == 0)
				continue;

			ctx.globalAlpha = layer.opacity;

			for (var i = 0; i < layer.data.length; i++) {

				var tileId = layer.data[i];
				if (tileId == 0)
					continue;

				var tile = this._tiles[tileId],
					index = {
						x: i % layer.width,
						y: Math.floor(i / layer.width)
					};

				var drawScreenPoint = {
						x: index.x * tileWidth,
						y: index.y * tileWidth
					},
					drawSize = {
						width: tileWidth,
						height: tileWidth
					};

				ctx.drawImage(
					tile.texture,
					tile.x,
					tile.y,
					tile.width,
					tile.height,
					index.x * tileWidth,
					index.y * tileWidth,
					tile.width,
					tile.height,
				);

				if(i % layer.width == 0)
					yield;
			}
		}
	}

	//Render ground layers
	render(ctx) {
		ctx.drawImage(this._canvas, 0, 0);
	}
}

module.exports = TiledMap;