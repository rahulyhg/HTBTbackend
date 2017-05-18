var schema = new Schema({


        name: {
            type: String,
        },
        description: {
            type: String,
        },
        earrningsNeeded: {
            type: String,
        }

});

schema.plugin(deepPopulate, {

});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);

module.exports = mongoose.model('PartnerLevel', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "PartnerLevel", "PartnerLevel"));
var model = {

};
module.exports = _.assign(module.exports, exports, model);
