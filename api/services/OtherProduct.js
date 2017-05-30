var schema = new Schema({
    name: {
        type: String,
        required: true,
    },

    price: {
        type: String,
    },

    smallImage: {
        type: String,
        default: "",
    },
    bigImage: {
        type: String,
        default: "",
    },
    quantity: {
        type: String,
        default: "",
    },
    addones: {
        type: String,
        default: "",
    },
    description: {
        type: String
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

module.exports = mongoose.model('OtherProduct', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "OtherProduct", "OtherProducts"));
var model = {

    getAllFeaturedOtherProduct: function (data, callback) {
        console.log("data", data)
        OtherProduct.find({
            featuredOtherProduct: true
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

    getAllCategoryOtherProduct: function (data, callback) {
        console.log("data", data)
        OtherProduct.find({
            category: data.category
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
    }

};
module.exports = _.assign(module.exports, exports, model);