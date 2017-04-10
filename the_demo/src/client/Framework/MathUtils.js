const Vector2 = require('./Vector2.js');

class MathUtils {
	static lerp(a, b, t) {
		return a + t * (b - a);
	}

	static inverseLerp(a, b, x) {
		return Math.max(0, Math.min(1, (x - a) / (b - a)));
	}

	/*
	x     - value             (input/output)
	v     - velocity          (input/output)
	xt    - target value      (input)
	zeta  - damping ratio     (input)
	omega - angular frequency (input)
	h     - time step         (input)
	*/
	static spring(x, v, xt, zeta, omega, h) {
		const f = 1 + 2 * h * zeta * omega,
			oo = omega * omega,
			hoo = h * oo,
			hhoo = h * hoo,
			detInv = 1 / (f + hhoo),
			detX = f * x + h * v + hhoo * xt,
			detV = v + hoo * (xt - x);
		x = detX * detInv;
		v = detV * detInv;
		
		return {
			value: x,
			velocity: v
		};
	}

	static damp(x, v, xt, h, f, pd, td) {
		const omega = 2 * Math.PI * f,
			zeta = Math.log(pd) / (-omega * td);
		return MathUtils.spring(x, v, xt, zeta, omega, h);
	}

	static smoothDamp(x, v, xt, h) {
		return MathUtils.damp(x, v, xt, h, 1, 0.1, 0.5);
	}

	static get rad2Deg() {
		return 180 / Math.PI;
	}

	static get deg2Rad() {
		return Math.PI / 180;
	}
}

module.exports = MathUtils;