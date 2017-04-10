console.log('loading Framework');

const Framework = {
	'Game':				require('./Game.js'),
	'Level':			require('./Level.js'),
	'Debug':			require('./Debug.js'),
	'Audio':			require('./Audio.js'),
	'MathUtils': 		require('./MathUtils.js'),
	'Animator':			require('./Components/Animator.js'),
	'ResourceManager':	require('./ResourceManager.js'),
	'Screen':			require('./Screen.js'),
	'Input':			require('./Input.js'),
	'Time':				require('./Time.js'	),
	'Physics':			require('./Physics/Physics.js'),
	'Vector2':			require('./Vector2.js'),
	'Rect':				require('./Rect.js'),
	'BaseObject':		require('./BaseObject.js'),
	'GameObject':		require('./GameObject.js'),
	'WaitForSeconds':	require('./WaitForSeconds.js'),
	//Components
	'Component':		require('./Component.js'),
	'Camera':			require('./Camera.js'),
	'Renderer':			require('./Components/Renderer.js'),
	'SpriteRenderer':	require('./Components/SpriteRenderer.js'),
	'TextRenderer':		require('./Components/TextRenderer.js'),
	'RectRenderer':		require('./Components/RectRenderer.js'),
	'CircleRenderer':	require('./Components/CircleRenderer.js'),
	'TiledMap':			require('./Components/TiledMap.js'),
	//Physics Components
	'Collider':			require('./Physics/Collider.js'),
	'BoxCollider':		require('./Physics/BoxCollider.js'),
	'CircleCollider':	require('./Physics/CircleCollider.js'),
	'PolygonCollider':	require('./Physics/PolygonCollider.js'),
	'Rigidbody':		require('./Physics/Rigidbody.js'),
};

console.log('Framework loaded');

module.exports = Framework;