var schema = new Schema({

    product: [{
          productId:  {
                type: Schema.Types.ObjectId,
                ref: 'Product',
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
    totalAmount:{
      type:String
    },
    status: {
      type:String,
      enum:['Processing', 'Confirmed','Cancelled','Delivered','delay'],
      default:"Processing"
    },
    addedDate: Date,
    paymentStatus:{
          type:String,
          enum:['Paid', 'Unpaid'],
          default:"Unpaid"
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

module.exports = mongoose.model('Order', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "Order", "Orders"));
var model = {



};
module.exports = _.assign(module.exports, exports, model);
