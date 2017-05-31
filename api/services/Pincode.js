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
 getByPin: function (data, callback) {
        console.log("data", data)
        Pincode.findOne({
            pincode: data.pin
        }).exec(function (err, found) {
            if (err) {
                callback(err, null);
            } else {
                if (found) {
                    callback(null, found);
                } else {
                    callback({
                        message: "Incorrect pin!"
                    }, null);
                }
            }

        });
    },


};
module.exports = _.assign(module.exports, exports, model);
