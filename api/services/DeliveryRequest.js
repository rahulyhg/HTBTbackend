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
    earnings: {
        type: Number,
        default: 0
    },
    requestDate: Date,
    methodOfRequest: String, //IVR,App,Customer Representative
    notes: [{
        note: {
            type: String
        },
        notestime: Date
    }],
});

schema.plugin(deepPopulate, {
     'product': {
        select: ''
    },
    'product.category': {
        select: ''
    }
});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('DeliveryRequest', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "product Order customer product.category", "product Order customer product.category"));
var model = {
    //to schedule the delivery 'data.customer is required here'
    scheduleDelivery: function (data, callback) {
        console.log("data--", data);
        var reqID = '';
        User.findOne({
            _id: data.customer
        }).deepPopulate('subscribedProd.recentOrder').exec(function (err, userData) {
            if (err) {
                console.log(err);
                callback(err, null);
            } else {
                console.log("userData", userData);
                DeliveryRequest.find({
                    Order: data.order
                }).exec(function (err, previousDelivery) {
                    if (err) {
                        console.log(err);
                    } else {
                        if (!_.isEmpty(previousDelivery)) {
                            console.log("inside if----data found");
                            var deliveryReqData = {};
                            if (userData.subscribedProd[0].jarBalance > data.Quantity) {
                                deliveryReqData.product = userData.subscribedProd[0].product;
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
                                        }
                                        console.log(reqID);
                                        deliveryReqData.deliverdate = data.deliverdate;
                                        deliveryReqData.delivertime = data.delivertime;
                                        deliveryReqData.Order = data.order;
                                        deliveryReqData.requestDate = new Date();
                                        deliveryReqData.Quantity = data.Quantity;
                                        deliveryReqData.methodOfRequest = data.methodOfRequest;
                                        deliveryReqData.requestID = reqId;
                                        deliveryReqData.customer = data.customer;
                                        console.log("deliveryReqData--if222", deliveryReqData);
                                        DeliveryRequest.saveData(deliveryReqData, function (err, savedData) {
                                            if (err) {
                                                callback(err, null);
                                            } else {
                                                callback(null, savedData);
                                            }
                                        })
                                    }
                                });
                            }
                        } else {
                            console.log("inside else----data found");
                            var index = 0;
                            var deliveryReqData = {};
                            var savedDeliveryData = {};
                            async.eachSeries(userData.subscribedProd[0].recentOrder.product, function (val, callback1) {
                                val.reqId = 0;
                                console.log("HHHHHHHHH");
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
                                        deliveryReqData.product = val.product;
                                        if (index == 0 && val.product) {
                                            deliveryReqData.Quantity = data.Quantity;
                                        } else {
                                            deliveryReqData.Quantity = val.productQuantity;
                                        }
                                        index++;

                                        deliveryReqData.deliverdate = data.deliverdate;
                                        deliveryReqData.delivertime = data.delivertime;
                                        deliveryReqData.Order = data.order;
                                        deliveryReqData.requestDate = new Date();
                                        deliveryReqData.methodOfRequest = data.methodOfRequest;
                                        deliveryReqData.requestID = reqId;
                                        deliveryReqData.customer = data.customer;
                                        green("deliveryReqData--", deliveryReqData);
                                        DeliveryRequest.saveData(deliveryReqData, function (err, savedDelivery) {
                                            if (err) {
                                                red("error while creating delivery", err);
                                                callback(err, null);
                                            } else {
                                                console.log("savedDelivery--", index, "-indx", savedDelivery);
                                                savedDeliveryData = savedDelivery;
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
                            }, function (error, data) {
                                if (err) {
                                    console.log("error found in doLogin.else callback1");
                                    // callback3(null, err);
                                } else {
                                    console.log("complted async series");
                                    callback(null, savedDeliveryData);
                                }
                            });
                        }
                    }
                });
            }
        });

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
                                    if (data.product.category) {
                                        if (_.isEqual(data.product.category.subscription, 'Yes')) {
                                            foundcust.subscribedProd[0].jarBalance = foundcust.subscribedProd[0].jarBalance - data.QuantityDelivered;
                                        }
                                    }
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
                        console.log("inside earning calculation", data.customer._id, data.customer.relationshipId);
                        if (data.customer.relationshipId) {
                            User.findOne({
                                _id: data.customer.relationshipId
                            }).exec(function (err, foundUser) {
                                if (err) {
                                    //callback(err, null);
                                } else {
                                    if (foundUser) {
                                        console.log("foundUser--", foundUser);
                                        if (_.isEqual(foundUser.earningsBlock, 'No') && data.product.commission) {
                                            _.forEach(data.product.commission, function (val) {
                                                console.log("val.commissionType--", val.commissionType, "foundUser.levelstatus", foundUser.levelstatus, val.commissionType == foundUser.levelstatus);

                                                if (val.commissionType == foundUser.levelstatus) {
                                                    console.log("commisiontype matched", val.rate);
                                                    if (foundUser.earnings > 0) {
                                                        console.log("inside if", foundUser.earnings);
                                                        foundUser.earnings = foundUser.earnings + (parseInt(val.rate) * parseInt(data.QuantityDelivered));
                                                    } else {
                                                        console.log("inside else");
                                                        foundUser.earnings = parseInt(val.rate) * parseInt(data.QuantityDelivered);
                                                    }
                                                    User.saveData(foundUser, function (err, savedEarningUser) {
                                                        if (err) {
                                                            console.log("err", err);
                                                        } else {
                                                            console.log("earnings saved inside user");
                                                        }
                                                    });
                                                    data.earnings = parseInt(val.rate) * parseInt(data.QuantityDelivered);
                                                    DeliveryRequest.saveData(data, function (err, savedData) {
                                                        if (err) {
                                                            console.log("error while saving earning in DeliveryRequest");
                                                            // callback(err, null);
                                                        } else {
                                                            console.log("earnings saved in DeliveryRequest Successfully");
                                                        }
                                                    })

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
        console.log("data", data);
        User.findOne({
            _id: data.customer
        }).exec(function (err, found) {
            if (err) {
                callback(err, null);
            } else {
                if (found) {
                    DeliveryRequest.find({
                        customer: data.customer,
                        product: found.subscribedProd[0].product,
                        status: 'Delivery Scheduled'
                    }).lean().sort({
                        _id: -1
                    }).exec(function (err, found) {
                        if (err) {
                            callback(err, null);
                        } else {
                            if (found) {
                                callback(null, found[0]);
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
                        Order: data.order,
                        status: 'Delivery Scheduled',
                        deliverdate: {
                            $gt: new Date()
                        },
                        customer: found._id
                    }).lean().sort({
                        _id: -1
                    }).exec(function (err, foundDelivery) {
                        if (err) {
                            callback(err, null);
                        } else {
                            async.eachSeries(foundDelivery, function (val, callback1) {
                                val.status = 'Cancelled';
                                DeliveryRequest.saveData(val, function (err, data) {
                                    if (err) {
                                        console.log("error while cancelling the request");
                                        callback1();
                                    } else {
                                        console.log("DeliveryRequest request cance Successfully");
                                        callback1();
                                    }
                                })

                            }, function (error, data) {
                                if (err) {
                                    console.log("error found in doLogin.else callback1");
                                    callback(null, err);
                                } else {
                                    console.log("complted async series");
                                    callback(null, "Cancelled");
                                }
                            })
                        }
                    });
                } else {
                    callback({
                        message: "Invalid data!"
                    }, null);
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
    },
    getAllDeliveryReqByRP: function (data, callback) {
        console.log(ObjectId(data.user));
        DeliveryRequest.aggregate([{
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
                "$lookup": {
                    "from": "products",
                    "localField": "product",
                    "foreignField": "_id",
                    "as": "product"
                }
            },
            {
                $unwind: {
                    path: "$product",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                $match: {
                    'customer.relationshipId': ObjectId(data.user)
                }
            },
            {
                $match: {
                    $or: [{
                        'status': 'Full Delivery Successful'
                    }, {
                        'status': 'Partial Delivery Successful'
                    }]
                }
            }


        ]).exec(function (err, found) {
            if (err) {
                console.log(err);
                callback(err, null);
            } else {
                // console.log("found", found);
                callback(null, found);
            }
        })

    },

};
module.exports = _.assign(module.exports, exports, model);