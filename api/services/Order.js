var googl = require('goo.gl');
googl.setKey('AIzaSyD_0eajXMXo7CNmSBr7XutL65p0rDWCw48');
var ObjectId = Schema.ObjectId;
var schema = new Schema({
    orderID: {
        type: String,
        unique: true
    },
    product: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
        },
        "product-nameOnly": String,
        productQuantity: {
            type: Number,
        },
        finalPrice: Number,
        jarDeposit: Number
    }],

    plan: {
        type: String,
        enum: ['Monthly', 'Quarterly', 'Onetime']
    },
    orderFor: {
        type: String,
        enum: ['CustomerForSelf', 'RMForCustomer']
    },
    customer: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    deliverdate: Date,
    delivertime: Date,
    couponCode: String,
    paymentStatus: {
        type: String,
        enum: ['Paid', 'Unpaid', 'Payment Failed'],
        default: "Unpaid"
    },
    totalQuantity: String,
    totalAmount: {
        type: String
    },
    status: {
        type: String, //'Processing', 'Confirmed','Cancelled','Delivered','delay',
        default: "Processing"
    },
    // paidByRP: {
    //     type: Boolean, //'true', 'false'
    //     default: false
    // },
    orderDate: Date,
    methodOfOrder: String,
    methodOfPayment: {
        type: String,
        enum: ['Cash', 'Credits', 'Customer']
    },
    // paidByCustomer: Boolean,
    billingAddress: {
        email: String,
        companyName: String,
        address: String,
        pincode: Number
    },
    shippingAddress: {
        email: String,
        companyName: String,
        address: String,
        pincode: Number
    },
    transactionNo: String,
    razorpay_payment_id: String

});

schema.plugin(deepPopulate, {
    populate: {
        'customer': {
            select: ''
        },
        'product.product': {
            select: ''
        },
        'product.product.category': {
            select: ''
        }
    }
});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);

