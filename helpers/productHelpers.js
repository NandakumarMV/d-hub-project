module.exports = {
  updateSerialNumbers: (products) => {
    return products.map((product, index) => ({
      ...product,
      serialNumber: index + 1,
    }));
  },
  updateCategorySerialNumbers: (categories) => {
    return categories.map((category, index) => ({
      ...category,
      serialNumber: index + 1,
    }));
  },
};
