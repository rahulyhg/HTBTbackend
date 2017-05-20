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
     customer: {
        type: Schema.Types.ObjectId,
        ref: 'User',
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

var exports = _.cloneDeep(require("sails-wohlig-service")(schema,"product Order customer","product Order customer"));
var model = {

      scheduleDelivery: function (data, callback) {
        var reqID = '';
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
                    console.log(reqID);
                }
                data.requestID = reqID;
               data.requestDate=new Date();
                DeliveryRequest.saveData(data, function (err, savedData) {
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