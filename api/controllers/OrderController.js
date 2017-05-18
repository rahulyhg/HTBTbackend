module.exports = _.cloneDeep(require("sails-wohlig-controller"));
var controller = {

getOrderByUser: function (req, res) {
   if (req.body) {
       Order.getOrderByUser(req.body, res.callback);
   } else {
       res.json({
           value: false,
           data: {
               message: "Invalid Request"
           }
       })
   }
},

saveOrder: function (req, res) {
   if (req.body) {
       Order.saveOrder(req.body, res.callback);
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
