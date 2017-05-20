var schema = new Schema({
    requestID: String,
    deliverdate: Date,
    delivertime: Date,

    status: {
        type: String, //Delivery Scheduled ,In Transit,Full Delivery Successful,Partial Delivery Successful,Delivery Failed
        default: "Delivery Scheduled"
    },
    Quantity:{
        type: String,
    },
    QuantityDelivered:{
        type: String,
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
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

var exports = _.cloneDeep(require("sails-wohlig-service")(schema));
var model = {};
module.exports = _.assign(module.exports, exports, model);