const React = require('react'),
	Property = require('./property.jsx');

class ControlPanel extends React.Component {
	render() {
		var Framework = this.props.framework;
		if(!Framework)
			return null;
		return (
			<div className="control-panel panel">
				<h2>Control Panel</h2>
				<div className="layer">
					<Property name="Physics" object={Framework.Debug} property="renderPhysics"/>
					<Property name="Name" object={Framework.Debug} property="renderName"/>
					<Property name="Transform" object={Framework.Debug} property="renderTransform"/>
					<Property name="Selection Only" object={Framework.Debug} property="renderSelectionOnly"/>
					<Property name="Children" object={Framework.Debug} property="renderChildren"/>
					<Property name="Bounds" object={Framework.Debug} property="renderBounds"/>
					<Property name="Reference Point" object={Framework.Debug} property="renderReferencePoint"/>
					<Property name="Custom" object={Framework.Debug} property="renderCustom"/>
				</div>
			</div>
		);
	}
}

module.exports = ControlPanel;