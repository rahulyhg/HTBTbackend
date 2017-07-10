var cron = require('node-cron');
var schema = new Schema({
    userID: {
        type: String
    },
    name: {
        type: String
    },
    email: {
        type: String,
        validate: validators.isEmail()
    },
    establishmentName: {
        type: String,
        default: "",
    },
    establishmentAddress: {
        type: String,
        default: "",
    },
    adharCard: {
        type: String,
        default: "",
    },
    panCard: {
        type: String,
        default: "",
    },
    pincode: {
        type: Number,
        default: ""
    },
    mobile: {
        type: Number,
        unique: true
    },
    landLine: {
        type: String,
        default: ""
    },
    earnings: {
        type: Number,
        default: 0
    },
    credits: {
        type: Number,
        default: 0
    },
    lastMonthEarnings: {
        type: String,
        default: ""
    },
    deposit: {
        type: String,
        default: ""
    },
    accessLevel: {
        type: String,
        enum: ['Customer', 'Relationship Partner']
    },
    dateofjoin: Date,
    earningHistory: [{
        earnings: {
            type: Number
        },
        transactionId: String,
        settledDate: Date
    }],
    depositHistory: [{
        amountGiven: {
            type: Number
        },
        methodOfReturn: String,
        givenDate: Date
    }],
    otp: String,
    lastRank: String,
    verification: {
        type: String,
        enum: ['Verified', 'Not Verified'],
        default: 'Not Verified'
    },
    levelstatus: {
        type: Schema.Types.ObjectId,
        ref: 'PartnerLevel'
    },
    status: {
        type: String,
        enum: ['Active', 'Suspended', 'Inactive', 'Not Purchased Yet']
    },
    earningsBlock: {
        type: String,
        enum: ['Yes', 'No'],
        default: 'No'
    },
    methodofjoin: {
        type: String,
        enum: ['Relationship Partner', 'App', 'Customer Representative'],
        default: 'Customer Representative'
    },
    notes: [{
        note: {
            type: String
        },
        notestime: Date
    }],
    customer: [{
        customer: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        addedDate: Date,
        status: {
            type: String,
            enum: ['pending', 'Existing']
        }

    }],
    relationshipId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    coupon: [{
        name: {
            type: String,
        }
    }],
    cartProducts: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
        },
        "product-nameOnly": String,
        productQuantity: {
            type: Number,
        },
        finalPrice: Number,
    }],
    cart: {
        totalAmount: Number,
        totalQuantity: Number,
        DiscountAmount: String
    },
    subscribedProd: [{
        recentOrder: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
        },
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
        },
        jarBalance: {
            type: Number,
            default: 0
        },
        jarDeposit: {
            type: Number,
            default: 0
        }
    }],

});

schema.plugin(deepPopulate, {
    populate: {
        'user': {
            select: 'name _id'
        },
        'customer.customrId': {
            select: ''
        },
        'relationshipId': {
            select: ''
        },
        'levelstatus': {
            select: ''
        },
        'cartProducts.product': {
            select: ''
        },
        'subscribedProd.recentOrder': {
            select: ''
        }
    }
});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);

