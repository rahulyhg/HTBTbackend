var schema = new Schema({
    name: {
        type: String,
        default: ""
    },

    description: {
        type: String,
        default: ""

    },
    catImage: {
        type: String,
        default: ""

    }
});

schema.plugin(deepPopulate, {

});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);

module.exports = mongoose.model('Categories', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema));
var model = {
  getCategories: function (data, callback) {
      console.log("data", data)
      Categories.find({}).exec(function (err, found) {
          if (err) {
              callback(err, null);
          } else {
              if (found) {
                  callback(null, found);
              } else {
                  callback({
                      message: "Incorrect Credentials!"
                  }, null);
              }
          }

      });
  },
};
module.exports = _.assign(module.exports, exports, model);
