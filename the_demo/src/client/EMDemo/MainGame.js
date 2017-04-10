const Framework = require('../Framework/Framework.js'),
	GameLevel = require('./GameLevel.js');

module.exports = async () => {
	var game = Framework.Game;
	game.addNewLevel({GameLevel: new GameLevel()});
	game.start();
}