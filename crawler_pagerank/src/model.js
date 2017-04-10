var mongoose = require('mongoose');

mongoose.Promise = global.Promise;

module.exports = {
	connection: mongoose.connection,
	connect: () => new Promise((resolve, reject) => {
		var db = mongoose.connection;
		db.once('open', resolve);
		db.on('error', reject);
		mongoose.connect('mongodb://localhost/emp1');
	})
};

var NodeSchema = new mongoose.Schema({
	url: {
		type: String,
		required: true,
		unique: true
	},
	title: String,
	html: String,
	visited: {
		type: Boolean,
		required: true,
		default: false
	},
	depth: {
		type: Number,
		required: true,
		default: 0,
		index: true
	},
	retried: {
		type: Number,
		required: true,
		default: 0
	},
	time: {
		type: Date,
		required: true,
		default: Date.now
	}
});

NodeSchema.index({depth: 1, date: 1});

var LinkSchema = new mongoose.Schema({
	from: {
		type: String,
		required: true,
		// index: true
	},
	to: {
		type: String,
		required: true,
		// index: true
	},
	label: String,
	time: {
		type: Date,
		required: true,
		default: Date.now
	},
	hash: {
		type: String,
		required: true,
		index: true,
		unique: true
	}
})

module.exports.Node = mongoose.model('Node', NodeSchema);
module.exports.Link = mongoose.model('Link', LinkSchema);