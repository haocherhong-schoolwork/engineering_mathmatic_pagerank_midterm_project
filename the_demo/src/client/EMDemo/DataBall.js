const Framework = require('../Framework/Framework.js');

class DataBall extends Framework.Component {

	node;
	controller;

	count = 0;

	drawIncoming = false;

	label;

	constructor(node, controller) {
		super();

		this.node = node;
		this.controller = controller;
	}

	start() {
		this.gameObject.scale = this.node.rank / this.controller.sumOfRank * 10;
		var renderer = new Framework.CircleRenderer(50);
		var collider = new Framework.CircleCollider(50);
		var rigidbody = new Framework.Rigidbody();
		rigidbody.allowSleep = false;
		this.gameObject.addComponent(renderer);
		this.gameObject.addComponent(collider);
		this.gameObject.addComponent(rigidbody);

		this.label = new Framework.GameObject('label');
		var textRenderer = new Framework.TextRenderer(this.node.title && this.node.title.substr(0, 10), {
			origin: 'middleCenter',
			renderPriority: 2
		});
		this.label.addComponent(textRenderer);
}
	update() {

		var rankRatio = this.node.rank / this.controller.sumOfRank,
			r = Math.round(Framework.MathUtils.lerp(255, 255, rankRatio * 2)),
			g = Math.round(Framework.MathUtils.lerp(255, 0, rankRatio * 2)),
			b = Math.round(Framework.MathUtils.lerp(255, 0, rankRatio * 2)),
			color = 'rgb(' + r + ', ' + g + ', ' + b + ')';

		this.gameObject.renderer.color = 'rgb(' + r + ', ' + g + ', ' + b + ')';

		this.label.position = this.gameObject.absolutePosition;

		var validSubNodes = this.node.subNodes.filter(url=>this.controller.map.has(url));

		if(this.gameObject === Framework.Debug.selection || Framework.Debug.selection === null) {
			if(this.drawIncoming) {
				for(var otherDataBall of this.controller.map.values()) {
					if(otherDataBall.node.subNodes.some(url=>url === this.node.url)) {
						Framework.Debug.drawLine(this.gameObject.absolutePosition, otherDataBall.gameObject.absolutePosition, 'green', 0, (1 / otherDataBall.node.subNodes.length) * 9 + 1);
					}
				}
			} else {
				for(var subNodeUrl of validSubNodes) {
					var subNode = this.controller.map.get(subNodeUrl);
					Framework.Debug.drawLine(this.gameObject.absolutePosition, subNode.gameObject.absolutePosition, 'red', 0, (1 / this.node.subNodes.length * 9) + 1);
				}
			}

			if(Framework.Input.getKey(0)) {
				var mousePosition = Framework.Camera.main.screenToWorldPoint(Framework.Input.mousePosition);
				this.gameObject.rigidbody.addForce(mousePosition.sub(this.gameObject.absolutePosition).multi(5 * this.gameObject.rigidbody.mass));
			}
		}

		var targetScale = Math.sqrt(rankRatio * 50);
		this.gameObject.scale = targetScale;
	}
}

module.exports = DataBall;