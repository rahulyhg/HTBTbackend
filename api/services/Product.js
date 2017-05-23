var schema = new Schema({
    productID: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        required: true,
    },
    tag: {
        type: String,
    },
    price: {
        type: String,
    },
    commission: [{
        commissionType: {
            type: Schema.Types.ObjectId,
            ref: 'PartnerLevel'
        },
        rate: String
    }],
    // goldCommission: {
    //     type: String,
    // },
    // silverCommission: {
    //     type: String,
    // },
    // platinumCommission: {
    //     type: String,
    // },
    priceList: [{
        endRange: String,
        finalPrice: String
    }],

    deposit: {
        type: String
    },
    AmtDeposit: {
        type: Number,
    },
    applicableBefore: {
        type: Number,
    },
    smallImage: {
        type: String,
        default: "",
    },
    bigImage: {
        type: String,
        default: "",
    },
    limit: {
        type: String,
        default: "",
    },
    maxBonusLimit: {
        type: String,
        default: "",
    },
    quantity: {
        type: String,
        default: "",
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Categories'
    },
    featuredProduct: {
        type: Boolean
    },



});

schema.plugin(deepPopulate, {
    populate: {
        'user': {
            select: 'name _id'
        },
        'category': {
            select: ''
        }
    }
});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);

module.exports = mongoose.model('Product', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "user category commission.commissionType", "user category commission.commissionType"));
var model = {

    getAllFeaturedProduct: function (data, callback) {
        console.log("data", data)
        Product.find({
            featuredProduct: true
        }).deepPopulate('category').exec(function (err, found) {
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

    getAllCategoryProduct: function (data, callback) {
        console.log("data", data);
        Product.find({
            category: data.category
        }).deepPopulate('category').exec(function (err, found) {
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

    saveProduct: function (data, callback) {
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
            var productID = '';
        }
        Product.find({}).sort({
            createdAt: -1
        }).exec(function (err, fdata) {
            if (err) {
                console.log(err);
                callback(err, null);
            } else {
                // var getmonth = fdata[fdata.length-1].productID.toString().substr(fdata[fdata.length-1].productID.toString().length-7,fdata[fdata.length-1].productID.toString().length);
                // var getmonth = 03;
                // var strMon = 03;
                if (!data._id) {
                    console.log(fdata.length);
                    if (fdata.length > 0) {
                        console.log(fdata[0]);
                        var ID = parseInt(fdata[0].productID.toString().substr(fdata[0].productID.toString().length - 5, fdata[0].productID.toString().length)) + 1;
                        console.log(ID);
                        if (ID.toString().length == 5) {
                            productID = "productID" + year + strMon + ID;
                            console.log("5", productID);

                        } else if (ID.toString().length == 4) {
                            productID = "productID" + year + strMon + "0" + ID;
                            console.log("4", productID);

                        } else if (ID.toString().length == 3) {
                            productID = "productID" + year + strMon + "00" + ID;
                            console.log("3", productID);

                        } else if (ID.toString().length == 2) {
                            productID = "productID" + year + strMon + "000" + ID;
                            console.log("2", productID);

                        } else {
                            productID = "productID" + year + strMon + "0000" + ID;
                            console.log("1", productID);
                        }
                        // productID="cust"+year+strMon+ID;
                        // console.log(productID);
                    } else {
                        console.log("hello");
                        productID = "productID" + year + strMon + "00001";
                        console.log(productID);
                    }
                    data.productID = productID;
                    data.dateofjoin = new Date();
                }
                Product.saveData(data, function (err, savedData) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, savedData);
                    }
                })
            }
        });
    },


};
module.exports = _.assign(module.exports, exports, model);