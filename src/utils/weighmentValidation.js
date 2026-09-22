const normalizeHasGoods = (value, orderItems = []) => {
  if (typeof value === "boolean") return value;
  return orderItems.some((item) => Number(item?.quantity ?? item?.measurement) > 0);
};

const getProductId = (item) => item?.product_id ?? item?.product ?? item?.id;

const validateCargo = ({ hasGoods, orderItems = [] }) => {
  if (!Array.isArray(orderItems)) {
    return "order_items must be an array";
  }

  if (!hasGoods) {
    if (orderItems.length > 1) {
      return "An empty first weight can have at most one optional product";
    }
    return null;
  }

  if (orderItems.length === 0 || orderItems.some((item) => !getProductId(item))) {
    return "A loaded vehicle must have a product";
  }

  if (
    orderItems.some((item) => {
      const bags = Number(item.quantity ?? item.measurement);
      return !Number.isInteger(bags) || bags < 1;
    })
  ) {
    return "A loaded vehicle must have at least 1 bag for every product";
  }

  return null;
};

const assertLockedProducts = (existingItems, submittedItems) => {
  if (!existingItems.length) return null;
  const existing = new Set(existingItems.map(getProductId).map(String));
  const submitted = new Set(submittedItems.map(getProductId).map(String));
  if (
    existing.size !== submitted.size ||
    [...existing].some((productId) => !submitted.has(productId))
  ) {
    return "The product selected on the empty first weight is locked and cannot be changed";
  }
  return null;
};

module.exports = {
  assertLockedProducts,
  getProductId,
  normalizeHasGoods,
  validateCargo,
};
