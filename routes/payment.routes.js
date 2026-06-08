const express = require("express");
const router = express.Router();
const { createOrder, verifyPayment, getAllPaymentTransactions } = require("../controllers/payment.controller");
const auth = require("../middleware/auth.middleware"); 

router.post("/create-order", auth, createOrder);
router.post("/verify-payment", auth, verifyPayment);
router.get("/transactions", auth, getAllPaymentTransactions);

module.exports = router;