var schema = new Schema({
    name: {
        type: String,
    },
    description: {
        type: String,
    },
    earrningsNeeded: {
        type: String,
    },
    levelID: {
        type: String,
        unique: true
    }

});

schema.plugin(deepPopulate, {

});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);

module.exports = mongoose.model('PartnerLevel', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema));
var model = {

    saveLevel: function (data, callback) {
        var reqID = '';
        PartnerLevel.find({}).sort({
            createdAt: -1
        }).exec(function (err, fdata) {
            if (err) {
                console.log(err);
               // callback(err, null);
            } else {
                console.log("inside else");
                if (fdata.length > 0) {
                    console.log(fdata[0]);
                    reqId = parseInt(fdata[0].levelID) + 1;
                } else {
                    console.log("no data");
                    reqID = 1;
                    console.log(reqID);
                }
                data.levelID = reqID;
                console.log(data);
                PartnerLevel.saveData(data, function (err, savedData) {
                    if (err) {
                        console.log("err",err);
                        callback(err, null);
                    } else {
                       console.log(savedData);
                        callback(null, savedData);
                    }
                })
            }
        });
    }

};
module.exports = _.assign(module.exports, exports, model);