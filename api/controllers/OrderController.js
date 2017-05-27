module.exports = _.cloneDeep(require("sails-wohlig-controller"));
var Razorpay = require('razorpay')

var rzp = new Razorpay({
    key_id: 'rzp_test_BrwXxB7w8pKsfS', // your `KEY_ID`
    key_secret: 'Lccm56IPsufU4X3id7CqE1RS' // your `KEY_SECRET`
})
var controller = {
    payNow: function (req, res) {
        if (req.body) {
            // request({
            //     method: 'POST',
            //     url: 'https://rzp_test_BrwXxB7w8pKsfS:Lccm56IPsufU4X3id7CqE1RS@api.razorpay.com/v1/orders',
            //     form: {
            //         "amount": 500,
            //         "currency": "INR",
            //         "receipt": "rcptid423",
            //         "payment_capture": true
            //     }
            // }, function (error, response, body) {
            //     console.log('Status:', response.statusCode);
            //     console.log('Headers:', JSON.stringify(response.headers));
            //     console.log('Response:', body);
            // });
          var form= {
                "amount": 500,
                "currency": "INR",
                "receipt": "rcptid423",
                "payment_capture": true
            }
            rzp.orders.create(form, function (error, payment) {
                if (error) {
                    console.log(error);
                } else {
                    console.log("response-----", payment);
                }
            });

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
};
module.exports = _.assign(module.exports, controller);