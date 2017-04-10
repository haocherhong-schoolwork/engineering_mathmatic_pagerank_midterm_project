const Framework = require('../Framework/Framework.js'),
	DataBall = require('./DataBall.js'),
	datasets = require('./data.json');

class Controller extends Framework.Component {

	map = new Map();

	currentDataset;
	sumOfRank;

	*start() {
		var index = 0;
		while(index < datasets.length) {
			yield new Framework.WaitForSeconds(1.0);
			this.setDataset(datasets[index]);
			index++;
		}
	}


	update() {
		
	}

	setDataset(dataset) {
		this.sumOfRank = dataset.reduce((acc, current) => {
			return acc + current.rank;
		}, 0);
		this.generateDataballs(dataset);
	}

	generateDataballs(dataset) {
		console.log(dataset.length);
		for (var node of dataset) {
			if (this.map.has(node.url)) {
				var dataBall = this.map.get(node.url);
				dataBall.node = node;
			} else {
				var gameObject = new Framework.GameObject(node.url);
				gameObject.parent = this.gameObject;
				// gameObject.position = new Framework.Vector2(Math.random() - 0.5, Math.random - 0.5).multi(10);
				var dataBall = new DataBall(node, this);
				gameObject.addComponent(dataBall);

				this.map.set(node.url, dataBall);
			}
		}
	}
}

module.exports = Controller;