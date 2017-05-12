var schema = new Schema({
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
    priceList: [{
        startRange: String,
        endRange: String,
        finalPrice: String
    }],
    subscription: {
        type: Boolean
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
    quantity: {
        type: String,
        default: "",
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Categories',
        index: true
    },
    featuredProduct: {
        type: Boolean
    },



});

schema.plugin(deepPopulate, {
    populate: {
        'user': {
            select: 'name _id'
        }
    }
});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);

module.exports = mongoose.model('Product', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "Product", "Products"));
var model = {

    getAllFeaturedProduct: function (data, callback) {
        console.log("data", data)
        Product.find({
            featuredProduct: true
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




};
module.exports = _.assign(module.exports, exports, model);
