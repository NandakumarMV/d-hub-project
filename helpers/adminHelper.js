const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Address = require("../models/addressesModel");
const Product = require("../models/productModels");
const moment = require("moment-timezone");
// const pdfPrinter = require("pdfmake");
const mongoose = require("mongoose");
const { MongoError } = require("mongodb");
const pdfPrinter = require("pdfmake");
const ObjectId = mongoose.Types.ObjectId;

module.exports = {
  orderDetails: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const order = await Order.find({
          orderStatus: { $in: ["Placed", "Shipped", "Delivered", "Returned"] },
        })
          .populate("userId")
          .sort({ date: -1 })
          .lean()
          .exec();

        const orderHistory = order.map((history) => {
          let createdOnISt = moment(history.date)
            .tz("Asia/Kolkata")
            .format("DD-MM-YYYY h:mm A");
          return {
            ...history,
            date: createdOnISt,
            userName: history.userId.name,
          };
        });

        const total = await Order.aggregate([
          {
            $match: {
              orderStatus: {
                $in: ["Placed", "Shipped", "Delivered", "Returned"],
              },
            },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$orderValue" },
            },
          },
          {
            $sort: {
              totalAmount: 1,
            },
          },
        ]);
        const orderDetails = {
          orderHistory,
          total,
        };
        resolve(orderDetails);
      } catch (error) {
        reject(error);
      }
    });
  },
  salesDaily: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const salesDaily = new Date();
        const startOfDay = new Date(
          salesDaily.getFullYear(),
          salesDaily.getMonth(),
          salesDaily.getDate(),
          0,
          0,
          0,
          0
        );
        const endOfDay = new Date(
          salesDaily.getFullYear(),
          salesDaily.getMonth(),
          salesDaily.getDate(),
          23,
          59,
          59,
          999
        );

        const order = await Order.find({
          orderStatus: { $nin: ["cancelled"] },
          date: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        })
          .populate("userId")
          .sort({ date: -1 });

        const orderHistory = order.map((history) => {
          const createdOnIST = moment(history.date)
            .tz("Asia/Kolkata")
            .format("DD-MM-YYYY h:mm A");
          return {
            ...history._doc,
            date: createdOnIST,
            userName: history.userId.name,
          };
        });

        const total = await Order.aggregate([
          {
            $match: {
              orderStatus: {
                $in: ["Placed", "Shipped", "Delivered", "Returned"],
              },

              date: {
                $gte: startOfDay, // Set the current date's start time
                $lt: endOfDay,
              },
            },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$orderValue" },
            },
          },
        ]);
        const Dailysales = {
          orderHistory,
          total,
        };

        if (order) {
          resolve(Dailysales);
        } else {
          resolve("No sales today");
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  WeeklySales: () => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log("enterd hellpers");
        const currentDate = new Date();
        console.log("enterd hellpe...........rs");

        const weekStart = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate() - currentDate.getDay()
        );
        console.log(weekStart, "week start");
        const WeekEnd = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate() + (6 - currentDate.getDay()),
          23,
          59,
          59,
          999
        );
        console.log(WeekEnd, "week end");

        const order = await Order.find({
          orderStatus: { $nin: ["cancelled"] },
          date: {
            $gte: weekStart,
            $lt: WeekEnd,
          },
        })
          .populate("userId")
          .sort({ date: -1 });
        console.log(order, "order details");

        const orderHistory = order.map((history) => {
          const createdOnIST = moment(history.date)
            .tz("Asia/Kolkata")
            .format("DD-MM-YYYY h:mm A");
          return {
            ...history._doc,
            date: createdOnIST,
            userName: history.userId.name,
          };
        });

        const total = await Order.aggregate([
          {
            $match: {
              orderStatus: {
                $in: ["Placed", "Shipped", "Delivered", "Returned"],
              },
              date: {
                $gte: weekStart,
                $lt: WeekEnd,
              },
            },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$orderValue" },
            },
          },
        ]);
        console.log(total, "total data is this");

        const WeeklySales = {
          orderHistory,
          total,
        };
        resolve(WeeklySales);
      } catch (error) {
        reject(error);
      }
    });
  },
  monthlySales: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const thisMonth = new Date().getMonth() + 1;
        const startofMonth = new Date(
          new Date().getFullYear(),
          thisMonth - 1,
          1,
          0,
          0,
          0,
          0
        );
        const endofMonth = new Date(
          new Date().getFullYear(),
          thisMonth,
          0,
          23,
          59,
          59,
          999
        );

        const order = await Order.find({
          orderStatus: { $nin: ["cancelled"] },
          date: {
            $lt: endofMonth,
            $gte: startofMonth,
          },
        })
          .populate("userId")
          .sort({ date: -1 });

        const orderHistory = order.map((history) => {
          const createdOnIST = moment(history.date)
            .tz("Asia/Kolkata")
            .format("DD-MM-YYYY h:mm A");
          return {
            ...history._doc,
            date: createdOnIST,
            userName: history.userId.name,
          };
        });

        const total = await Order.aggregate([
          {
            $match: {
              orderStatus: {
                $in: ["Placed", "Shipped", "Delivered", "Returned"],
              },
              date: {
                $lt: endofMonth,
                $gte: startofMonth,
              },
            },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$orderValue" },
            },
          },
        ]);

        const monthlySales = {
          orderHistory,
          total,
        };

        resolve(monthlySales);
      } catch (error) {
        reject(error);
      }
    });
  },
  yearlySales: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const today = new Date().getFullYear();
        const startofYear = new Date(today, 0, 1, 0, 0, 0, 0);
        const endofYear = new Date(today, 11, 31, 23, 59, 59, 999);

        const order = await Order.find({
          orderStatus: { $nin: ["cancelled"] },
          date: {
            $lt: endofYear,
            $gte: startofYear,
          },
        })
          .populate("userId")
          .sort({ date: -1 });

        const orderHistory = order.map((history) => {
          const createdOnIST = moment(history.date)
            .tz("Asia/Kolkata")
            .format("DD-MM-YYYY h:mm A");
          return {
            ...history._doc,
            date: createdOnIST,
            userName: history.userId.name,
          };
        });

        const total = await Order.aggregate([
          {
            $match: {
              orderStatus: {
                $in: ["Placed", "Shipped", "Delivered", "Returned"],
              },
              date: {
                $lt: endofYear,
                $gte: startofYear,
              },
            },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$orderValue" },
            },
          },
        ]);

        const yearlySales = {
          orderHistory,
          total,
        };

        resolve(yearlySales);
      } catch (error) {
        reject(error);
      }
    });
  },

  salesPdf: (req, res) => {
    return new Promise(async (resolve, reject) => {
      try {
        let startY = 150;
        const writeStream = fs.createWriteStream("order.pdf");
        const printer = new pdfPrinter({
          Roboto: {
            normal: "Helvetica",
            bold: "Helvetica-Bold",
            italics: "Helvetica-Oblique",
            bolditalics: "Helvetica-BoldOblique",
          },
        });

        const order = await Order.find({
          orderStatus: { $in: ["Placed", "Shipped", "Delivered", "Returned"] },
        })
          .populate("userId")
          .exec();

        const totalAmount = await Order.aggregate([
          {
            $match: {
              orderStatus: { $nin: ["cancelled"] },
            },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$orderValue" },
            },
          },
        ]);

        const dateOptions = { year: "numeric", month: "long", day: "numeric" };
        // Create document definition
        const docDefinition = {
          content: [
            { text: "D-HUB online", style: "header" },
            { text: "\n" },
            { text: "Order Information", style: "header1" },
            { text: "\n" },
            { text: "\n" },
          ],
          styles: {
            header: {
              fontSize: 25,
              alignment: "center",
            },
            header1: {
              fontSize: 12,
              alignment: "center",
            },
            total: {
              fontSize: 18,
              alignment: "center",
            },
          },
        };

        // Create the table data
        const tableBody = [
          ["Index", "Date", "User", "Status", "Method", "Amount"], // Table header
        ];

        for (let i = 0; i < order.length; i++) {
          const data = order[i];
          const formattedDate = new Intl.DateTimeFormat(
            "en-US",
            dateOptions
          ).format(new Date(data.date));
          tableBody.push([
            (i + 1).toString(), // Index value
            formattedDate,
            data.userId.name,
            data.orderStatus,
            data.paymentMethod,
            data.orderValue,
          ]);
        }

        const table = {
          table: {
            widths: ["auto", "auto", "auto", "auto", "auto", "auto"],
            headerRows: 1,
            body: tableBody,
          },
        };

        // Add the table to the document definition
        docDefinition.content.push(table);
        docDefinition.content.push([
          { text: "\n" },
          {
            text: `Total: ${totalAmount[0]?.totalAmount || 0}`,
            style: "total",
          },
        ]);
        // Generate PDF from the document definition
        const pdfDoc = printer.createPdfKitDocument(docDefinition);

        // Pipe the PDF document to a write stream
        pdfDoc.pipe(writeStream);

        // Finalize the PDF and end the stream
        pdfDoc.end();

        writeStream.on("finish", () => {
          res.download("order.pdf", "order.pdf");
        });
      } catch (error) {
        console.log("pdfSales helper error");
        reject(error);
      }
    });
  },
};
