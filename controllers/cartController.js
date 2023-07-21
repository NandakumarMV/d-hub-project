const Cart = require("../models/cartModel");
const Product = require("../models/productModels");
const Addresses = require("../models/addressesModel");
const mongoose = require("mongoose");
const couponHelper = require("../helpers/couponHelper");
const walletModel = require("../models/walletModel");

module.exports = {
  addToCart: async (req, res) => {
    try {
      const proId = req.body.productId;

      let cart = await Cart.findOne({ User_id: req.session.user_id });
      const product = await Product.findById(proId).lean();
      if (product.inStock < 1) {
        return res.status(400).json({ message: "product is out of stock" });
      }
      if (!cart) {
        let newCart = new Cart({ User_id: req.session.user_id, products: [] });
        await newCart.save();
        cart = newCart;
      }

      const existingProductIndex = cart.products.findIndex((product) => {
        return product.productId.toString() === proId;
      });
      if (existingProductIndex === -1) {
        const product = await Product.findById(proId).lean();
        const total = product.price; // Set the initial total to the price of the product
        cart.products.push({
          productId: proId,
          quantity: 1,
          total, // Use the updated total value
        });
      } else {
        const product = await Product.findById(proId).lean();
        const existingProduct = cart.products[existingProductIndex];
        if (existingProduct.quantity + 1 > product.inStock) {
          return res.status(400).json({ message: "stock limit reached" });
        }
        cart.products[existingProductIndex].quantity += 1;
        cart.products[existingProductIndex].total += product.price; // Update the total by adding the price of the product
      }

      // Calculate the updated total amount for the cart
      cart.total = cart.products.reduce((total, product) => {
        return total + product.total;
      }, 0);

      await cart.save();

      // Send a response indicating success or any other relevant data
      res.status(200).json({ message: "Product added to cart successfully" });
    } catch (error) {
      // Handle any errors that occurred during the process
      res.status(500).json({ error: error.message });
    }
  },

  loadingCartPage: async (req, res) => {
    try {
      const check = await Cart.findOne({ User_id: req.session.user_id });

      if (check) {
        const cart = await Cart.findOne({ User_id: req.session.user_id })
          .populate({
            path: "products.productId",
          })
          .lean()
          .exec();
        console.log("products : ", cart.products);
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
        res.render("users/load-cart", {
          layout: "user-layout",
        });
      }
    } catch (error) {
      throw new Error(error.message);
    }
  },

  changeProductQuantity: async (req, res) => {
    try {
      const userId = new mongoose.Types.ObjectId(req.body.userId);
      const productId = new mongoose.Types.ObjectId(req.body.productId);
      const quantity = req.body.quantity;
      const count = req.body.count;
      const cartFind = await Cart.findOne({ User_id: userId });
      const productsData = await Product.findById(productId);

      const findProduct = cartFind.products.find((product) =>
        product.productId._id.equals(productId)
      );

      const sumProductQuantityAndCount =
        parseInt(findProduct.quantity) + parseInt(count);

      if (sumProductQuantityAndCount > productsData.inStock) {
        const response = { outOfStock: true };
        res.send(response);
        return response;
      }
      const cartId = cartFind._id;

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
      res.send(response);
      return response;
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: error.message });
    }
  },
  // deleteProductFromCart: async (req, res) => {
  //   try {
  //     const userId = new mongoose.Types.ObjectId(req.body.userId);
  //     const productId = new mongoose.Types.ObjectId(req.body.productId);

  //     // Find the cart with the specified user ID and product ID
  //     const cart = await Cart.findOneAndUpdate(
  //       { user_id: userId },
  //       { $pull: { products: { productId: productId } } },
  //       { new: true } // To return the updated cart document
  //     );

  //     if (cart) {
  //       console.log(cart, "updated cart");

  //       // Product successfully removed from the cart
  //       const response = { deleteProductFromCart: true };
  //       console.log(response, "response from userhelper");
  //       return response;
  //     } else {
  //       // Cart or product not found
  //       const response = { deleteProductFromCart: false };
  //       console.log(response, "response from userhelper");
  //       return response;
  //     }
  //   } catch (error) {
  //     console.log(error);
  //     res.status(500).json({ error: error.message });
  //   }
  // },

  checkoutLoad: async (req, res) => {
    try {
      // console.log("entered checkout load");
      const userId = req.session.user_id;

      const defaultAddress = await Addresses.findOne(
        {
          user_id: userId,
          "addresses.is_default": true,
        },
        { "addresses.$": 1 }
      ).lean();
      console.log(defaultAddress, "eeeeeeeeeeeeeeeeeeeeee");
      if (defaultAddress) {
        const addressDoc = await Addresses.findOne({ user_id: userId }).lean();
        const addressArray = addressDoc.addresses;
        console.log(addressArray, "arrayyyy");
        const filteredAddresses = addressArray.filter(
          (address) => !address.is_default
        );
        console.log(filteredAddresses, "filtered address");

        const cart = await Cart.findOne({ User_id: userId })
          .populate({
            path: "products.productId",
          })
          .lean()
          .exec();

        const products = cart.products.map((product) => {
          const total =
            Number(product.quantity) * Number(product.productId.price);
          return {
            _id: product.productId._id.toString(),
            brand: product.productId.brand,
            productname: product.productId.productname,
            category: product.productId.category,
            images: product.productId.images,
            price: product.productId.price,
            description: product.productId.description,
            quantity: product.quantity,
            total,
            user_id: req.session.user_id,
          };
        });
        // console.log(products, "products.........................");
        const total = products.reduce(
          (sum, product) => sum + Number(product.total),
          0
        );

        //coupon management

        let couponError = false;
        let couponApplied = false;

        if (req.session.couponInvalidError) {
          couponError = req.session.couponInvalidError;
          console.log("(req.session.couponInvalidError)", couponError);
        } else if (req.session.couponApplied) {
          couponApplied = req.session.couponApplied;
          console.log("(req.session.couponApplied)", couponApplied);
        }

        let couponDiscount = 0;
        const eligibleCoupon = await couponHelper.checkCouponValidityStatus(
          userId,
          total
        );
        console.log(eligibleCoupon, "eligible coupon");
        if (eligibleCoupon.status) {
          couponDiscount = eligibleCoupon.couponDiscount;
          console.log(couponDiscount, "coupon discount is this");
        } else {
          couponDiscount = 0;
          console.log("zero coupon discount");
        }

        let totalAmount = total - couponDiscount;
        console.log(totalAmount, "total amount");
        const walletDetails = await walletModel
          .findOne({ userId: userId })
          .lean();
        console.log(walletDetails, "wallet details");
        const finalAmount = totalAmount;
        const count = products.length;
        console.log("y the");
        console.log(defaultAddress.addresses, "defaultAddress.addresses");
        res.render("users/checkout", {
          layout: "user-layout",
          defaultAddress: defaultAddress.addresses,
          filteredAddresses: filteredAddresses,
          products,
          total,
          count,
          couponError,
          couponApplied,
          couponDiscount,
          totalAmount,
          subtotal: total,
          finalAmount,
          walletDetails,
        });
        delete req.session.couponApplied;
        delete req.session.couponInvalidError;
      } else {
        res.redirect("/address");
      }
    } catch (error) {
      console.log("yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy", error);
    }
  },

  changeAddress: async (req, res) => {
    try {
      // console.log("Entered into Change address page.....");
      const addressId = req.body.addressId;
      const userId = req.session.user_id;

      // Find the current default address and unset its "isDefault" flag
      await Addresses.findOneAndUpdate(
        { user_id: userId, "addresses.is_default": true },
        { $set: { "addresses.$.is_default": false } }
      );
      console.log(defaultAddress, "old default address");

      // Set the selected address as the new default address
      const defaultAddress = await Addresses.findOneAndUpdate(
        { user_id: userId, "addresses._id": addressId },
        { $set: { "addresses.$.is_default": true } }
      );
      console.log(defaultAddress, "new Default address");

      res.redirect("/checkout");
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to set address as default" });
    }
  },
};
