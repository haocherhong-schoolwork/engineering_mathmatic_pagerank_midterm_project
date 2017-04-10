const Vector2 = require('./Vector2.js'),
	Game = require('./Game.js'),
	BaseObject = require('./BaseObject.js'),
	Renderer = require('./Components/Renderer.js'),
	Rigidbody = require('./Physics/Rigidbody.js'),
	Collider = require('./Physics/Collider.js');

class GameObject extends BaseObject {
	
	//Stores gameobjects in corresponding tag
	static _tagsGameObjects = {
		'Untagged': []
	};

	//Members
	_tag = 'Untagged';

	//Transform
	_position = new Vector2();
	_rotation = 0;
	_scale = 1;

	_absolutePosition = new Vector2();
	_absoluteRotation = this._rotation;
	_absoluteScale = this._scale;

	//Dirty flags
	_isRotate = true;
	_isScale = true;
	_isMove = true;
	_changeFrame = true;

	_isAbsolutePositionDirty = false;
	_isAbsoluteRotationDirty = false;
	_isAbsoluteScaleDirty = false;

	//Activation
	active = true;

	//Gameobject Relationships
	_parent = null;
	_children = [];

	//Components
	_components = [];
	_renderer = null;
	_rigidbody = null;
	_collider = null;

	constructor(name) {
		super(name);

		//Push to gameObject collection of default tag
		GameObject._tagsGameObjects[this._tag].push(this);

		//Put self to current level if level created
		if(Game._currentLevel != null)
			this.parent = Game._currentLevel.rootScene;
	}

	static find(name) {
		const rootScene = Game && Game._currentLevel.rootScene;
		if(!rootScene)
			return null;

		var _find = (gameObject) => {
			if(gameObject.name == name)
				return gameObject;

			for(var child of gameObject._children) {
				var result = _find(child);
				if(result)
					return result;
			}
		}

		return _find(rootScene);
	}

	static findGameObjectsWithTag(tag) {
		if(GameObject._tagsGameObjects[tag])
			return [...GameObject._tagsGameObjects[tag]];
		else
			return [];
	}

	get parent() {
		return this._parent;
	}

	set parent(newParent) {
		if(newParent == this._parent)
			return;

		if(newParent == this)
			throw 'Cannot set object itself as its parent';

		if(newParent != null && !(newParent instanceof GameObject))
			throw 'Parent must be a GameObject';

		//Detach
		if(this.parent != null)
			this.parent._children.splice(this.parent._children.indexOf(this), 1);

		//Push
		if(newParent != null)
			newParent._children.push(this);

		this._parent = newParent;

		//Set level
		if(newParent != null)
			this._level = newParent._level;

		this._isAbsolutePositionDirty = true;
		this._isAbsoluteRotationDirty = true;
		this._isAbsoluteScaleDirty = true;
	}

	get children() {
		return this._children;
	}

	get level() {
		return this._level;
	}

	get renderer() {
		return this._renderer;
	}

	get collider() {
		return this._collider;
	}

	get rigidbody() {
		return this._rigidbody;
	}

	get absolutePosition() {
		if(this._isAbsolutePositionDirty ||
			// (this.parent && (
			// 	this.parent._isMove ||
			// 	this.parent._isRotate ||
			(this.parent && this.parent.isObjectChanged)) {


			if(this.parent) {
				var	rad = (this.parent.absoluteRotation / 180) * Math.PI;
				this._absolutePosition = new Vector2(
					Math.floor((this._position.x * Math.cos(rad) - this._position.y * Math.sin(rad))) * this.parent.absoluteScale + this.parent.absolutePosition.x,
					Math.floor((this._position.x * Math.sin(rad) + this._position.y * Math.cos(rad))) * this.parent.absoluteScale + this.parent.absolutePosition.y
				);
			} else {
				this._absolutePosition = this._position;
			}
			this._isAbsolutePositionDirty = false;
		}
		return this._absolutePosition;
	}

	get absoluteRotation() {
		if(this._isAbsoluteRotationDirty ||
			(this.parent && (
				this.parent._isRotate))) {

			if(this.parent) {
				this._absoluteRotation = this._rotation + this.parent.absoluteRotation;
			} else {
				this._absoluteRotation = this._rotation;
			}
			this._isAbsoluteRotationDirty = false;
		}
		return this._absoluteRotation;
	}

	get absoluteScale() {
		if(this._isAbsoluteScaleDirty ||
			(this.parent && (
				this.parent._isScale))) {
			
			if(this.parent) {
				this._absoluteScale = this._scale * this.parent.absoluteScale;
			} else {
				this._absoluteScale = this._scale;
			}
			this._isAbsoluteScaleDirty = false;
		}
		return this._absoluteScale;
	}

