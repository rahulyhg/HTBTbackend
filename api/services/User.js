var schema = new Schema({
    userID: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        validate: validators.isEmail(),
        unique: true
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
        type: String,
        default: "",
    },
    landLine: {
        type: String,
        default: ""
    },
    earnings: {
        type: String,
        default: ""
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
   
    otp: String,
    lastRank:String,
    verification: {
        type: String,
        enum: ['Verified', 'Not Verified'],
        default:'Not Verified'
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
        enum: ['Active', 'Inactive']
    },
    methodofjoin: {
        type: String,
        enum: ['Relationship Partner', 'App', 'Customer Representative']
    },
    notes: [{
        note: {
            type: String
        },
        notestime: Date
    }],
    customer: [{
        customrId: {
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

});

schema.plugin(deepPopulate, {
    populate: {
        'user': {
            select: 'name _id'
        },
        'customer': {
            select: ''
        },
        'relationshipId': {
            select: ''
        },
        'levelstatus': {
            select: ''
        }
    }
});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);

module.exports = mongoose.model('User', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "user", "user", "customer", "customer"));
var model = {

    getProfile: function (data, callback) {
        console.log("data", data)
        User.findOne({
            _id: data._id
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
    saveUserData: function (data, callback) {
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
                // var getmonth = fdata[fdata.length-1].userID.toString().substr(fdata[fdata.length-1].userID.toString().length-7,fdata[fdata.length-1].userID.toString().length);
                // var getmonth = 03;
                // var strMon = 03;

                console.log(fdata.length);
                if (fdata.length > 0) {
                    console.log(fdata[0]);
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
                    // userID="cust"+year+strMon+ID;
                    // console.log(userID);


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
    },
};
module.exports = _.assign(module.exports, exports, model);