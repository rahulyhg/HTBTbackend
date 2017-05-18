var schema = new Schema({
    pincode: Number,
    days: [
        String
    ],
    holidays: [{
      hdate: Date,
        description: {
            type: String,
        }}
    ]
});

schema.plugin(deepPopulate, {

});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);

module.exports = mongoose.model('Pincode', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "Pincode", "Pincode"));
var model = {

};
module.exports = _.assign(module.exports, exports, model);