	get tag() {
		return this._tag;
	}

	set tag(value) {
		if(typeof(value) !== 'string')
			throw new Error('Invalid argument, string expected');

		if(this._tag === value)
			return;

		//Remove from collection of old tag
		GameObject._tagsGameObjects[this._tag].splice(GameObject._tagsGameObjects[this._tag].indexOf(this), 1);

		//Push to collection of new tag
		if(!GameObject._tagsGameObjects[value])
			GameObject._tagsGameObjects[value] = [];
		GameObject._tagsGameObjects[value].push(this);

		//Update current tag
		this._tag = value;
	}

	get isObjectChanged() {
		var isParentChanged = this.parent && this.parent.isObjectChanged;

		return this._isRotate || this._isScale || this._isMove || this._changeFrame || isParentChanged;
	}

	get position() {
		return this._position;
	}

	set position(value) {
		if(!value || value.constructor !== Vector2)
			throw new Error('Invalid argument, Vector2 expected');

		if(this._position._x == value._x && this._position._y == value._y)
			return;

		this._position = value;
		this._isMove = true;
		this._isAbsolutePositionDirty = true;
	}

	get rotation() {
		return this._rotation;
	}

	set rotation(value) {
		if(typeof(value) !== 'number')
			throw new Error('Invalid argument, number expected');

		if(this._rotation === value)
			return;

		this._rotation = value;
		this._isRotate = true;
		this._isAbsoluteRotationDirty = true;
	}

	get scale() {
		return this._scale;
	}

	set scale(value) {
		if(typeof(value) !== 'number')
			throw new Error('Invalid argument, number expected');

		if(this._scale === value)
			return;

		this._scale = value;
		this._isScale = true;
		this._isAbsoluteScaleDirty = true;
	}

	get isAbsolutePositionChanged() {
		return this._isMove || (this.parent && this.parent.isAbsolutePositionChanged);
	}

	get isAbsoluteScaleChanged() {
		return this._isScale || (this.parent && this.parent.isAbsoluteScaleChanged);
	}

	get isAbsoluteRotationChanged() {
		return this._isRotate || (this.parent && this.parent.isAbsoluteRotationChanged);
	}

	addComponent(component) {
		if(component.gameObject != null)
			throw 'The component is already attached to an object';

		if(component instanceof Renderer) {
			if(this._renderer)
				throw 'Only one renderer can be added to a GameObject';
			else
				this._renderer = component;
		}

		if(component instanceof Collider) {
			if(this._collider)
				throw 'Only one collider can be added to a GameObject';
			else
				this._collider = component;
		}

		if(component instanceof Rigidbody) {
			if(this._rigidbody)
				throw 'Only one rigidbody can be added to a GameObject';
			else
				this._rigidbody = component;
		}

		this._components.push(component);

		//add component to newComponents list for start call
		// console.log(this._level._newComponents);
		this._level._newComponents.push(component);

		component._gameObject = this;
	}

	//This will only be called by Component._destroy
	_removeComponent(component) {
		var index = this._components.indexOf(component);
		if(index === -1)
			throw new Error('Component not found in gameObject');
		this._components.splice(index, 1);
	}

	getComponent(findClass) {
		for(var component of this._components)
			if(component.constructor == findClass)
				return component;
	}

	sendMessage(methodName) {
		for(var component of this._components) {
			if(component.enabled && typeof(component[methodName]) === 'function') {
				component[methodName].apply(component, [...arguments].slice(1));
			}
		}
	}

	//This will be called by BaseObject.destroy
	_destroy() {
		this.parent = null;

		//remove from collection of current tag
		GameObject._tagsGameObjects[this._tag].splice(GameObject._tagsGameObjects[this._tag].indexOf(this), 1);

		for(var child of this._children)
			BaseObject.destroy(child);

		//Destroy all components
		//Copy the list first, because the original array will be altered.
		var components = [...this._components];
		for(var component of components)
			BaseObject.destroy(component);
	}

	clearDirtyFlag() {
		this._isRotate = false;
		this._isScale = false;
		this._isMove = false;
		this._changeFrame = false;
	}

	toTreeString() {
		var getString = (gameObject, depth) => {
			var str = '';
			for(var i = 0; i < depth; i++)
				str += '\t';
			str += gameObject.toString() + '\n';
			
			gameObject._children.forEach((child, index)=>{
				str += getString(child, depth + 1);
				if(index != gameObject._children.length -1)
					str += '\n';
			});

			return str;
		}
		return getString(this, 0);
	}
}



module.exports = GameObject;