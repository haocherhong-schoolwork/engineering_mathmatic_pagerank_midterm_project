const React = require('react'),
	ReactDom = require('react-dom');

class GameObject extends React.Component {

	constructor(props) {
		super(props);
		this.toggle = this.toggle.bind(this);
	}

	toggle() {
		var gameObject = this.props.gameObject;
		gameObject._debugger.expanded = !gameObject._debugger.expanded;
		this.forceUpdate();
	}

	render() {
		var gameObject = this.props.gameObject;
		if(!gameObject)
			return null;

		var expanded = gameObject._debugger && gameObject._debugger.expanded;

		var name = gameObject.name.length > 0 ? gameObject.name : '(Empty)',
			selected = this.props.selection === gameObject;

		var style = {
			background: selected ? 'gray' : 'none'
		};

		return (
			<div className="gameobject">
				<header className={(selected ? 'selected' : '') + (gameObject.active ? '' : ' disactive')}>
					{
						gameObject._children.length > 0 && (
							<span onClick={()=>{this.toggle()}}>{expanded ? '-' : '+'} </span>
						)
					}
					<span className="name" onClick={()=>{this.props.onSelect(gameObject)}}>{ name }</span>
				</header>
				{
					expanded && (
						<ul>
						{
							gameObject._children.map((gameObject, index)=>{
								return (
									<li key={index}>
										<GameObject gameObject={gameObject} selection={this.props.selection} onSelect={this.props.onSelect}/>
									</li>
								)
							})
						}
						</ul>
					)
				}
			</div>
		)
	}
}

const Hierarchy = (props) => (
	<div className="hierarchy panel">
		<header>
			<h2>Hierarchy</h2>
		</header>
		<GameObject gameObject={props.root} selection={props.selection} onSelect={props.onSelect}/>
	</div>
)

module.exports = Hierarchy;