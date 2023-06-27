const Cart = require("../models/cartModel");
const Product = require("../models/productModels");
const mongoose = require("mongoose");

module.exports = {
  addToCart: async (req, res) => {
    try {
      console.log("cart loading");
      const proId = req.body.productId;
      console.log(proId, "id is coming");

      let cart = await Cart.findOne({ User_id: req.session.user_id });
      console.log(cart);
      if (!cart) {
        let newCart = new Cart({ User_id: req.session.user_id, products: [] });
        await newCart.save();
        cart = newCart;
      }

      const existingProductIndex = cart.products.findIndex((product) => {
        return product.productId.toString() === proId;
      });
      console.log(existingProductIndex, "existingProductIndex");
      if (existingProductIndex === -1) {
        const product = await Product.findById(proId).lean();
        const total = product.price; // Set the initial total to the price of the product
        cart.products.push({
          productId: proId,
          quantity: 1,
          total, // Use the updated total value
        });
      } else {
        cart.products[existingProductIndex].quantity += 1;
        const product = await Product.findById(proId).lean();
        cart.products[existingProductIndex].total += product.price; // Update the total by adding the price of the product
      }

      // Calculate the updated total amount for the cart
      cart.total = cart.products.reduce((total, product) => {
        return total + product.total;
      }, 0);

      await cart.save();
      console.log(cart);

      // Send a response indicating success or any other relevant data
      res.status(200).json({ message: "Product added to cart successfully" });
    } catch (error) {
      // Handle any errors that occurred during the process
      res.status(500).json({ error: error.message });
    }
  },

  loadingCartPage: async (req, res) => {
    try {
      console.log("entered loading cart page");
      const check = await Cart.findOne({ User_id: req.session.user_id });

      // console.log("checking no 1", check, "this is cart");
      if (check) {
        const cart = await Cart.findOne({ User_id: req.session.user_id })
          .populate({
            path: "products.productId",
          })
          .lean()
          .exec();
        console.log(cart, "checking no 2");
        console.log("products", cart.products);
        const products = cart.products.map((product) => {
          const total =
            Number(product.quantity) * Number(product.productId.price);
          return {
            _id: product.productId._id.toString(),
            brand: product.productId.brand,
            productname: product.productId.productname,
            images: product.productId.images,
            price: product.productId.price,
            description: product.productId.description,
            quantity: product.quantity,
            total,
            user_id: req.session.user_id,
          };
        });
        console.log("passing products data is :", products);

        const total = products.reduce(
          (sum, product) => sum + Number(product.total),
          0
        );
        console.log(total);

        const finalAmount = total;

        // Get the total count of products
        const totalCount = products.length;
        console.log(totalCount);
        res.render("users/load-cart", {
          layout: "user-layout",
          products,
          total,
          totalCount,
          subtotal: total,
          finalAmount,
        });
      } else {
        res.render("users/cart", {
          message: "Your cart is empty",
          layout: "user-layout",
        });
      }
    } catch (error) {
      throw new Error(error.message);
    }
  },

  changeProductQuantity: async (req, res) => {
    try {
      console.log(req.body.userId, "userid is this");
      console.log(req.body.productId, "product id is this");
      const userId = new mongoose.Types.ObjectId(req.body.userId);
      const productId = new mongoose.Types.ObjectId(req.body.productId);
      const quantity = req.body.quantity;
      const cartFind = await Cart.findOne({ User_id: userId });
      const cartId = cartFind._id;
      const count = req.body.count;
      console.log(userId, "userId");
      console.log(productId, "productid");
      console.log(quantity, "quantity");
      console.log(cartId, "cartId");
      console.log(count, "count");

      // Find the cart for the given user and product
      const cart = await Cart.findOneAndUpdate(
        { User_id: userId, "products.productId": productId },
        { $inc: { "products.$.quantity": count } },
        { new: true }
      ).populate("products.productId");

      // Update the total for the specific product in the cart
      const updatedProduct = cart.products.find((product) =>
        product.productId._id.equals(productId)
      );
      updatedProduct.total =
        updatedProduct.productId.price * updatedProduct.quantity;
      await cart.save();

      //   Check if the quantity is 0 or less
      if (updatedProduct.quantity <= 0) {
        // Remove the product from the cart
        cart.products = cart.products.filter(
          (product) => !product.productId._id.equals(productId)
        );
        await cart.save();
        const response = { deleteProduct: true };
        res.send(response);
        return response;
      }

      // Calculate the new subtotal for all products in the cart
      const subtotal = cart.products.reduce((acc, product) => {
        return acc + product.total;
      }, 0);

      const total = updatedProduct.total;
      console.log(total);
      // Prepare the response object
      const response = {
        quantity: updatedProduct.quantity,
        subtotal: subtotal,
        productTotal: updatedProduct.total,
      };
      console.log(response, "resposeeeeee");
      res.send(response);
      return response;
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: error.message });
    }
  },
};
