var schema = new Schema({

    product: [{
          product:  {
                type: Schema.Types.ObjectId,
                ref: 'Product',
            },
            "product-nameOnly":String,
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
    "user-nameOnly":String,
    paymentStatus:{
          type:String,
          enum:['Paid', 'Unpaid'],
          default:"Unpaid"
        },
    balance:String,
    totalAmount:{
      type:String
    },
    status: {
      type:String,
      enum:['Processing', 'Confirmed','Cancelled','Delivered','delay'],
      default:"Processing"
    },
    addedDate: Date,



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

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "user", "user"));
var model = {



};
module.exports = _.assign(module.exports, exports, model);
