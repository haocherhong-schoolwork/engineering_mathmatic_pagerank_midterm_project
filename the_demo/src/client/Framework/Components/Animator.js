const Util = require('../Util.js'),
	Game = require('../Game.js'),
	Component = require('../Component.js'),
	SpriteRenderer = require('./SpriteRenderer.js');

class Animator extends Component {

	_animations = null;

	_progress = 0;

	_currentAnimation = null;
	_beginTime = null;

	_currentOneShotAnimation = null;
	_oneShotAnimationBeginTime = null;

	_frameInAnimation = 0;

	_loop;

	constructor(defaultFramesetId, deafultAnimationId, animations) {
		super();

		if (typeof(defaultFramesetId) !== 'string')
			throw new Error('Invalid argument, default frameset id string as first parameter expected');

		if (typeof(deafultAnimationId) !== 'string')
			throw new Error('Invalid argument, default animation id string as second parameter expected');

		if (typeof(animations) !== 'object')
			throw new Error('Invalid argument, array of animations as second parameter expected');

		for(var framesetId in animations) {
			var frameset = animations[framesetId];
			for(var animationId in frameset) {
				var animation = animations[framesetId][animationId];

				if(typeof(animation.beginFrame) !== 'number')
					throw new Error('Invalid animation, beginFrame number property expected');

				if(typeof(animation.framesNumber) !== 'number')
					throw new Error('Invalid animation, framesNumber number property expected');

				if(typeof(animation.fps) !== 'number')
					throw new Error('Invalid animation, fps number property expected');

				animation.framesetId = framesetId;
				animation.name = animationId;
				animation.duration = 1 / animation.fps * animation.framesNumber;
			}
		}
		this._animations = animations;

		this.setAnimation(defaultFramesetId, deafultAnimationId)
	}

	get playingOneShotAnimationName() {
		return this._currentOneShotAnimation && this._currentOneShotAnimation.name;
	}

	get isPlayingOneShotAnimation() {
		return this._currentOneShotAnimation != null;
	}

	get progress() {
		return this._progress;
	}

	get frameInAnimation() {
		return this._frameInAnimation;
	}

	get loop() {
		return this._loop;
	}

	set loop(value) {
		if(typeof(value) !== 'boolean')
			throw new Error('Invalid argument, boolean expected');
		this._loop = value;
	}

	setAnimation(framesetId, animationId, loop = true) {
		if (typeof(framesetId) !== 'string')
			throw new Error('Invalid argument, frameset id string expected');
		
		if (typeof(animationId) !== 'string')
			throw new Error('Invalid argument, animation id string expected');

		if(this._animations[framesetId] === undefined)
			throw new Error('Frameset is not found');

		if(this._animations[framesetId][animationId] === undefined)
			throw new Error('Animation is not found');

		if(this._currentAnimation == this._animations[framesetId][animationId])
			return;

		this._loop = loop;

		this._currentAnimation = this._animations[framesetId][animationId];
		this._beginTime = Date.now();
	}

	playOneShotAnimation(framesetId, animationId) {
		if (typeof(framesetId) !== 'string')
			throw new Error('Invalid argument, frameset id string expected');
		
		if (typeof(animationId) !== 'string')
			throw new Error('Invalid argument, animation id string expected');

		if(this._animations[framesetId] === undefined)
			throw new Error('Frameset is not found');

		if(this._animations[framesetId][animationId] === undefined)
			throw new Error('Animation is not found');

		this._currentOneShotAnimation = this._animations[framesetId][animationId];
		this._oneShotAnimationBeginTime = Date.now();
	}

	start() {
		// this.setAnimation(this._deafultAnimation);
	}

	update() {
		var renderer = this.gameObject.renderer;

		if(!renderer || !(renderer instanceof SpriteRenderer))
			return;

		var animation,
			deltaTime,
			time = Date.now();

		if(this._currentOneShotAnimation) {
			//Animator is playing one shot animation
			animation = this._currentOneShotAnimation;
			deltaTime = (time - this._oneShotAnimationBeginTime) / 1000;
			let frameInAnimation = Math.floor(deltaTime / (1 / animation.fps));

			//Check if one shot animation is over. If so, cancel it.
			if(frameInAnimation >= animation.framesNumber)
				this._currentOneShotAnimation = null;
		}

		//animation may be cancelled, check again
		if(!this._currentOneShotAnimation) {
			//Animator is playing normal animation
			animation = this._currentAnimation;

			deltaTime = (time - this._beginTime) / 1000;
		}

		//Update progress
		this._progress = deltaTime / animation.duration;

		if(this._loop)
			this._frameInAnimation = Math.floor(deltaTime / (1 / animation.fps)) % animation.framesNumber;
		else
			this._frameInAnimation = Math.min(Math.floor(deltaTime / (1 / animation.fps)), animation.framesNumber - 1);

		renderer.currentFramesetId = animation.framesetId;
		renderer.currentFrame = this._frameInAnimation + animation.beginFrame;
	}
}

module.exports = Animator;