const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Address = require("../models/addressesModel");
const Product = require("../models/productModels");

const walletModel = require("../models/walletModel");

const generateResultsHTML = (items) => {
  let html = "";
  items.forEach((item) => {
    html += `<div class="row" id="productsGrid">
    {{#each products}}
    <div class="col-md-4">
      <div class="card mb-4">
        <a href="/load-product?id=${item._id}">
          <img src="/uploads/${item.images[0]}" alt="img" class="card-img-top fixed-height-image" />
        </a>
        <div class="card-body">
          <h4 class="card-title">${this.brand}</h4>
          <h5 class="card-title">${this.productname}</h5>
          <span>₹${item.price}</span>
          <p class="card-text"></p>
          <a href="/load-product?id=${this._id}" class="btn btn-dark">view</a>
        </div>
      </div>
    </div>
    {{/each}}
  </div>
</div>`;
  });
  return html;
};
module.exports = {
  walletBalance: (userId) => {
    console.log("wallet balance");
    return new Promise(async (resolve, reject) => {
      try {
        const walletBalance = await walletModel.findOne({ userId });
        console.log(walletBalance, "wallet balance");

        if (walletBalance === null) {
          resolve(0);
        } else {
          const walletAmount = walletBalance.walletAmount;
          resolve(walletAmount);
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  updatewallet: (userId, orderId) => {
    console.log("reached helper for wallet");
    return new Promise(async (resolve, reject) => {
      try {
        const orderdetails = await Order.findOne({ _id: orderId });
        console.log(orderdetails, "orderdetails");
        const wallet = await walletModel.findOne({ userId: userId });
        console.log(wallet, "wallet is this");
        if (wallet) {
          const updatedWalletAmount =
            wallet.walletAmount - orderdetails.orderValue;
          const updatedWallet = await walletModel.findOneAndUpdate(
            { userId: userId },
            { $set: { walletAmount: updatedWalletAmount } }
          );
          console.log(updatedWalletAmount, "updatedWalletAmount");

          resolve(updatedWalletAmount);
        } else {
          reject("wallet not find");
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  updateProductStock: async (orderedProducts) => {
    try {
      console.log("reached updatedproductstock");
      for (const orderedProduct of orderedProducts) {
        const productId = orderedProduct.productId;
        const quantity = orderedProduct.quantity;

        // Find the product by its ID
        const product = await Product.findById(productId);

        // Update the product stock by subtracting the ordered quantity
        product.inStock -= quantity;

        // Save the updated product
        await product.save();
      }
    } catch (error) {}
  },
  listProducts: async (req, res) => {
    try {
      const products = await Product.find();
      console.log(products);
      let query = [];
      console.log(products.category, "products.category");
      console.log(products.productname, "product name");
      if (req.query.searchKeyword && req.query.searchKeyword !== "") {
        query.push({
          $match: {
            $or: [
              {
                productname: {
                  $regex: req.query.searchKeyword,
                  $options: "i",
                },
              },
            ],
          },
        });
      }
      if (req.query.category && req.query.category !== "") {
        query.push({
          $match: { category: req.query.category },
        });
      }

      let sortField = req.query.sortBy;
      let sortQuery = {};

      if (sortField === "productname") {
        sortQuery = { category: 1, product_name: 1 };
      } else if (sortField === "product_price") {
        sortQuery = { category: 1, product_price: 1 };
      }

      if (Object.keys(sortQuery).length > 0) {
        query.push({ $sort: sortQuery });
      }
      console.log(query, "query");

      let shopItems = await Product.aggregate(query);

      if (shopItems.length < 1) {
        req.session.message = {
          type: "error",
          message:
            "Oops! We couldn't find any products matching the identifier you provided",
        };
        res.redirect("/home");
        return;
      }

      console.log("Entered into the shop page", shopItems);
      let resultsHTML = generateResultsHTML(shopItems);
      return resultsHTML;
    } catch (error) {
      throw error;
    }
  },
};
