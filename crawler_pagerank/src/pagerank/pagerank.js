const math = require('mathjs');

function rank2(M, d, v_quadratic_error) {
	var N = math.subset(math.size(M), math.index(1));
	var v = new Array(N);
	for (var i = 0; i < N; i++)
		v[i] = Math.random();

	v = math.divide(v, math.norm(v, 1));

	var last_v = new Array(N);
	for (var i = 0; i < N; i++)
		last_v[i] = Infinity;

	var M_hat = math.add((math.multiply(d, M)), (math.multiply(((1 - d) / N), math.ones(N, N))));
	while (math.norm(math.subtract(v, last_v), 2) > v_quadratic_error) {
		last_v = v;
		v = math.multiply(M_hat, v);
	}

	return v;
}

module.exports = function pageRank(m, d) {
	var M = math.matrix(m);
	var result = rank2(M, d, 0.001);
	return result._data;
}