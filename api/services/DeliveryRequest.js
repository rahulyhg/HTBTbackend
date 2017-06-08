var schema = new Schema({
    requestID: {
        type: String,
        unique: true
    },
    deliverdate: Date,
    delivertime: {
        type: String,
        enum: ['8 AM to 1 PM', '1 PM to 6 PM'],
        default: '1 PM to 6 PM'
    },
    status: {
        type: String, //Delivery Scheduled ,In Transit,Full Delivery Successful,Partial Delivery Successful,Delivery Failed
        enum: ['Delivery Scheduled', 'In Transit', 'Full Delivery Successful', 'Partial Delivery Successful', 'Delivery Failed', 'Cancelled'],
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
    //to schedule the delivery 'data.customer is required here'
    scheduleDelivery: function (data, callback) {
        var reqID = '';
        User.findOne({
            _id: data.customer
        }).exec(function (err, userData) {
            if (err) {
                console.log(err);
                callback(err, null);
            } else {
                console.log("userData", userData);
                if (userData.subscribedProd[0].jarBalance > data.Quantity) {
                    data.product = userData.subscribedProd[0].product;
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
                }

            }
        })

    },
    //to update the delivery request after product is delivered 
    saveDeliveryRequest: function (data, callback) {
        if (data.Quantity > data.QuantityDelivered && data.QuantityDelivered > 0) {
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
                        User.findOne({
                            _id: data.customer._id
                        }).exec(function (err, foundcust) {
                            if (err) {
                                callback(err, null);
                            } else {
                                if (foundcust) {
                                    // callback(null, found);
                                    foundcust.subscribedProd[0].jarBalance = foundcust.subscribedProd[0].jarBalance - data.QuantityDelivered;
                                    User.saveData(foundcust, function (err, savedCust) {
                                        if (err) {
                                            console.log("err", err);
                                        } else {
                                            console.log("Customer updated");
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
                                        if (_.isEqual(foundUser.earningsBlock, 'No')) {
                                            _.forEach(data.product.commission, function (val) {
                                                console.log("val.commissionType--", val.commissionType, "foundUser.levelstatus", foundUser.levelstatus, val.commissionType == foundUser.levelstatus);

                                                if (val.commissionType == foundUser.levelstatus) {
                                                    console.log("commisiontype matched", data.Order);
                                                    if(foundUser.earnings){
                                                      foundUser.earnings=foundUser.earnings+ (parseInt(val.rate) * parseInt(data.QuantityDelivered));
                                                    }else{
                                                        foundUser.earnings= (parseInt(val.rate) * parseInt(data.QuantityDelivered)) ;
                                                    }
                                                    Earnings.findOne({
                                                        order: data.Order._id
                                                    }).exec(function (err, foundEarnings) {
                                                        if (err) {
                                                            console.log("Earnings", err);
                                                            //callback(err, null);
                                                        } else {
                                                            console.log("foundEarnings ", foundEarnings);
                                                            if (foundEarnings) {
                                                                console.log(" foundEarnings----inside if ", val.rate);
                                                                foundEarnings.earnings = parseInt(foundEarnings.earnings) + (parseInt(val.rate) * parseInt(data.QuantityDelivered))
                                                                Earnings.saveData(foundEarnings, function (err, savedEarnings) {
                                                                    if (err) {
                                                                        console.log("err", err);
                                                                    } else {
                                                                        console.log("foundEarnings updated");
                                                                    }
                                                                });
                                                            } else {
                                                                console.log(" foundEarnings----inside else ", val.rate);
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
                                        }
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
    //to get perticular user's delivery request
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
    //to get perticular user's delivery request
    getLastJarScheduledByUser: function (data, callback) {
        console.log("data", data)
        User.findOne({
            _id: data.customer
        }).exec(function (err, found) {
            if (err) {
                callback(err, null);
            } else {
                if (found) {
                    DeliveryRequest.find({
                        customer: data._id,
                        product: found.subscribedProd[0].product,
                        status: 'Delivery Scheduled'
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
                                    message: "No Data found!"
                                }, null);
                            }
                        }
                    });
                }
            }
        });
    },
    //to cancel the delivery
    cancelJarDelivery: function (data, callback) {
        console.log("data inside cancelJarDelivery", data)
        User.findOne({
            _id: data.customer
        }).exec(function (err, found) {
            if (err) {
                callback(err, null);
            } else {
                if (found) {
                    DeliveryRequest.find({
                        deliverdate: {
                            $gt: new Date()
                        },
                        customer: found._id,
                        product: found.subscribedProd[0].product,
                        status: 'Delivery Scheduled'
                    }).lean().sort({
                        _id: -1
                    }).exec(function (err, foundDelivery) {
                        if (err) {
                            callback(err, null);
                        } else {
                            if (foundDelivery) {
                                foundDelivery.status = 'Cancelled';
                                DeliveryRequest.saveData(foundDelivery, function (err, data) {
                                    if (err) {
                                        console.log("error while cancelling the request");
                                    } else {
                                        console.log("DeliveryRequest request cance Successfully");

                                    }
                                })
                            } else {
                                callback({
                                    message: "No Data found!"
                                }, null);
                            }
                        }
                    });
                }
            }
        });
    },
    getDeliveryRequestByOrder: function (data, callback) {
        console.log("data", data)
        DeliveryRequest.find({
            Order: data._id
        }).lean().sort({
            _id: 1
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
    }

};
module.exports = _.assign(module.exports, exports, model);