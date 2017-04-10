const fs = require('fs'),
	md5 = require('md5'),
	model = require('../model.js');

require('es6-promise').polyfill();
require('isomorphic-fetch');

function printNodeToRoot(node) {
	if (node.parent)
		printNodeToRoot(node.parent);
	for (var i = 0; i < node.depth; i++) {
		process.stdout.write('  ');
	}
	process.stdout.write(node.url + '\n');
}

function isRelativeUrl(url) {
	return !/^https?:\/\//.test(url);
}

function absolute(base, relative) {

	if(/^(https?:)?\/\/[^\/]+$/.test(base))
		base += '/';

	var stack = base.split("/"),
		parts = relative.split("/");
	stack.pop(); // remove current file name (or empty string)
	// (omit if "base" is the current folder without trailing slash)
	for (var i = 0; i < parts.length; i++) {
		if (parts[i] == ".")
			continue;
		if (parts[i] == "..")
			stack.pop();
		else
			stack.push(parts[i]);
	}
	return stack.join("/");
}

function getSubNodes(node) {
	var match,
		links = [],
		tagRegex = /<a[^>]+\/?>[^<]+<\/a>/gi;
	while (match = tagRegex.exec(node.html)) {
		var tag = match[0];
		if (match = /href="([^"]+)"[^>]+>([^<]+)<\/a>/i.exec(tag)) {
			var url = match[1];
			if (/mailto:/.test(url))
				continue;
			if (isLinkNoFollow(tag)) {
				// console.log('detected nofollow on the tag');
				continue;
			}
			if (isRelativeUrl(url))
				url = absolute(node.url, url);
			if (/#/.test(url))
				url = url.substr(0, url.indexOf('#'));

			links.push({
				url,
				parent: node,
				text: match[2],
				visited: false,
				requesting: false,
				retried: 0
			});
		}
	}
	return links;
}

function isPageNoFollow(html) {
	var match,
		regex = /<meta[^>]+>/gi;
	while (match = regex.exec(html)) {
		var metaTag = match[0];
		if (/content="nofollow"/i.test(metaTag))
			return true;
	}
	return false;
}

function isLinkNoFollow(tag) {
	return /rel="nofollow"/i.test(tag);
}

async function travelPage(maxDepth = 5) {
	var queue = await model.Node.find({
		visited: false
	}).sort({
		depth: 1
	}).exec();
	var requesting = [];

	while (queue.length > 0 || (await model.Node.count({
			visited: false
		}) > 0)) {
		while (queue.length == 0 || requesting.length >= 20)
			await new Promise((resolve) => {
				setTimeout(resolve, 100)
			});

		var currentNode = queue.shift(1);

		if (currentNode.depth === maxDepth)
			continue;

		(async function visit(node) {
			printNodeToRoot(node);
			requesting.push(node);
			fetch(encodeURI(node.url))
				.then(response => response.text())
				.then(async function(html) {
					node.html = html;

					var match;
					if (match = /<title>([^<]+)<\/title>/i.exec(html))
						node.title = match[1];

					if (isPageNoFollow(html)) {
						console.log('detected nofollow on this page');
					} else {
						var subNodes = getSubNodes(node);
						for (var subNode of subNodes) {

							await model.Link.findOneAndUpdate({
								from: node.url,
								to: subNode.url
							}, {
								label: subNode.text,
								hash: md5(node.url + subNode.url)
							}, {
								upsert: true
							})

							var subNode = new model.Node(subNode);

							subNode.parent = node;
							subNode.depth = node ? node.depth + 1 : 0;

							//Check if it's not in nodes list
							if ((await model.Node.count({
									url: subNode.url
								})) == 0) {
								queue.push(subNode);
								await subNode.save();
							}
						}
					}
					node.visited = true;
					requesting.splice(requesting.indexOf(node), 1);
					await node.save();
				}).catch(async function(err) {
					if (false && node.retried < 5) {
						//retry
						console.log('retry in 1 second');
						await new Promise((resolve) => {
							setTimeout(resolve, 1000)
						});
						node.retried += 1;
						await node.save();
						visit(node);
					} else {
						//Give up
						console.error(err);
						console.log(requesting.length);
						requesting.splice(requesting.indexOf(node), 1);
						console.log(requesting.length);
					}
				});
		})(currentNode);
	}
}

async function main() {
	await model.connect();
	if (await model.Node.count() == 0) {
		var root = new model.Node({
			url: 'https://github.com/',
			visited: false,
			requesting: false,
			depth: 0,
			retries: 0
		});
		await root.save();
	}
	await travelPage();
	model.connection.close();
}

main();