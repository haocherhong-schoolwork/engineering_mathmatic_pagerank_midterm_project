const React = require('react'),
	ReactDom = require('react-dom'),
	Property = require('./property.jsx');

const Transform = (props) => {
	if(!props.gameObject)
		return null;
	const { gameObject } = props;

	return (
		<div>
			<Property name="Active" object={gameObject} property='active'/>
			<Property name="Instance ID" object={gameObject} property='instanceId'/>
			<Property name="Name" object={gameObject} property='name'/>
			<Property name="Tag" object={gameObject} property='tag'/>
			<Property name="Position" object={gameObject} property='position'/>
			<Property name="Rotation" object={gameObject} property='rotation'/>
			<Property name="Scale" object={gameObject} property='scale'/>
		</div>
	)
}

class Component extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			expanded: true
		}
		this.toggle = this.toggle.bind(this);
	}

	toggle() {
		this.setState({
			expanded: !this.state.expanded
		});
	}

	render() {
		const component = this.props.component;

		var visibleProperties = [];

		for(var p in component)
			if(!/^_/.test(p) && p !== 'name')
				visibleProperties.push(p);

		var prototype = component.constructor.prototype;

		while(prototype.constructor.name !== 'Component') {

			var descriptors = Object.getOwnPropertyDescriptors(prototype);

			for(var property in descriptors) {
				var descriptor = descriptors[property];
				if(descriptor.get !== undefined && visibleProperties.indexOf(property) == -1) {
					visibleProperties.push(property);
				}
			}

			prototype = prototype.__proto__;
		}

		const toggleStyle = {
			padding: '0 3px'
		};

		return (
			<div className="component">
				<h3>
					<span className="cursor" style={toggleStyle} onClick={()=>{this.toggle()}}>{this.state.expanded ? '-' : '+'}</span>
					<span className="cursor name" onClick={()=>{window.$ss = component}}>{component.constructor.name}</span>
				</h3>
				<div className="layer">
				{
					this.state.expanded && (
						visibleProperties.length > 0 ? (
							visibleProperties.map((property)=>{
								return <Property key={property} name={property} object={component} property={property}/>
							})
						) : (
							<span>Empty</span>
						)
					)
				}
				</div>
			</div>
		)
	}
}

class Inspector extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			seriousMode: false
		};
	}

	render() {
		const style = this.state.seriousMode ? {
			font: '12px Arial'
		} : {};
		return (
			<div className="inspector panel" style={style}>
				<header>
					<h2>Inspector</h2>
					<span>SERIOUS MODE</span>
					<input type="checkbox" checked={this.state.seriousMode} onChange={()=>{
						this.setState({
							seriousMode: !this.state.seriousMode
						})
					}}/>
				</header>
				<Transform {...this.props}/>
				{
					this.props.gameObject && this.props.gameObject._components.map((component, index)=>(
						<Component key={index} component={component}/>
					))
				}
			</div>
		);
	}
}

module.exports = Inspector;