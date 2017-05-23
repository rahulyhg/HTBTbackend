var schema = new Schema({
    requestID: {
        type: String,
        unique: true
    },
    deliverdate: Date,
    delivertime: Date,
    status: {
        type: String, //Delivery Scheduled ,In Transit,Full Delivery Successful,Partial Delivery Successful,Delivery Failed
        default: "Delivery Scheduled"
    },
    Quantity: {
        type: String,
    },
    QuantityDelivered: {
        type: String,
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
    },
    customer: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    Order: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
    },
    requestDate: Date,
    methodOfRequest: String, //IVR,App,Customer Representative

});

schema.plugin(deepPopulate, {});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('DeliveryRequest', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "product Order customer", "product Order customer"));
var model = {

    scheduleDelivery: function (data, callback) {
        var reqID = '';
        DeliveryRequest.find({}).sort({
            createdAt: -1
        }).exec(function (err, fdata) {
            if (err) {
                console.log(err);
                callback(err, null);
            } else {
                if (fdata.length > 0) {
                    console.log(fdata[0]);
                    reqId = parseInt(fdata[0].requestID) + 1;
                } else {
                    console.log("no data");
                    reqID = 1;
                    console.log(reqID);
                }
                data.requestID = reqID;
                data.requestDate = new Date();
                DeliveryRequest.saveData(data, function (err, savedData) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, savedData);
                    }
                })
            }
        });
    },
    saveDeliveryRequest: function (data, callback) {
        if (data.Quantity > data.QuantityDelivered) {
            data.status = "Partial Delivery Successful";
        } else if (data.Quantity == data.QuantityDelivered) {
            data.status = "Full Delivery Successful";
        } else if (data.QuantityDelivered == 0) {
            data.status = "Delivery Failed";
        }
        DeliveryRequest.saveData(data, function (err, savedData) {
            if (err) {
                callback(err, null);
            } else {
                async.parallel([
                    //Function to search event name
                    function () {
                        Product.findOne({
                            _id: data.product
                        }).exec(function (err, found) {
                            if (err) {
                                callback(err, null);
                            } else {
                                if (found) {
                                    // callback(null, found);
                                    found.quantity = found.quantity - data.QuantityDelivered;
                                    Product.saveData(found, function (err, savedProd) {
                                        if (err) {
                                            console.log("err", err);
                                        } else {
                                            console.log("Product updated");
                                        }
                                    });
                                } else {
                                    console.log("not found");
                                }
                            }
                        });

                    },

                    function (callback) {
                        Order.findOne({
                            _id: data.Order
                        }).exec(function (err, foundOrder) {
                            if (err) {
                                callback(err, null);
                            } else {
                                if (foundOrder) {
                                    // callback(null, found);
                                    foundOrder.balance = foundOrder.balance - data.QuantityDelivered;
                                    Order.saveData(foundOrder, function (err, savedOrder) {
                                        if (err) {
                                            console.log("err", err);
                                        } else {
                                            console.log("Product updated");
                                        }
                                    });
                                } else {
                                    console.log("not found");
                                }
                            }
                        });
                    }
                ], function (error, data) {
                    if (error) {
                        console.log("designer >>> searchdesigner>>> async.parallel >>> final callback  >>> error", error);
                        callback(error, null);
                    } else {
                        callback(null, savedData);
                    }
                }) //End of async.parallel
                callback(null, savedData);

            }
        })
    },
    getDeliveryRequestByUser: function (data, callback) {
        console.log("data", data)
        DeliveryRequest.find({
            customer: data._id
        }).lean().sort({
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

};
module.exports = _.assign(module.exports, exports, model);