module.exports = mongoose.model('Order', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "customer product.product product.product.category", "customer product.product product.product.category"));
var model = {
    //orders per user
    getOrderByUser: function (data, callback) {
        console.log("data", data)
        Order.find({
                customer: data._id
            }).deepPopulate("customer product.product")
            .lean().sort({
                _id: -1
            }).exec(function (err, found) {
                if (err) {
                    callback(err, null);
                } else {
                    if (found) {
                        callback(null, found);
                    } else {
                        callback({
                            message: "Invalid data!"
                        }, null);
                    }
                }

            });
    },
    //call this while confirming the order or when payment is made 
    orderConfirmationOrPay: function (data, callback) {
        console.log("data----", data)
        var confirmationToRP = false;
        if (!data.razorpay_payment_id) {
            confirmationToRP = true;
        }
        Order.saveData(data, function (err, savedData) {
            if (err) {
                callback(err, null);
            } else {
                console.log("savedData--", savedData);
                DeliveryRequest.find({
                    Order: savedData._id
                }).lean().sort({
                    _id: 1
                }).exec(function (err, deliveryData) {
                    if (err) {
                        callback(err, null);
                    } else {
                        _.forEach(deliveryData, function (val) {
                            val.deliverdate = data.deliverdate;
                            DeliveryRequest.saveData(val, function (err, updated) {
                                if (err) {
                                    console.log("error occured in DeliveryRequest update");
                                } else {
                                    console.log("DeliveryRequest updated");
                                }
                            });
                        })
                    }
                });
                if (confirmationToRP && data.customer.relationshipId) {
                    var shortU;
                    // Shorten a long url and output the result
                    googl.shorten(env.frontend + "/payment/" + data._id)
                        .then(function (shortUrl) {
                            shortU = shortUrl;
                        })
                        .catch(function (err) {
                            console.error(err.message);
                        });
                    User.findOne({
                        _id: data.customer.relationshipId
                    }).exec(function (err, RPdata) {
                        if (err) {
                            callback(err, null);
                        } else {
                            var smsMessage = "Order has been confirmed from " + data.customer.name + " for order " + data.orderID + ". Please make the payment using url " + shortU

                            var smsObj = {
                                "message": "HTBT",
                                "sender": "HATABT",
                                "sms": [{
                                    "to": RPdata.mobile,
                                    "message": smsMessage,
                                    "sender": "HATABT",
                                }]
                            };
                            Config.sendSMS(smsObj, function (error, SMSResponse) {
                                if (error || SMSResponse == undefined) {
                                    console.log("Order >>> confirmOrder >>> Config.sendSMS >>> error >>>", error);
                                    // callback(error, null);
                                } else {
                                    console.log("sms sent successfully");
                                    // callback(null, {
                                    //     message: "OTP sent"
                                    // });
                                }
                            })
                        }
                    });
                }
                callback(null, data)
            }
        });

    },
    //used inside saveOrder to calculate the price out of price ranges
    calculatePrice: function (data) {
        console.log("calculatePrice----", data)
        var prodList = data;
        _.forEach(prodList, function (val) {
            var orderedPrice = _.orderBy(val.product.priceList, ['endRange'], ['asc']);
            console.log("orderedPrice", orderedPrice);
            foundPrice = {};
            _.each(orderedPrice, function (obj) {
                console.log("obj--", obj);
                if (parseInt(val.productQuantity) <= parseInt(obj.endRange)) {
                    foundPrice = obj;
                    return false;
                }
            });
            console.log("val.finalPrice--", foundPrice.finalPrice);
            val.finalPrice = foundPrice.finalPrice;
        })
        return prodList;

    },
    //used for saving the order
    saveOrder: function (data, callback) {
        console.log('inside save order', data);
        if (!data._id) {
            var year = new Date().getFullYear().toString().substr(2, 2);
            var month = new Date().getMonth();
            var strMon = '';
            console.log(month.toString().length, year);
            if (month.toString().length > 1) {
                console.log(month.length);
                strMon = month;
            } else {
                strMon = "0" + month;
            }
            var orderID = '';

            Order.find({}).sort({
                createdAt: -1
            }).exec(function (err, fdata) {
                if (err) {
                    console.log(err);
                    callback(err, null);
                } else {
                    console.log("order length", fdata.length);
                    if (fdata.length > 0) {
                        console.log(fdata[0]);
                        var ID = parseInt(fdata[0].orderID.toString().substr(fdata[0].orderID.toString().length - 5, fdata[0].orderID.toString().length)) + 1;
                        console.log(ID);
                        if (ID.toString().length == 5) {
                            orderID = "orderID" + year + strMon + ID;
                            console.log("5", orderID);

                        } else if (ID.toString().length == 4) {
                            orderID = "orderID" + year + strMon + "0" + ID;
                            console.log("4", orderID);

                        } else if (ID.toString().length == 3) {
                            orderID = "orderID" + year + strMon + "00" + ID;
                            console.log("3", orderID);

                        } else if (ID.toString().length == 2) {
                            orderID = "orderID" + year + strMon + "000" + ID;
                            console.log("2", orderID);

                        } else {
                            orderID = "orderID" + year + strMon + "0000" + ID;
                            console.log("1", orderID);
                        }
                        // orderID="cust"+year+strMon+ID;
                        // console.log(orderID);
                    } else {
                        console.log("hello");
                        orderID = "orderID" + year + strMon + "00001";
                        console.log(orderID);
                    }
                    data.orderID = orderID;
                    data.orderDate = new Date();
                    data.product = Order.calculatePrice(data.product)
                    Order.saveData(data, function (err, savedData) {
                        if (err) {
                            console.log("err--", err);
                            callback(err, null);
                        } else {
                            console.log("savedData--", savedData);
                            User.findOne({
                                _id: data.customer
                            }).exec(function (err, foundUser) {
                                if (err) {
                                    console.log("error while updating user", err);
                                    // callback(err, null);
                                } else {
                                    foundUser.balance = foundUser.balance + parseInt(data.totalQuantity);
                                }
                            });
                            console.log("inside Delivery req create", data.product);
                            var deliveryReqData = {};
                            _.forEach(data.product, function (val, index) {
                                var planChecked = true;
                                console.log("val--", val, "index--", index);
                                if (index == 0 && val.product && val.product.category) {
                                    if (_.isEqual(val.product.category.subscription, 'Yes')) {
                                        if (!_.isEqual(data.plan, 'Onetime')) {
                                            planChecked = false;
                                        }
                                    }
                                }
                                if (planChecked) {
                                    DeliveryRequest.find({}).sort({
                                        createdAt: -1
                                    }).exec(function (err, fdata) {
                                        if (err) {
                                            console.log(err);
                                            callback(err, null);
                                        } else {
                                            if (fdata.length > 0) {
                                                if (fdata[0].requestID) {
                                                    reqId = parseInt(fdata[0].requestID) + 1;
                                                }
                                            } else {
                                                reqId = 1;
                                            }
                                            deliveryReqData.product = val.product;
                                            deliveryReqData.Quantity = val.productQuantity;
                                            deliveryReqData.deliverdate = data.deliverdate;
                                            deliveryReqData.Order = savedData._id;
                                            deliveryReqData.requestDate = new Date();
                                            deliveryReqData.methodOfRequest = data.methodOfOrder;
                                            deliveryReqData.requestID = reqId;
                                            deliveryReqData.customer = data.customer
                                            console.log("deliveryReqData--", deliveryReqData);
                                            DeliveryRequest.saveData(deliveryReqData, function () {});

                                        }
                                    });
                                }
                            });
                            callback(null, savedData);
                        }
                    });
                }
            });
        } else {
            Order.saveData(data, function (err, savedData) {
                if (err) {
                    callback(err, null);
                } else {
                    console.log("savedData--", savedData);
                    if (data.product) {
                        console.log("inside Delivery req create", data.product);
                        var deliveryReqData = {};
                        _.forEach(data.product, function (val) {
                            console.log("val--", val);
                            DeliveryRequest.find({}).sort({
                                createdAt: -1
                            }).exec(function (err, fdata) {
                                if (err) {
                                    console.log(err);
                                    callback(err, null);
                                } else {
                                    if (fdata.length > 0) {
                                        if (fdata[0].requestID) {
                                            reqId = parseInt(fdata[0].requestID) + 1;
                                        }
                                    } else {
                                        reqId = 1;
                                    }
                                    deliveryReqData.product = val.product;
                                    deliveryReqData.Quantity = val.productQuantity;
                                    deliveryReqData.deliverdate = data.deliverdate;
                                    deliveryReqData.Order = savedData._id;
                                    deliveryReqData.requestDate = new Date();
                                    deliveryReqData.methodOfRequest = data.methodOfOrder;
                                    deliveryReqData.requestID = reqId;
                                    deliveryReqData.customer = data.customer
                                    console.log("deliveryReqData--", deliveryReqData);
                                    DeliveryRequest.saveData(deliveryReqData, function () {});

                                }
                            });

                        })
                    }
                    callback(null, savedData);
                }
            })
        }
    },
    //used for subscription products only,from both customer end and RM end
    saveOrderCheckout: function (data, callback) {
        console.log("inside saveOrderCheckout ", data);
        var userData = {};
        var partnerName;
        if (data.customerName && data.customerMobile) {
            userData.name = data.customerName;
            userData.mobile = data.customerMobile;
            delete data.customerName;
            delete data.customerMobile;
            if (data.user) {
                User.findOne({
                    _id: data.user
                }).exec(function (err, RPdata) {
                    if (err) {
                        callback(err, null);
                    } else {
                        userData.relationshipId = RPdata._id;
                        partnerName = RPdata.name;
                        RPdata.save(function (err, updated) {
                            if (err) {
                                console.log("error occured in user RP update");
                            } else {
                                console.log("user RP updated");
                                makeAsyncCall();
                            }
                        });
                    }
                });
            };
        } else {
            userData.name = data.customer.name;
            userData.mobile = data.customer.mobile;
        }
        var data1 = {};

        function makeAsyncCall() {
            async.waterfall([
                function saveCustomer(callback) {
                    console.log("inside user create", userData);
                    User.findOne({
                        mobile: userData.mobile
                    }, function (err, data2) {
                        if (err) {
                            callback(err);
                        } else if (_.isEmpty(data2)) {
                            User.saveUserData(userData, function (err, savedData) {
                                if (err) {
                                    callback(err, null);
                                } else {
                                    console.log("savedData-- user", savedData);
                                    data1.customer = savedData;
                                    callback(null, data1)
                                }
                            });
                        } else {
                            data1.customer = data2;
                            callback(null, data1);
                        }
                    });
                },
                function callSaveOrder(data1, callback) {
                    data.customer = data1.customer._id;
                    console.log('calling savedOrder', data);
                    Order.saveOrder(data, function (err, savedOrder) {
                        savedOrder.customer = data1.customer;
                        callback(null, savedOrder);
                        red(savedOrder);
                    });
                }
            ], function asyncComplete(err, savedOrder) {
                if (err) {
                    console.warn('Error updating Order JSON.', err);
                    callback(err, null);
                } else {
                    console.log("succefully completed the waterfall");
                    //send sms here;
                    if (_.isEqual(savedOrder.orderFor, 'RMForCustomer')) {
                        var shortU;
                        // Shorten a long url and output the result
                        googl.shorten(env.frontend + "/orderconfirmation/" + savedOrder._id)
                            .then(function (shortUrl) {
                                shortU = shortUrl;
                                var smsMessage = "We are processing your order " + savedOrder.orderID + " received through our partner " + partnerName + ". Please confirm on url " + shortU
                                var smsObj = {
                                    "message": "HTBT",
                                    "sender": "HATABT",
                                    "sms": [{
                                        "to": savedOrder.customer.mobile,
                                        "message": smsMessage,
                                        "sender": "HATABT",
                                    }]
                                };
                                Config.sendSMS(smsObj, function (error, SMSResponse) {
                                    if (error || SMSResponse == undefined) {
                                        console.log("Order >>> confirmOrder >>> Config.sendSMS >>> error >>>", error);
                                        // callback(error, null);
                                    } else {
                                        console.log("sms sent successfully");
                                        // callback(null, {
                                        //     message: "OTP sent"
                                        // });
                                    }
                                })
                            })
                            .catch(function (err) {
                                console.error(err.message);
                            });

                    } else {
                        console.log("Please provide mobile mumber");
                        // callback(null, {
                        //     message: "Please provide mobile mumber"
                        // });
                    }
                    callback(null, savedOrder);
                }
            });
        }
    },
    //used for non subscription products only,from both customer end and RM end
    saveOrderCheckoutCart: function (data, callback) {
        console.log("\n inside saveOrderCheckoutCart ", data);
        var userData = {};
        var customerData = {};
        var orderData = {};
        var partnerName;
        if (data.methodOfPayment) {
            orderData.methodOfPayment = data.methodOfPayment;
        }
        if (data.orderFor) {
            orderData.orderFor = data.orderFor;
        }
        if (data.customerName && data.customerMobile) {
            userData.name = data.customerName;
            userData.mobile = data.customerMobile;
            if (data.user) {
                User.findOne({
                    _id: data.user
                }).exec(function (err, RPdata) {
                    if (err) {
                        callback(err, null);
                    } else {
                        userData.relationshipId = RPdata._id;
                        userData.cartProducts = RPdata.cartProducts
                        console.log("userData.cartProducts --", userData.cartProducts);
                        RPdata.cartProducts = [];
                        partnerName = RPdata.name;
                        RPdata.save(function (err, updated) {
                            if (err) {
                                console.log("error occured in user RP update");
                            } else {
                                console.log("user RP updated");
                                makeAsyncCall();
                            }
                        });
                    }
                });
            };
            delete data.customerName;
            delete data.customerMobile;
        } else {
            userData.name = data.customer.name;
            userData.mobile = data.customer.mobile;
        }
        //waterfall starts
        function makeAsyncCall() {
            async.waterfall([
                    function saveCustomer(callback) {
                        console.log("inside user create", userData);
                        User.findOne({
                            mobile: userData.mobile
                        }, function (err, data2) {
                            if (err) {
                                callback(err);
                            } else if (_.isEmpty(data2)) {
                                User.saveUserData(userData, function (err, savedData) {
                                    if (err) {
                                        callback(err, null);
                                    } else {
                                        console.log("savedData-- user", savedData);
                                        customerData = savedData;
                                        callback(null, customerData);
                                    }
                                });
                            } else {
                                console.log("data2--", data2);
                                customerData = data2;
                                callback(null, customerData);
                            }
                        });
                    },
                    function callSaveOrder(customerData, callback) {
                        User.findOne({
                            _id: customerData._id
                        }).deepPopulate('cartProducts.product').exec(function (err, foundUserData) {
                            if (err) {
                                callback(err, null);
                            } else {
                                orderData.customer = foundUserData._id;
                                orderData.product = foundUserData.cartProducts;
                                Order.saveOrder(orderData, function (err, savedOrder) {
                                    if (err) {
                                        console.log("error while creating order");
                                    } else {
                                        foundUserData.cartProducts = [];
                                        foundUserData.save(function (err, updated) {
                                            if (err) {
                                                console.log("error occured in user  update");
                                            } else {
                                                console.log("user  updated");
                                            }
                                        });
                                        savedOrder.customer = foundUserData;
                                        callback(null, savedOrder);
                                        red(savedOrder);
                                    }
                                });
                            }
                        })
                    }
                ],
                function asyncComplete(err, savedOrder) {
                    if (err) {
                        console.warn('Error updating Order JSON.', err);
                        callback(err, null);
                    } else {
                        console.log("succefully completed the waterfall", savedOrder.customer.mobile);
                        //send sms here;
                        if (_.isEqual(savedOrder.orderFor, 'RMForCustomer')) {
                            var shortU;
                            // Shorten a long url and output the result
                            googl.shorten(env.frontend + "/orderconfirmation/" + savedOrder._id)
                                .then(function (shortUrl) {
                                    shortU = shortUrl;
                                    var smsMessage = "We are processing your order " + savedOrder.orderID + " received through our partner " + partnerName + ". Please confirm on url " + shortU
                                    console.log("smsMessage--\n", smsMessage);
                                    var smsObj = {
                                        "message": "HTBT",
                                        "sender": "HATABT",
                                        "sms": [{
                                            "to": savedOrder.customer.mobile,
                                            "message": smsMessage,
                                            "sender": "HATABT",
                                        }]
                                    };
                                    Config.sendSMS(smsObj, function (error, SMSResponse) {
                                        if (error || SMSResponse == undefined) {
                                            console.log("Order >>> confirmOrder >>> Config.sendSMS >>> error >>>", error);
                                            // callback(error, null);
                                        } else {
                                            console.log("sms sent successfully");
                                            // callback(null, {
                                            //     message: "OTP sent"
                                            // });
                                        }
                                    })
                                })
                                .catch(function (err) {
                                    console.error(err.message);
                                });
                        } else {
                            console.log("Please provide mobile mumber");
                            // callback(null, {
                            //     message: "Please provide mobile mumber"
                            // });
                        }
                        callback(null, savedOrder);
                    }
                });
        }
    },
    //to get current month orders of RM
    getCurrentMonthOrder: function (data, callback) {
        var now = moment();
        var days = moment(now).daysInMonth();
        var currMonth = moment(now).month();
        console.log("month", currMonth);
        console.log("days", days);

        var dayOne = moment().date(1).month(currMonth).toDate();
        var lastDay = moment().date(days).month(currMonth).toDate();
        console.log("dayOne", dayOne);
        console.log("lastDay", lastDay);
        Order.aggregate([{
                "$match": {
                    "orderDate": {
                        $gte: dayOne,
                        $lt: lastDay
                    }
                }
            },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "customer",
                    "foreignField": "_id",
                    "as": "customer"
                }
            },
            {
                $unwind: {
                    path: "$customer",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                $match: {
                    "customer.relationshipId": ObjectId(data.user)

                }
            }
        ]).exec(function (err, found) {
            if (err) {
                console.log(err);
                callback(err, null);
            } else {
                console.log("found", found);
            }
        })

    }
};
module.exports = _.assign(module.exports, exports, model);