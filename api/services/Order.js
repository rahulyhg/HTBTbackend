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
        enum: ['Paid', 'Unpaid', 'Payment Failed', 'Refund Pending', 'Refunded'],
        default: "Unpaid"
    },
    totalQuantity: String,
    totalAmount: {
        type: String
    },
    status: {
        type: String, //'Processing', 'Confirmed','Paid','Cancelled','Delivered','delay','Outside Delivery Zone'

        default: "Processing"
    },
    // paidByRP: {
    //     type: Boolean, //'true', 'false'
    //     default: false
    // },
    orderDate: Date,
    methodOfOrder: {
        type: String,
        enum: ['Customer Representative', 'Relationship Partner', 'Application'],
        default: 'Customer Representative'
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
        'customer.relationshipId': {
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
                customer: data._id,
                paymentStatus: 'Paid'
            }).deepPopulate("product.product")
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
    getOrderByRM: function (data, callback) {
        console.log("data", data)
        Order.find().deepPopulate("customer product.product")
            .lean().sort({
                _id: -1
            }).exec(function (err, found) {
                if (err) {
                    callback(err, null);
                } else {
                    if (found) {
                        var newFound = _.filter(found, function (n) {
                            if (n.customer.relationshipId) {
                                var abc = n.customer.relationshipId + "";
                                return n.customer.relationshipId == data._id;
                            }
                        });
                        callback(null, newFound);
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
        console.log("data----", data);
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
                        if (data.status == 'Paid' && data.customer.relationshipId) {
                            console.log("inside relationship Partner updation");
                            User.findOne({
                                _id: data.customer.relationshipId
                            }).lean().exec(function (err, RPdata) {
                                if (err) {
                                    callback(err, null);
                                } else {
                                    // if (_.isEqual(RPdata.earningsBlock, 'No')) {
                                    //     if (_.isEqual(data.methodOfPayment, 'credits')) {
                                    //         RPdata.credits = parseInt(RPdata.credits) + parseInt(data.totalAmount);
                                    //     }
                                    // }
                                    console.log("RPdata.customer", RPdata.customer);
                                    console.log("data.customer._id", data.customer._id);
                                    var indx = _.findIndex(RPdata.customer, function (o) {
                                        return o.customer == data.customer._id;
                                    });
                                    console.log("customer indx", indx);
                                    if (indx >= 0) {
                                        RPdata.customer[parseInt(indx)].status = 'Existing';
                                    }
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
                        if (data.status == 'Paid') {
                            console.log("inside Delivery req create", data.product.length);
                            var index = 0;
                            async.eachSeries(data.product, function (val, callback1) {
                                var deliveryReqData = {};
                                var planChecked = true;
                                val.reqId = 0;
                                if (index == 0 && val.product && val.product.category) {
                                    if (_.isEqual(val.product.category.subscription, 'Yes')) {
                                        if (!_.isEqual(data.plan, 'Onetime')) {
                                            planChecked = false;
                                        }
                                    }
                                };
                                index++;
                                console.log("HHHHHHHHH");
                                if (planChecked) {
                                    async.waterfall([
                                        function createReqId(callback) {
                                            console.log("inside DeliveryRequest create");
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

                                                    callback(null, reqId);
                                                }
                                            });
                                        },
                                        function saveDeliveryReq(reqId, callback) {
                                            console.log("reqId--", reqId);
                                            deliveryReqData.product = val.product._id;
                                            deliveryReqData.Quantity = val.productQuantity;
                                            deliveryReqData.deliverdate = data.deliverdate;
                                            deliveryReqData.Order = data._id;
                                            deliveryReqData.requestDate = new Date();
                                            deliveryReqData.methodOfRequest = data.methodOfOrder;
                                            deliveryReqData.requestID = reqId;
                                            deliveryReqData.customer = data.customer._id
                                            green("deliveryReqData--", deliveryReqData);
                                            DeliveryRequest.saveData(deliveryReqData, function (err, savedDelivery) {
                                                if (err) {
                                                    red("error while creating delivery", err);
                                                    callback(err, null);
                                                } else {
                                                    console.log("savedDelivery--", savedDelivery);
                                                    callback(null, []);
                                                }
                                            });
                                        }
                                    ], function asyncComplete(err, savedDelivery) {
                                        if (err) {
                                            console.warn('Error creating delivery request JSON.', err);
                                            callback1();
                                            // callback(err, null);
                                        } else {
                                            console.log("succefully completed the waterfall");
                                            console.log("send callback1");
                                            callback1();
                                        }
                                    });
                                }

                            }, function (error, data) {
                                if (err) {
                                    console.log("error found in doLogin.else callback1");
                                    // callback3(null, err);
                                } else {
                                    console.log("complted async series");
                                    // callback3(null, "updated");
                                }
                            })
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
                                            var smsMessage = "Your customer " + data.customer.name + " has confirmed the order  " + data.orderID + ". Click here to pay " + shortU

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
                        if (data.status == 'Paid') {

                            User.findOne({
                                _id: data.customer._id
                            }).exec(function (err, userdata) {
                                if (err) {
                                    callback(err, null);
                                } else {
                                    console.log("m inside updating use");
                                    if (_.isEqual(data.product[0].product.category.subscription, 'Yes')) {
                                        console.log("subscription product-----if", _.isEmpty(userdata.subscribedProd[0]));
                                        if (!_.isEmpty(userdata.subscribedProd[0])) {
                                            console.log("inside if---add jar balance");
                                            userdata.subscribedProd[0].recentOrder = data._id;
                                            userdata.subscribedProd[0].product = data.product[0].product;
                                            userdata.subscribedProd[0].jarBalance = parseInt(userdata.subscribedProd[0].jarBalance) + parseInt(data.product[0].productQuantity);
                                            if (data.product[0].jarDeposit) {
                                                userdata.subscribedProd[0].jarDeposit = userdata.subscribedProd[0].jarDeposit + parseInt(data.product[0].jarDeposit);
                                            }
                                        } else {
                                            console.log("inside else---create jar balance");
                                            
                                            var subProd = {};
                                            subProd.recentOrder = data._id;
                                            subProd.product = data.product[0].product;
                                            subProd.jarBalance = parseInt(data.product[0].productQuantity);
                                            if (data.product[0].jarDeposit) {
                                                subProd.jarDeposit = parseInt(data.product[0].jarDeposit);
                                            }
                                            userdata.subscribedProd.push(subProd);
                                        }
                                    }
                                    userdata.status = 'Active';
                                    User.saveData(userdata,function (err, updated) {
                                        if (err) {
                                            console.log("error occured in user update");
                                        } else {
                                            console.log("user updated successfully");
                                        }
                                    });
                                }
                            });
                            if (!_.isEqual(data.methodOfPayment, 'Customer') && (_.isEqual(data.product[0].product.category.subscription, 'Yes') && data.plan != 'Onetime')) {
                                console.log("When RP pays Customer will get this msg");
                                var smsMessage = "Order #" + data.orderID + " confirmed! Download the HaTa App or call on 022 - 33024910 to schedule your first delivery.";
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
                            } else if (!_.isEqual(data.methodOfPayment, 'Customer') && (_.isEqual(data.product[0].product.category.subscription, 'No') || data.plan == 'Onetime')) {
                                console.log("when customer pays");
                                var smsMessage = "Order #" + data.orderID + " confirmed! Your delivery is scheduled for " + moment(data.deliverdate).add(1, "day").format("dddd, MMM D");

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

                            } else if (_.isEqual(data.methodOfPayment, 'Customer') && (_.isEqual(data.product[0].product.category.subscription, 'Yes') && data.plan != 'Onetime')) {
                                console.log("when customer pays");
                                var smsMessage = "Payment successful! Order #" + data.orderID + " is confirmed. Download the HaTa App or call on 022 - 33024910 to schedule your first delivery."

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

                            } else if (_.isEqual(data.methodOfPayment, 'Customer') && (_.isEqual(data.product[0].product.category.subscription, 'No') || data.plan == 'Onetime')) {
                                console.log("when customer pays");
                                var smsMessage = "Payment successful! Order #" + data.orderID + " is confirmed. Your delivery is scheduled for " + moment(data.deliverdate).add(1, "day").format("dddd, MMM D");

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
            var foundPrice = {};
            console.log("val in prodList", val);
            var orderedPrice = _.orderBy(val.product.priceList, function (n) {
                return parseInt(n.endRange);
            });

            if (orderedPrice.length === 0) {
                console.log("val.product.price--", val.product.price);
                val.finalPrice = val.product.price;
            } else {
                _.each(orderedPrice, function (obj) {
                    if (parseInt(val.productQuantity) <= parseInt(obj.endRange)) {
                        foundPrice = obj;
                        val.finalPrice = obj.finalPrice;
                        return false;
                    }
                });
                if (val.productQuantity > parseInt(orderedPrice[orderedPrice.length - 1].endRange)) {
                    val.finalPrice = orderedPrice[orderedPrice.length - 1].finalPrice;
                }
            }
        });

        return prodList;
    },
    //used for saving the order
    saveOrder: function (data, callback) {
        console.log('inside save order', data);
        if (!data._id) {
            var year = new Date().getFullYear().toString().substr(2, 2);
            var month = new Date().getMonth() + 1;
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
                        var ID = parseInt(fdata[0].orderID.toString().substr(4, fdata[0].orderID.toString().length)) + 1;
                        console.log(ID);
                        orderID = year + strMon + ID;
                        console.log("calculated order id", orderID);
                        // orderID="cust"+year+strMon+ID;
                        // console.log(orderID);
                    } else {
                        console.log("hello");
                        orderID = year + strMon + "1";
                        console.log(orderID);
                    }
                    data.orderID = orderID;
                    data.orderDate = new Date();
                    data.product = Order.calculatePrice(data.product)
                    data.totalAmount = _.sumBy(data.product, function (o) {
                        return parseInt(o.finalPrice * o.productQuantity);
                    });
                    if (data.product[0].jarDeposit) {
                        data.totalAmount = data.totalAmount + data.product[0].jarDeposit;
                    }
                    console.log("totalAmount", data.totalAmount);
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
                    // if (data.product) {
                    //     console.log("inside Delivery req create", data.product);
                    //     var deliveryReqData = {};
                    //     _.forEach(data.product, function (val) {
                    //         console.log("val--", val);
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

                    //     })
                    // }
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
        if (data.methodofjoin) {
            userData.methodofjoin = data.methodofjoin;
        }
        userData.accessLevel = 'Customer';
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
                    if (_.isEqual(savedOrder.orderFor, 'RMForCustomer') && _.isEqual(savedOrder.methodOfPayment, "Customer")) {
                        console.log("inside if----send msg to RM", savedOrder.orderID, partnerName);
                        var shortU;
                        // Shorten a long url and output the result

                        bitly.shorten(env.frontend + "/orderconfirmation/" + savedOrder._id)
                            .then(function (response) {
                                console.log("shortUrl", response);
                                shortU = response.data.url;
                                var smsMessage = "Welcome to the HaTa family! We have received your order #" + savedOrder.orderID + " through our partner " + partnerName + ". You can confirm the order and pay here: " + shortU;

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

                    } else if (_.isEqual(savedOrder.orderFor, 'RMForCustomer') && !_.isEqual(savedOrder.methodOfPayment, "Customer")) {
                        console.log("inside if----send msg to RM", savedOrder.orderID, partnerName);
                        var shortU;
                        // Shorten a long url and output the result

                        bitly.shorten(env.frontend + "/orderconfirmation/" + savedOrder._id)
                            .then(function (response) {
                                console.log("shortUrl", response);
                                shortU = response.data.url;
                                var smsMessage = "Welcome to the HaTa family! We have received your order #" + savedOrder.orderID + " through our partner " + partnerName + ".Please confirm your order here: " + shortU;

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
        userData.accessLevel = 'Customer';
        if (data.methodofjoin) {
            userData.methodofjoin = data.methodofjoin;
        }
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
                        if (_.isEqual(savedOrder.orderFor, 'RMForCustomer') && _.isEqual(savedOrder.methodOfPayment, "Customer")) {
                            console.log("inside if----send msg to RM", savedOrder.orderID, partnerName);
                            var shortU;
                            // Shorten a long url and output the result

                            bitly.shorten(env.frontend + "/orderconfirmation/" + savedOrder._id)
                                .then(function (response) {
                                    console.log("shortUrl", response);
                                    shortU = response.data.url;
                                    var smsMessage = "Welcome to the HaTa family! We have received your order #" + savedOrder.orderID + " through our partner " + partnerName + ". You can confirm the order and pay here: " + shortU;

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

                        } else if (_.isEqual(savedOrder.orderFor, 'RMForCustomer') && !_.isEqual(savedOrder.methodOfPayment, "Customer")) {
                            console.log("inside if----send msg to RM", savedOrder.orderID, partnerName);
                            var shortU;
                            // Shorten a long url and output the result

                            bitly.shorten(env.frontend + "/orderconfirmation/" + savedOrder._id)
                                .then(function (response) {
                                    console.log("shortUrl", response);
                                    shortU = response.data.url;
                                    var smsMessage = "Welcome to the HaTa family! We have received your order #" + savedOrder.orderID + " through our partner " + partnerName + ".Please confirm your order here: " + shortU;

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
    resendLink: function (data, callback) {
        Order.findOne({
            _id: data.orderId
        }).deepPopulate("customer customer.relationshipId").exec(function (err, found) {
            if (err) {
                callback(err, null);
            } else {
                if (found) {
                    console.log("found--", found);
                    if (_.isEqual(found.orderFor, 'RMForCustomer') && _.isEqual(found.methodOfPayment, "Customer")) {
                        console.log("inside if----send msg to RM", found.orderID, found.customer.relationshipId.name);
                        var shortU;
                        // Shorten a long url and output the result

                        bitly.shorten(env.frontend + "/orderconfirmation/" + found._id)
                            .then(function (response) {
                                console.log("shortUrl", response);
                                shortU = response.data.url;
                                var smsMessage = "Welcome to the HaTa family! We have received your order #" + found.orderID + " through our partner " + found.customer.relationshipId.name + ". You can confirm the order and pay here: " + shortU;

                                var smsObj = {
                                    "message": "HTBT",
                                    "sender": "HATABT",
                                    "sms": [{
                                        "to": found.customer.mobile,
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
                        callback(null, []);

                    } else if (_.isEqual(found.orderFor, 'RMForCustomer') && !_.isEqual(found.methodOfPayment, "Customer")) {
                        console.log("inside if----send msg to RM", found.orderID, found.customer.relationshipId.name);
                        var shortU;
                        // Shorten a long url and output the result

                        bitly.shorten(env.frontend + "/orderconfirmation/" + found._id)
                            .then(function (response) {
                                console.log("shortUrl", response);
                                shortU = response.data.url;
                                var smsMessage = "Welcome to the HaTa family! We have received your order #" + found.orderID + " through our partner " + found.customer.relationshipId.name + ".Please confirm your order here: " + shortU;

                                var smsObj = {
                                    "message": "HTBT",
                                    "sender": "HATABT",
                                    "sms": [{
                                        "to": found.customer.mobile,
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
                        callback(null, []);
                    } else {
                        console.log("Please provide mobile mumber");
                        callback(null, {
                            message: "Please provide mobile mumber"
                        });
                    }
                }
            }
        });
    },
    getOrderWithDelivery: function (data, callback) {
        console.log("data", data);
        var mergedData = [];
        Order.find({
            customer: data._id,
            $or: [{
                plan: 'Monthly'
            }, {
                plan: 'Quarterly'
            }],
            paymentStatus: 'Paid'
        }).deepPopulate("product.product").sort({
            createdAt: -1
        }).exec(function (err, orderData) {
            if (err) {
                console.log(err);
                // callback(err, null);
            } else {
                DeliveryRequest.find({
                    customer: data._id,
                    $or: [{
                        'status': 'Full Delivery Successful'
                    }, {
                        'status': 'Partial Delivery Successful'
                    }]
                }).deepPopulate("product").sort({
                    createdAt: -1
                }).exec(function (err, deliveryData) {
                    if (err) {
                        console.log(err);
                        callback(err, null);
                    } else {
                        console.log("deliveryData--", deliveryData.length);
                        mergedData = _.union(orderData, deliveryData);
                        console.log("mergedData--", mergedData.length);
                        mergedData = _.orderBy(mergedData, ['createdAt'], ['desc']);
                        callback(null, mergedData);
                    }
                });
            }
        });


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