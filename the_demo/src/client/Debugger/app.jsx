const React = require('react'),
	ReactDom = require('react-dom'),
	Hierarchy = require('./hierarchy.jsx'),
	Inspector = require('./inspector.jsx'),
	ControlPanel = require('./controlPanel.jsx');

window.React = React;

class App extends React.Component {

	updateIntervalId;
	game;
	canvas;
	Framework;

	constructor(props) {
		super(props);
		this.state = {
			rootScene: null,
			selection: null
		};

		this.select = this.select.bind(this);
	}

	componentDidMount() {
		this.updateIntervalId = setInterval(this.update.bind(this), 100);
		document.addEventListener('keydown', this.onKeyDown.bind(this));
	}

	update() {
		if(!this.Framework && !window.Framework)
			return;

		if(!this.Framework) {
			//Init Framework
			Framework.Debug.renderDebugInfo = true;
			Framework.Debug.renderSelectionOnly = true;
			Framework.Debug.renderPhysics = false;

			this.Framework = Framework;

			this.game = Framework.Game;
			this.canvas = this.game._canvas;
			this.game.resizeEvent = this.onResize.bind(this);
		}
		

		if(!this.state.rootScene) {
			if(Framework.Game && Framework.Game._currentLevel) {
				this.setState({
					rootScene: Framework.Game._currentLevel.rootScene
				});
				this.state.rootScene._debugger = {
					expanded: true
				};
			}
		} else {
			//Force React to render
			this.forceUpdate();

			//Update gameObject list
			var previous = null;
			const travel = (gameObject) => {
				if(!gameObject._debugger)
					gameObject._debugger = {};

				if(previous)
					previous._debugger.next = gameObject;
				gameObject._debugger.previous = previous;
				previous = gameObject;

				if(gameObject._debugger.expanded) {
					for(var child of gameObject._children)
						travel(child);
				}
			}

			travel(this.state.rootScene);
		}
	}

	onKeyDown(e) {
		// console.log(e);
		switch(e.key) {
			case 'Delete':
				if(this.state.selection !== null) {
					this.Framework.BaseObject.destroy(this.state.selection);
					this.select(this.state.selection._debugger.previous);
				}
				break;
			case 'ArrowUp':
				if(this.state.selection && this.state.selection._debugger.previous)
					this.select(this.state.selection._debugger.previous)
				break;
			case 'ArrowDown':
				if(this.state.selection && this.state.selection._debugger.next)
					this.select(this.state.selection._debugger.next)
				break;
			case 'ArrowRight':
				if(this.state.selection) {
					this.state.selection._debugger.expanded = true;
					this.forceUpdate();
				}
				break;
			case 'ArrowLeft':
				if(this.state.selection) {
					this.state.selection._debugger.expanded = false;
					this.forceUpdate();
				}
				break;
		}

	}

	onResize() {
		var base = 0,
			baseWidth = (window.innerWidth - 600) / this.canvas.width,
			baseHeight = window.innerHeight / this.canvas.height,
			scaledWidth = 0,
			scaledHeight = 0;
		if (baseWidth < baseHeight) {
			base = baseWidth;
		} else {
			base = baseHeight;
		}

		scaledWidth = Math.round(base * this.canvas.width);
		scaledHeight = Math.round(base * this.canvas.height);
		this.game._widthRatio = scaledWidth / this.canvas.width;
		this.game._heightRatio = scaledHeight / this.canvas.height;
		this.canvas.style.width = scaledWidth + 'px';
		this.canvas.style.height = scaledHeight + 'px';
	}

	componentWillUnmount() {
		clearInterval(this.updateIntervalId);
	}

	select(gameObject) {
		if(this.state.selection == gameObject)
			gameObject = null;
		this.setState({
			selection: gameObject
		});
		Framework.Debug.selection = gameObject;
		window.$ss = gameObject;
	}

	render() {
		return (
			<div className="wrapper">
				<div className="side-panel">
					<Hierarchy root={this.state.rootScene} selection={this.state.selection} onSelect={this.select}/>
					<ControlPanel framework={this.Framework}/>
				</div>
				<div id="main-container"/>
				<div className="side-panel">
					<Inspector gameObject={this.state.selection}/>
				</div>
			</div>
		);
	}
}

ReactDom.render(<App/>, document.getElementById('app'));