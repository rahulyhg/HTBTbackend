var schema = new Schema({
    couponCode: String,
    discountPercent: Number,
    discountAmount: Number,
    validty: Number,
    status:Boolean,
    onetime: {
        type: String,
        enum: ['Yes', 'No']
    }
    // startDate:Date,
    // endDate:Date,

});

schema.plugin(deepPopulate, {

});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);

module.exports = mongoose.model('Coupon', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "Coupon", "Coupon"));
var model = {

};
module.exports = _.assign(module.exports, exports, model);
