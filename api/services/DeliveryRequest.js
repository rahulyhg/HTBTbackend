var schema = new Schema({
    requestID: {
        type: String,
        unique: true
    },
    deliverdate: Date,
    delivertime: String,
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
            } else { //9323840946
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
                                    found.quantity = parseInt(found.quantity) - parseInt(data.QuantityDelivered);
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

                    function () {
                        Order.findOne({
                            _id: data.Order
                        }).exec(function (err, foundOrder) {
                            if (err) {
                                callback(err, null);
                            } else {
                                if (foundOrder) {
                                    // callback(null, found);
                                    foundOrder.balance = foundOrder.balance - data.QuantityDelivered;
                                    foundOrder.deliverdate = data.deliverdate;
                                    foundOrder.delivertime = data.delivertime;
                                    Order.saveData(foundOrder, function (err, savedOrder) {
                                        if (err) {
                                            console.log("err", err);
                                        } else {
                                            console.log("Order updated");
                                        }
                                    });
                                } else {
                                    console.log("not found");
                                }
                            }
                        });
                    },
                    function () {
                        console.log("inside earning calculation");
                        if (data.customer.relationshipId) {
                            User.findOne({
                                _id: data.customer.relationshipId
                            }).exec(function (err, foundUser) {
                                if (err) {
                                    //callback(err, null);
                                } else {
                                    if (foundUser) {
                                        console.log("foundUser--", foundUser);
                                        _.forEach(data.product.commission, function (val) {
                                        console.log("val.commissionType--", val.commissionType,"foundUser.levelstatus",foundUser.levelstatus,val.commissionType==foundUser.levelstatus);
                                            
                                            if (val.commissionType==foundUser.levelstatus) {
                                                console.log("commisiontype matched",data.Order);
                                                Earnings.findOne({
                                                    order: data.Order._id
                                                }).exec(function (err, foundEarnings) {
                                                    if (err) {
                                                        console.log("Earnings",err);
                                                        //callback(err, null);
                                                    } else {                                                    console.log("foundEarnings ",foundEarnings);
                                                        if (foundEarnings) {
                                                            console.log(" foundEarnings----inside if ");
                                                            foundEarnings.earnings = parseInt(foundEarnings.earnings) + (parseInt(val.rate) * parseInt(data.QuantityDelivered))
                                                            Earnings.saveData(foundEarnings, function (err, savedEarnings) {
                                                                if (err) {
                                                                    console.log("err", err);
                                                                } else {
                                                                    console.log("foundEarnings updated");
                                                                }
                                                            });
                                                        } else {
                                                            console.log(" foundEarnings----inside else ");
                                                            var newEarning = {};
                                                            newEarning.order = data.Order._id;
                                                            newEarning.relationshipPartner = data.customer.relationshipId;
                                                            newEarning.earnings = parseInt(val.rate) * parseInt(data.QuantityDelivered);
                                                            Earnings.saveData(newEarning, function (err, savedEarnings) {
                                                                if (err) {
                                                                    console.log("err", err);
                                                                } else {
                                                                    console.log("newEarning saved");
                                                                }
                                                            });
                                                            console.log("not found");
                                                        }
                                                    }
                                                });
                                            }
                                        })
                                    } else {
                                        console.log("relationshipId not found");

                                    }
                                }
                            })

                        }

                    }
                ], function (error, data) {
                    if (error) {
                        console.log(" async.parallel >>> final callback  >>> error", error);
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