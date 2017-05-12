var schema = new Schema({
    product: [{
          productId:  {
                type: Schema.Types.ObjectId,
                ref: 'product',
            },
            productQuantity: {
                type: String,
            }
        }

    ],
    plan: {
        type: String,
        enum: ['monthly', 'quarterly', 'onetime']
    },
    deliverdate: Date,
    couponCode: String,
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    balance:String,
    status: String,//processing,confirmed,cancelled,delivered,delay,renew
    addedDate: Date,
    paymentStatus:String //paid,unpaid


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

module.exports = mongoose.model('Order', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "Order", "Order"));
var model = {



};
module.exports = _.assign(module.exports, exports, model);
