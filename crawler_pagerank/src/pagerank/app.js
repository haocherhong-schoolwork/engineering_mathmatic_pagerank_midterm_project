const 
	fs = require('fs'),
	model = require('../model.js'),
	pageRank = require('./pageRank.js');

const maxDocNumber = 100;

async function createMatrix(nodes) {

	var map = new Map();
	for (var i = 0; i < nodes.length; i++)
		map.set(nodes[i].url, i);

	var allUrls = nodes.map(node => node.url);

	var matrix = new Array(nodes.length);

	for (var row = 0; row < matrix.length; row++) {
		matrix[row] = new Array(nodes.length);

		for (var col = 0; col < matrix.length; col++)
			matrix[row][col] = 0;
	}

	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		var links = await model.Link.find({
			from: node.url,
			to: {
				$in: allUrls,
				$ne: node.url
			},

		});

		for (var link of links) {
			var index = map.get(link.to);
			matrix[index][i] = 1 / links.length;
		}
	}

	return matrix;
}

async function getResultSet(nodes) {

	nodes = [...nodes];

	var matrix = await createMatrix(nodes);

	var ranks = pageRank(matrix, 0.85);

	for (var i = 0; i < nodes.length; i++) {
		nodes[i].rank = ranks[i];
	}

	nodes.sort((a, b) => (b.rank - a.rank));

	return nodes;
}

async function getSubNodes(node) {
	var links = await model.Link.find({
		from: node.url
	}).lean();

	var subNodesUrls = links.map(link => link.to);

	var subNodes = await model.Node.find({
		visited: true,
		url: {
			$in: subNodesUrls
		}
	}, {
		_id: 0,
		title: 1,
		url: 1,
	}).lean().exec();

	return subNodes;
}

async function travel(root) {
	var S = [],
		Q = [],
		visited = [];

	// root.parent = null;
	S.push(root.url);
	Q.push(root);

	var results = [];

	while (Q.length > 0) {
		if (visited.length > maxDocNumber)
			return results;

		var current = Q.shift(1);
		var subNodes = await getSubNodes(current);

		for (var node of subNodes) {
			if (S.indexOf(node.url) === -1) {
				S.push(node.url);
				// node.parent = current;
				Q.push(node)
			}
		}

		console.log(visited.length);
		visited.push(current);

		var visitedUrls = visited.map(node=>(node.url));
		current.subNodes = subNodes.map(subNode=>(subNode.url));

		var result = await getResultSet(visited);
		results.push(result)
	}

	return results;
}

async function main() {
	await model.connect();

	fs.writeFile('results.json', 'yolo');

	var root = (await model.Node.find({}, {
		_id: 0,
		title: 1,
		url: 1,
	}).sort({
		time: 1
	}).lean().exec())[0];

	var results = await travel(root);
	fs.writeFile('results.json', JSON.stringify(results, null, '\t'));

	model.connection.close();
}

main();