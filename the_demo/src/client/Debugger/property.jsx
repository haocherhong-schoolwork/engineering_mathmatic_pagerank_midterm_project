const React = require('react');

class Property extends React.Component {

	constructor(props) {
		super(props);

		this.onNameClick = this.onNameClick.bind(this);
		this.onValueClick = this.onValueClick.bind(this);
	}

	onNameClick(e) {
		var { object, property } = this.props,
			value = object[property];
		window.$ss = value;
	}

	onValueClick(e) {
		var { object, property } = this.props,
			value = object[property];
		if(typeof(value) === 'boolean') {
			object[property] = !value;
		}
	}

	render() {
		var { object, property, name } = this.props,
			value = object[property];
		var text;
		if(value === undefined)
			text = 'undefined';
		else if(value === null)
			text = 'null';
		else
			text = value.toString();

		return (
			<div className="property cursor" onClick={this.onNameClick}>
				<h4>{name}</h4>
				<div className="layer" onClick={this.onValueClick}>
					{text}
				</div>
			</div>
		);
	}
}

module.exports = Property;