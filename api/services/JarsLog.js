var schema = new Schema({
      customer: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    jars:String,
    
});

schema.plugin(deepPopulate, {});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('JarsLog', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema));
var model = {};
module.exports = _.assign(module.exports, exports, model);