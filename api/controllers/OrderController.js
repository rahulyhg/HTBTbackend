module.exports = _.cloneDeep(require("sails-wohlig-controller"));
var Razorpay = require('razorpay');
var request = require('request');
//var rzp = new Razorpay({
var key_id = 'rzp_test_BrwXxB7w8pKsfS'; // your `KEY_ID`
var key_secret = 'Lccm56IPsufU4X3id7CqE1RS'; // your `KEY_SECRET`
//})
var controller = {
    orderConfirmationOrPay: function (req, res) {
        if (req.body) {
            if (req.body.razorpay_payment_id) {
                console.log("req.body.razorpay_payment_id", req.body.razorpay_payment_id);
                request('https://' + key_id + ':' + key_secret + '@api.razorpay.com/v1/payments/' + req.body.razorpay_payment_id, function (error, response, body) {
                    console.log('Response:', body);
                    console.log('req.body:', req.body);
                    if (_.isEqual(body.status, 'authorized')) {
                        req.body.paymentStatus = 'Paid';
                        Order.orderConfirmationOrPay(req.body, res.callback);
                    } else if (_.isEqual(body.status, 'failed')) {
                        req.body.paymentStatus = 'Payment Failed';
                        Order.orderConfirmationOrPay(req.body, res.callback);
                    }
                });
            }
            else{
            Order.orderConfirmationOrPay(req.body, res.callback);
            }

        } else {
            res.json({
                value: false,
                data: {
                    message: "Invalid Request"
                }
            })
        }
    },
    getOrderByUser: function (req, res) {
        if (req.body) {
            Order.getOrderByUser(req.body, res.callback);
        } else {
            res.json({
                value: false,
                data: {
                    message: "Invalid Request"
                }
            })
        }
    },
    saveOrderCheckout: function (req, res) {
        if (req.body) {
            Order.saveOrderCheckout(req.body, res.callback);
        } else {
            res.json({
                value: false,
                data: {
                    message: "Invalid Request"
                }
            })
        }
    },
    saveOrderCheckoutCart: function (req, res) {
        if (req.body) {
            Order.saveOrderCheckoutCart(req.body, res.callback);
        } else {
            res.json({
                value: false,
                data: {
                    message: "Invalid Request"
                }
            })
        }
    },
    saveOrder: function (req, res) {
        if (req.body) {
            Order.saveOrder(req.body, res.callback);
        } else {
            res.json({
                value: false,
                data: {
                    message: "Invalid Request"
                }
            })
        }
    },
    getCurrentMonthOrder: function (req, res) {
        if (req.body) {
            Order.getCurrentMonthOrder(req.body, res.callback);
        } else {
            res.json({
                value: false,
                data: {
                    message: "Invalid Request"
                }
            })
        }
    },
};
module.exports = _.assign(module.exports, controller);