module.exports = mongoose.model('User', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "user cartProducts.product customer.customer relationshipId subscribedProd.recentOrder", "user cartProducts.product customer.customer relationshipId subscribedProd.recentOrder"));
var model = {
    //to get specific user profile
    getProfile: function (data, callback) {
        console.log("data", data)
        User.findOne({
            _id: data._id
        }).deepPopulate('subscribedProd.recentOrder').exec(function (err, found) {
            if (err) {
                callback(err, null);
            } else {
                if (found) {
                    callback(null, found);
                } else {
                    callback({
                        message: "Incorrect Credentials!"
                    }, null);
                }
            }

        });
    },
    //to get all customers
    getAllCustomer: function (data, callback) {
        console.log("data", data)
        var maxRow = Config.maxRow;
        var page = 1;
        if (data.page) {
            page = data.page;
        }
        var field = data.field;
        var options = {
            field: data.field,
            filters: {
                keyword: {
                    fields: ['name'],
                    term: data.keyword
                }
            },
            sort: {
                asc: 'name'
            },
            start: (page - 1) * maxRow,
            count: maxRow
        };
        User.find({
                accessLevel: "Customer"
            }).order(options)
            .keyword(options)
            .page(options, callback);
    },
    getAllCustomerWithoutLimit: function (data, callback) {
        User.find({
            accessLevel: "Customer"
        }).exec(function (err, found) {
            if (err) {
                callback(err, null);
            } else {
                if (found) {
                    callback(null, found);
                } else {
                    callback({
                        message: "Incorrect Credentials!"
                    }, null);
                }
            }

        });
    },
    //to get all partners
    getAllRelPartner: function (data, callback) {
        console.log("data", data)
        var maxRow = Config.maxRow;

        var page = 1;
        if (data.page) {
            page = data.page;
        }
        var field = data.field;

        var options = {
            field: data.field,
            filters: {
                keyword: {
                    fields: ['name'],
                    term: data.keyword
                }
            },
            sort: {
                asc: 'name'
            },
            start: (page - 1) * maxRow,
            count: maxRow
        };
        User.find({
                accessLevel: "Relationship Partner"
            }).order(options)
            .keyword(options)
            .page(options, callback);

    },
    //to get all active partners
    getAllActiveRelPartner: function (data, callback) {
        console.log("data", data)
        var maxRow = Config.maxRow;

        var page = 1;
        if (data.page) {
            page = data.page;
        }
        var field = data.field;

        var options = {
            field: data.field,
            filters: {
                keyword: {
                    fields: ['name'],
                    term: data.keyword
                }
            },
            sort: {
                asc: 'name'
            },
            start: (page - 1) * maxRow,
            count: maxRow
        };
        User.find({
                accessLevel: "Relationship Partner",
                status: "Active"

            }).order(options)
            .keyword(options)
            .page(options, callback);

    },
    //to save user data
    saveUserData: function (data, callback) {
        if (data._id) {
            User.saveData(data, function (err, savedData) {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, savedData);
                }
            })
        } else {
            if (data.accessLevel == "Customer") {
                data.status = "Not Purchased Yet";
            } else {
                data.status = "Active";

            }
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
            var userID = '';
            User.find({}).sort({
                createdAt: -1
            }).exec(function (err, fdata) {
                if (err) {
                    console.log(err);
                    callback(err, null);
                } else {
                    if (fdata.length > 0) {
                        console.log("fdata[0]", fdata[0]);
                        var ID = parseInt(fdata[0].userID.toString().substr(fdata[0].userID.toString().length - 5, fdata[0].userID.toString().length)) + 1;
                        console.log(ID);
                        if (ID.toString().length == 5) {
                            userID = "UserID" + year + strMon + ID;
                            console.log("5", userID);

                        } else if (ID.toString().length == 4) {
                            userID = "UserID" + year + strMon + "0" + ID;
                            console.log("4", userID);

                        } else if (ID.toString().length == 3) {
                            userID = "UserID" + year + strMon + "00" + ID;
                            console.log("3", userID);

                        } else if (ID.toString().length == 2) {
                            userID = "UserID" + year + strMon + "000" + ID;
                            console.log("2", userID);

                        } else {
                            userID = "UserID" + year + strMon + "0000" + ID;
                            console.log("1", userID);
                        }

                    } else {
                        console.log("hello");
                        userID = "UserID" + year + strMon + "00001";
                        console.log(userID);
                    }
                    data.userID = userID;
                    data.dateofjoin = new Date();
                    User.saveData(data, function (err, savedData) {
                        if (err) {
                            callback(err, null);
                        } else {
                            callback(null, savedData);
                        }
                    })
                }
            });
        }

    },
    //to add products in a cart of perticular user
    addToCart: function (data, callback) {
        console.log("data", data)
        User.findOne({
            _id: data.user
        }).exec(function (err, found) {
            if (err) {
                callback(err, null);
            } else {
                if (found) {
                    found.cartProducts = _.unionBy(data.products, found.cartProducts, function (n) {
                        return n.product + "";
                    });
                    console.log("found.cartProducts--", found.cartProducts);
                    found.save();
                    var totalQuantity = _.sumBy(found.cartProducts, function (o) {
                        return parseInt(o.productQuantity);
                    });
                    console.log("totalQuantity--", totalQuantity);
                    callback(null, totalQuantity);
                } else {
                    callback({
                        message: "Incorrect Credentials!"
                    }, null);
                }
            }

        });
    },
    //to remove products from cart of perticular user
    removeFromCart: function (data, callback) {
        console.log("data", data)
        User.findOne({
            _id: data.user
        }).exec(function (err, found) {
            if (err) {
                callback(err, null);
            } else {
                if (found) {
                    found.cartProducts = _.filter(found.cartProducts, function (n) {
                        return (data.product != n.product);
                    });
                    found.save();
                    var totalQuantity = _.sumBy(found.cartProducts, function (o) {
                        return parseInt(o.productQuantity);
                    });
                    callback(null, totalQuantity);
                } else {
                    callback({
                        message: "Incorrect Credentials!"
                    }, null);
                }
            }

        });
    },
    //to get the cart quantity of perticular user
    showCartQuantity: function (data, callback) {
        console.log("data", data)
        User.findOne({
            _id: data.user
        }).exec(function (err, found) {
            if (err) {
                callback(err, null);
            } else {
                if (found) {
                    var totalQuantity = _.sumBy(found.cartProducts, function (o) {
                        return parseInt(o.productQuantity);
                    });
                    callback(null, totalQuantity);
                } else {
                    callback({
                        message: "Incorrect Credentials!"
                    }, null);
                }
            }

        });
    },
    //to get the cart value of perticular user
    showCart: function (data, callback) {
        console.log("data----", data)
        User.findOne({
            _id: ObjectId(data.user)
        }).deepPopulate('cartProducts.product').exec(function (err, found) {
            if (err) {
                callback(err, null);
            } else {
                if (found) {
                    callback(null, found.cartProducts);
                } else {
                    callback({
                        message: "No Data Found!"
                    }, null);
                }
            }
        });
    },

    //To generate otp
    generateOtp: function (data, callback) {
        if (data.mobile) {
            var randomNumber = Math.floor(1000 + Math.random() * 9000); //To generate four digit random number
            var dataObj = {};
            dataObj.mobile = data.mobile;
            dataObj.otp = randomNumber;
            dataObj.accessLevel = data.accessLevel;
            User.findOne({
                mobile: dataObj.mobile,
                accessLevel: data.accessLevel
            }).exec(function (error, created) {
                if ((error || created == undefined) && created != null) {
                    console.log("User >>> generateOtp >>> User.findOne >>> error >>>", error, created);
                    callback(error, null);
                } else {
                    if (created == null) {
                        // dataObj._id = new mongoose.mongo.ObjectID();
                        console.log("user data not found so creating new user");
                        User.saveUserData(dataObj, function (error, getData) {
                            if (error || getData == undefined) {

                            } else {
                                //Send SMS
                                var smsMessage = "Welcome To The HaTa Family! Your OTP is " + dataObj.otp + "."
                                var smsObj = {
                                    "message": "HTBT",
                                    "sender": "HATABT",
                                    "sms": [{
                                        "to": dataObj.mobile,
                                        "message": smsMessage,
                                        "sender": "HATABT",
                                    }]
                                };
                                Config.sendSMS(smsObj, function (error, SMSResponse) {
                                    if (error || SMSResponse == undefined) {
                                        console.log("User >>> generateOtp >>> User.findOne >>> Config.sendSMS >>> error >>>", error);
                                        callback(error, null);
                                    } else {
                                        callback(null, {
                                            message: "OTP sent"
                                        });
                                    }
                                })
                            }
                        });
                    } else {
                        console.log("user data found so just updating");

                        User.findOneAndUpdate({
                            mobile: dataObj.mobile,
                            accessLevel: data.accessLevel
                        }, dataObj, {
                            new: true,
                            upsert: true
                        }).exec(function (err, updated) {
                            if (err || updated == undefined) {
                                console.log("User >>> generateOtp >>> User.findOne >>> User.findOneUpdate >>>", err);
                                callback(err, null);
                            } else {
                                //Send SMS
                                var smsMessage = "Welcome To The HaTa Family! Your OTP is " + dataObj.otp + "."
                                var smsObj = {
                                    "message": "HTBT",
                                    "sender": "HATABT",
                                    "sms": [{
                                        "to": dataObj.mobile,
                                        "message": smsMessage,
                                        "sender": "HATABT",
                                    }]
                                };
                                Config.sendSMS(smsObj, function (error, SMSResponse) {
                                    if (error || SMSResponse == undefined) {
                                        console.log("User >>> generateOtp >>> User.findOne >>> Config.sendSMS >>> error >>>", error);
                                        callback(error, null);
                                    } else {
                                        callback(null, {
                                            message: "OTP sent",
                                            dataObj
                                        });
                                    }
                                });
                            }
                        });
                    }

                    // } else {
                    //     callback(null, {
                    //         message: "Unable to send OTP"
                    //     });
                    // }
                }
            })
        } else {
            callback(null, {
                message: "Please provide mobile number"
            });
        }

    },

    //To verfiy OTP
    verifyOTP: function (data, callback) {
        console.log("inside verifyOTP", data);
        if (data.mobile && data.otp) {
            User.findOne({
                mobile: data.mobile,
                otp: data.otp,
                accessLevel: data.accessLevel
            }).exec(function (error, found) {
                if (error || found == undefined) {
                    console.log("User >>> verifyOTP >>> User.findOne >>> error >>>", error);
                    callback(error, null);
                } else {
                    if (_.isEmpty(found)) {
                        callback(null, {
                            message: "No data found"
                        });
                    } else {
                        callback(null, found);
                    }
                }
            })
        } else {
            callback(null, {
                message: "Please provide mobile number and otp"
            });
        }
    },
    //to get specific user profile
    getNewCustomer: function (data, callback) {
        console.log("data", data)
        var now = moment();
        var days = moment(now).daysInMonth();
        var currMonth = moment(now).month();
        var dayOne = moment().date(1).month(currMonth).toDate();
        var lastDay = moment().date(days).month(currMonth).toDate();
        User.findOne({
            _id: data.user
        }).exec(function (err, found) {
            if (err) {
                callback(err, null);
            } else {
                if (found) {
                    console.log("found", found);
                    var CurrentMonUser = _.filter(found.customer, function (o) {
                        if (o.addedDate > dayOne && o.addedDate <= lastDay) {
                            return o;
                        }
                    });
                    console.log("CurrentMonUser", CurrentMonUser);
                    callback(null, CurrentMonUser);
                } else {
                    callback({
                        message: "Incorrect Credentials!"
                    }, null);
                }
            }

        });
    },

    getByMobileNo: function (data, callback) {
        console.log("data", data)
        User.findOne({
            mobile: data.mobile,
        }).exec(function (err, found) {
            if (err) {
                callback(err, null);
            } else {
                if (found) {
                    if (found.relationshipId + "" == data.user) {
                        callback(null, "Your customer");
                    } else {
                        callback({
                            message: "customer exist!"
                        }, null);
                    }
                } else {
                    callback(null, "User not found");
                }
            }

        });
    }

};
// cron.schedule('1 * * * * *', function () {
//             console.log("m in found");      
// });
module.exports = _.assign(module.exports, exports, model);