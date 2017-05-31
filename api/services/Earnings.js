var schema = new Schema({
    order: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
    },
    relationshipPartner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    rank: String,
    dtRankGenerated: Date,
    earnings: String
});

schema.plugin(deepPopulate, {});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('Earnings', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema));
var model = {};
module.exports = _.assign(module.exports, exports, model);