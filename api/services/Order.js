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
            type: String,
        },
        finalPrice: String
    }],
    plan: {
        type: String,
        enum: ['Monthly', 'Quarterly', 'Onetime']
    },
    orderFor: {
        type: String,
        enum: ['customer', 'self']
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
        enum: ['Paid', 'Unpaid'],
        default: "Unpaid"
    },
    balance: String,
    totalQuantity: String,
    totalAmount: {
        type: String
    },
    status: {
        type: String, //'Processing', 'Confirmed','Cancelled','Delivered','delay',
        default: "Processing"
    },
    paidByRP: {
        type: Boolean, //'true', 'false'
        default: false
    },
    orderDate: Date,
    methodOfOrder: String,
    methodOfPayment: String,
    paidByCustomer: Boolean,
    billingAddress: {
        address: String,
        pincode: Number
    },
    shippingAddress: {
        address: String,
        pincode: Number
    },
    transactionNo: String

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

    saveOrder: function (data, callback) {
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
                    // var getmonth = fdata[fdata.length-1].orderID.toString().substr(fdata[fdata.length-1].orderID.toString().length-7,fdata[fdata.length-1].orderID.toString().length);
                    // var getmonth = 03;
                    // var strMon = 03;

                    console.log(fdata.length);
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
                    data.balance = data.totalQuantity;
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

};
module.exports = _.assign(module.exports, exports, model);