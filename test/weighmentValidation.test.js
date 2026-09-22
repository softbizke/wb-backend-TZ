const assert = require("node:assert/strict");
const {
  assertLockedProducts,
  normalizeHasGoods,
  validateCargo,
} = require("../src/utils/weighmentValidation");

assert.equal(normalizeHasGoods(false, [{ id: 18 }]), false);
assert.equal(normalizeHasGoods(undefined, []), false);
assert.equal(normalizeHasGoods(undefined, [{ id: 18, quantity: 1 }]), true);

assert.equal(validateCargo({ hasGoods: false, orderItems: [] }), null);
assert.equal(
  validateCargo({ hasGoods: false, orderItems: [{ id: 18 }] }),
  null,
);
assert.match(
  validateCargo({ hasGoods: true, orderItems: [{ id: 18, quantity: 0 }] }),
  /at least 1 bag/,
);
assert.match(
  validateCargo({ hasGoods: true, orderItems: [{ id: 18, quantity: 1.5 }] }),
  /at least 1 bag/,
);
assert.equal(
  validateCargo({ hasGoods: true, orderItems: [{ id: 18, quantity: 1 }] }),
  null,
);

assert.equal(
  assertLockedProducts([{ product_id: 18 }], [{ id: 18, quantity: 2 }]),
  null,
);
assert.match(
  assertLockedProducts([{ product_id: 18 }], [{ id: 2, quantity: 2 }]),
  /locked/,
);

console.log("weighment validation tests passed");
