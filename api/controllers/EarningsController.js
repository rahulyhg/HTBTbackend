module.exports = _.cloneDeep(require("sails-wohlig-controller"));
var controller = {
    getPreviousMonthEarning: function (req, res) {
        if (req.body) {
            Earnings.getPreviousMonthEarning(req.body, res.callback);
        } else {
            res.json({
                value: false,
                data: {
                    message: "Invalid Request"
                }
            })
        }
    },
    getTotalEarningCurrentMonth: function (req, res) {
        if (req.body) {
            Earnings.getTotalEarningCurrentMonth(req.body, res.callback);
        } else {
            res.json({
                value: false,
                data: {
                    message: "Invalid Request"
                }
            })
        }
    },
  
};
module.exports = _.assign(module.exports, controller);
