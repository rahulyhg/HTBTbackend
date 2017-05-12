var schema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        validate: validators.isEmail(),
        unique: true
    },
    establishmentName: {
        type: String,
        default: "",
    },
    establishmentAddress: {
        type: String,
        default: "",
    },
    adharCard: {
        type: String,
        default: "",
    },
    panCard: {
        type: String,
        default: "",
    },
    pincode: {
        type: Number,
        default: ""
    },
    mobile: {
        type: String,
        default: ""
    },
    landLine: {
        type: String,
        default: ""
    },
    earnings: {
        type: String,
        default: ""
    },
    lastMonthEarnings: {
        type: String,
        default: ""
    },
    accessLevel: {
        type: String,
        enum: ['User', 'Distributor']
    },
    verification: {
        type: Boolean,
        default:false
    },
    customer: [{
        customrId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        addedDate: Date,
        status: {
            type: String,
            enum: ['pending', 'Existing']
        }

    }],
    coupon:[{
      name:{
        type: String,
    }}
  ],

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

module.exports = mongoose.model('User', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "user", "user"));
var model = {
  getProfile: function (data, callback) {
      console.log("data", data)
      User.findOne({
          _id: data._id
      }).exec(function (err, found) {
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
