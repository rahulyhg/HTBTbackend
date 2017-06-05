var Bitly = require('bitly');
var bitly = new Bitly('e9bb882af8f22315f7da81f7965163b140b1bbfd');
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
    methodOfOrder: {
        type: String,
        enum: ['Customer Representative', 'Relationship Partner', 'Application']
    },
    methodOfPayment: {
        type: String,
        enum: ['Cash', 'Credits', 'Customer']
    },
    // paidByCustomer: Boolean,
    billingAddress: {
        name: String,
        mobile: String,
        email: String,
        companyName: String,
        address: String,
        pincode: Number
    },
    shippingAddress: {
        name: String,
        mobile: String,
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
        console.log("data----", data.product[0].product.category);
        var confirmationToRP = false;
        if (!data.razorpay_payment_id) {
            confirmationToRP = true;
        }
        Order.saveData(data, function (err, savedData) {
            if (err) {
                callback(err, null);
            } else {
                console.log("savedData--", savedData);
                async.parallel([
                    //Function to search event name
                    function () {
                        if (data.razorpay_payment_id && data.customer.relationshipId) {
                            console.log("inside relationship Partner updation");
                            User.findOne({
                                _id: data.customer.relationshipId
                            }).lean().exec(function (err, RPdata) {
                                if (err) {
                                    callback(err, null);
                                } else {
                                    if (_.isEqual(data.methodOfPayment, 'credits')) {
                                        RPdata.credits = parseInt(RPdata.credits) + parseInt(totalAmount);
                                    }
                                    _.forEach(RPdata.customer, function (val) {
                                        if (_.isEqual(val.customer, data.customer._id)) {
                                            val.status = 'Existing';
                                        }
                                    });
                                    User.saveData(RPdata, function (err, savedUser) {
                                        if (err) {
                                            callback(err, null);
                                        } else {
                                            console.log("savedUser--", savedUser);
                                        }
                                    })
                                }
                            });
                        }
                    },
                    function () {
                        if (data.razorpay_payment_id) {
                            console.log("inside Delivery req create", data.product.length);
                            _.forEach(data.product, function (val, index) {
                                console.log("val--", val, "index--", index);
                                var deliveryReqData = {};
                                var planChecked = true;
                                val.reqId = 0;
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
                                                    val.reqId = parseInt(fdata[0].requestID) + 1;
                                                }
                                            } else {
                                                val.reqId = 1;
                                            }
                                            deliveryReqData.product = val.product._id;
                                            deliveryReqData.Quantity = val.productQuantity;
                                            deliveryReqData.deliverdate = data.deliverdate;
                                            deliveryReqData.Order = data._id;
                                            deliveryReqData.requestDate = new Date();
                                            deliveryReqData.methodOfRequest = data.methodOfOrder;
                                            deliveryReqData.requestID = val.reqId;
                                            deliveryReqData.customer = data.customer._id
                                            green("deliveryReqData--", deliveryReqData);
                                            DeliveryRequest.saveData(deliveryReqData, function (err, savedDelivery) {
                                                if (err) {
                                                    red("error while creating delivery", err);
                                                    // callback(err, null);
                                                } else {
                                                    console.log("savedDelivery--", savedDelivery);
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    },
                    function () {
                        if (confirmationToRP && data.customer.relationshipId && data.orderFor == 'RMForCustomer') {
                            var shortU;
                            console.log("inside relationship Partner Payment msg");
                            // Shorten a long url and output the result
                            bitly.shorten(env.frontend + "/payment/" + data._id + "/123")
                                .then(function (response) {
                                    console.log("shortUrl", response);
                                    shortU = response.data.url;
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
                                }, function (error) {
                                    console.log("error while shortnening url", error)
                                });

                        }
                    },
                    function () {
                        if (_.isEqual(data.product[0].product.category.subscription, 'Yes') && data.razorpay_payment_id) {
                            console.log("inside user updation");

                            User.findOne({
                                _id: data.customer._id
                            }).exec(function (err, userdata) {
                                if (err) {
                                    callback(err, null);
                                } else {
                                    if (!_.isEmpty(userdata.subscribedProd[0])) {
                                        userdata.subscribedProd[0].jarBalance = parseInt(userdata.subscribedProd[0].jarBalance) + parseInt(data.totalQuantity);
                                    } else {
                                        var subProd = {};
                                        subProd.recentOrder = data._id
                                        subProd.product = data.product[0].product;
                                        subProd.jarBalance = parseInt(data.totalQuantity)
                                        userdata.subscribedProd.push(subProd);
                                    }
                                    userdata.status = 'Active';
                                    userdata.save(function (err, updated) {
                                        if (err) {
                                            console.log("error occured in user update");
                                        } else {
                                            console.log("user updated");
                                        }
                                    });
                                }
                            });
                            var smsMessage = "Order " + data.orderID + " confirmed! Download the HaTa App or call on 022 - 33024910 to schedule your first delivery."
                            var smsObj = {
                                "message": "HTBT",
                                "sender": "HATABT",
                                "sms": [{
                                    "to": data.customer.mobile,
                                    "message": smsMessage,
                                    "sender": "HATABT",
                                }]
                            };
                            Config.sendSMS(smsObj, function (error, SMSResponse) {
                                if (error || SMSResponse == undefined) {
                                    console.log("Order >>> confirmOrder >>> Config.sendSMS >>> error >>>", error);
                                    // callback(error, null);
                                } else {
                                    // callback(null, {
                                    //     message: "OTP sent"
                                    // });
                                }
                            })
                        }
                    }
                ], function (error, data) {
                    if (error) {
                        console.log(" async.parallel >>> final callback  >>> error", error);
                        callback(error, null);
                    } else {
                        callback(null, data);
                    }
                }) //End of async.parallel


                callback(null, data)
            }
        });

    },
    //used inside saveOrder to calculate the price out of price ranges
    calculatePrice: function (data) {
        console.log("calculatePrice----", data)
        var prodList = data;
        _.forEach(prodList, function (val) {
            console.log("val in prodList", val);
            if (!_.isEmpty(val.product.priceList)) {
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
            } else {
                console.log("val.product.price--", val.product.price);
                val.finalPrice = val.product.price;
            }
        });

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
                    data.totalAmount = _.sumBy(data.product, function (o) {
                        return parseInt(o.finalPrice * o.productQuantity);
                    });
                    Order.saveData(data, function (err, savedData) {
                        if (err) {
                            console.log("err--", err);
                            callback(err, null);
                        } else {
                            console.log("savedData--", savedData);
                            // User.findOne({
                            //     _id: data.customer
                            // }).exec(function (err, foundUser) {
                            //     if (err) {
                            //         console.log("error while updating user", err);
                            //         // callback(err, null);
                            //     } else {
                            //         foundUser.balance = foundUser.balance + parseInt(data.totalQuantity);
                            //     }
                            // });
                            // console.log("inside Delivery req create", data.product);
                            // var deliveryReqData = {};
                            // var planChecked = true;
                            // _.forEach(data.product, function (val, index) {
                            //     console.log("val--", val, "index--", index);
                            //     if (index == 0 && val.product && val.product.category) {
                            //         if (_.isEqual(val.product.category.subscription, 'Yes')) {
                            //             if (!_.isEqual(data.plan, 'Onetime')) {
                            //                 planChecked = false;
                            //             }
                            //         }
                            //     }
                            //     if (planChecked) {
                            //         DeliveryRequest.find({}).sort({
                            //             createdAt: -1
                            //         }).exec(function (err, fdata) {
                            //             if (err) {
                            //                 console.log(err);
                            //                 callback(err, null);
                            //             } else {
                            //                 if (fdata.length > 0) {
                            //                     if (fdata[0].requestID) {
                            //                         reqId = parseInt(fdata[0].requestID) + 1;
                            //                     }
                            //                 } else {
                            //                     reqId = 1;
                            //                 }
                            //                 deliveryReqData.product = val.product;
                            //                 deliveryReqData.Quantity = val.productQuantity;
                            //                 deliveryReqData.deliverdate = data.deliverdate;
                            //                 deliveryReqData.Order = savedData._id;
                            //                 deliveryReqData.requestDate = new Date();
                            //                 deliveryReqData.methodOfRequest = data.methodOfOrder;
                            //                 deliveryReqData.requestID = reqId;
                            //                 deliveryReqData.customer = data.customer
                            //                 console.log("deliveryReqData--", deliveryReqData);
                            //                 DeliveryRequest.saveData(deliveryReqData, function () {});

                            //             }
                            //         });
                            //     }
                            // });
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
            makeAsyncCall();
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
                                    User.findOne({
                                        _id: savedData.relationshipId
                                    }).lean().exec(function (err, RPdata) {
                                        if (err) {
                                            callback(err, null);
                                        } else {
                                            var cust = {};
                                            cust.customer = savedData._id;
                                            cust.addedDate = new Date();
                                            cust.status = 'pending';
                                            RPdata.customer.push(cust);
                                            User.saveData(RPdata, function (err, updated) {
                                                if (err) {
                                                    console.log("error occured while adding customer");
                                                } else {
                                                    console.log("customer added successfully");
                                                }
                                            });
                                        }
                                    });
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
                        console.log("inside if----send msg to RM", savedOrder.orderID, partnerName);
                        var shortU;
                        // Shorten a long url and output the result

                        bitly.shorten(env.frontend + "/orderconfirmation/" + savedOrder._id)
                            .then(function (response) {
                                console.log("shortUrl", response);
                                shortU = response.data.url;
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
                            }, function (error) {
                                console.log("error while shortnening url", error)
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
                }).deepPopulate('cartProducts.product').exec(function (err, RPdata) {
                    if (err) {
                        callback(err, null);
                    } else {
                        userData.relationshipId = RPdata._id;
                        userData.cartProducts = RPdata.cartProducts;
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
            makeAsyncCall();
        }
        //waterfall starts
        function makeAsyncCall() {
            async.waterfall([
                    function saveCustomer(callback) {
                        console.log("inside user create", userData);
                        User.findOne({
                            mobile: userData.mobile
                        }).deepPopulate('cartProducts.product').lean().exec(function (err, data2) {
                            if (err) {
                                callback(err);
                            } else if (_.isEmpty(data2)) {
                                userData.accessLevel = 'Customer';
                                User.saveUserData(userData, function (err, savedData) {
                                    if (err) {
                                        callback(err, null);
                                    } else {
                                        console.log("savedData-- user", savedData);
                                        User.findOne({
                                            _id: savedData.relationshipId
                                        }).lean().exec(function (err, RPdata) {
                                            if (err) {
                                                callback(err, null);
                                            } else {
                                                console.log("RPdata--", RPdata);
                                                var cust = {};
                                                cust.customer = savedData._id;
                                                cust.addedDate = new Date();
                                                cust.status = 'pending';
                                                RPdata.customer.push(cust);
                                                User.saveData(RPdata, function (err, updated) {
                                                    if (err) {
                                                        console.log("error occured while adding customer");
                                                    } else {
                                                        console.log("customer added successfully");
                                                    }
                                                });
                                            }
                                        });
                                        customerData = savedData;
                                        callback(null, customerData);
                                    }
                                });
                            } else {
                                console.log("data2--", data2);
                                customerData = data2;
                                if (userData.cartProducts) {
                                    customerData.cartProducts = userData.cartProducts;
                                }
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
                                console.log("cartProducts.product---", foundUserData);
                                orderData.customer = foundUserData._id;
                                orderData.product = customerData.cartProducts;
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
                            bitly.shorten(env.frontend + "/orderconfirmation/" + savedOrder._id)
                                .then(function (response) {
                                    console.log("shortUrl", response);
                                    shortU = response.data.url;
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
                                }, function (error) {
                                    console.log("error while shortnening url", error)
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
        console.log(ObjectId(data.user));
        var now = moment();
        var days = moment(now).daysInMonth();
        var currMonth = moment(now).month();
        var dayOne = moment().date(1).month(currMonth).toDate();
        var lastDay = moment().date(days).month(currMonth).toDate();
        console.log("dayOne", dayOne);
        console.log("lastDay", lastDay);
        Order.aggregate([{
                $match: {
                    orderDate: {
                        $gte: dayOne,
                        $lt: lastDay
                    }
                }
            }, {
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
                    'customer.relationshipId': ObjectId(data.user)
                }
            }
        ]).exec(function (err, found) {
            if (err) {
                console.log(err);
                callback(err, null);
            } else {
                console.log("found", found);
                callback(null, found);
            }
        })

    },
    //to get previous month orders of RM
    getPreviousMonthOrder: function (data, callback) {
        console.log(ObjectId(data.user));
        var days = moment(new moment().subtract(1, 'months')).daysInMonth();
        var prevMonthFirstDay = new moment().subtract(1, 'months').date(1).toDate();
        var prevMonthLastDay = new moment().subtract(1, 'months').date(days).toDate();
        console.log("prevMonthFirstDay", prevMonthFirstDay, prevMonthLastDay);
        Order.aggregate([{
                $match: {
                    orderDate: {
                        $gte: prevMonthFirstDay,
                        $lt: prevMonthLastDay
                    }
                }
            }, {
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
                    'customer.relationshipId': ObjectId(data.user)
                }
            }
        ]).exec(function (err, found) {
            if (err) {
                console.log(err);
                callback(err, null);
            } else {
                console.log("found", found);
                callback(null, found);
            }
        })

    },
    //to get Last Three month orders of RM
    // getLastThreeMonthOrder: function (data, callback) {
    //     console.log(ObjectId(data.user));
    //     var days = moment(new moment().subtract(1, 'months')).daysInMonth();
    //     var prevMonthFirstDay = new moment().subtract(1, 'months').date(1).toDate();
    //     var prevMonthLastDay = new moment().subtract(1, 'months').date(days).toDate();
    //     console.log("prevMonthFirstDay", prevMonthFirstDay, prevMonthLastDay);
    //     Order.aggregate([{
    //             $match: {
    //                 orderDate: {
    //                     $gte: prevMonthFirstDay,
    //                     $lt: prevMonthLastDay
    //                 }
    //             }
    //         }, {
    //             "$lookup": {
    //                 "from": "users",
    //                 "localField": "customer",
    //                 "foreignField": "_id",
    //                 "as": "customer"
    //             }
    //         },
    //         {
    //             $unwind: {
    //                 path: "$customer",
    //                 "preserveNullAndEmptyArrays": true
    //             }
    //         },
    //         {
    //             $match: {
    //                 'customer.relationshipId': ObjectId(data.user)
    //             }
    //         }
    //     ]).exec(function (err, found) {
    //         if (err) {
    //             console.log(err);
    //             callback(err, null);
    //         } else {
    //             console.log("found", found);
    //             callback(null,found);
    //         }
    //     })

    // }
};
module.exports = _.assign(module.exports, exports, model);