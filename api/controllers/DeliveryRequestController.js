module.exports = _.cloneDeep(require("sails-wohlig-controller"));
var controller = {
    saveDeliveryRequest: function (req, res) {
     if (req.body) {
         DeliveryRequest.saveDeliveryRequest(req.body, res.callback);
     } else {
         res.json({
             value: false,
             data: {
                 message: "Invalid Request"
             }
         })
     }
 },
 getDeliveryRequestByUser: function (req, res) {
     if (req.body) {
         DeliveryRequest.getDeliveryRequestByUser(req.body, res.callback);
     } else {
         res.json({
             value: false,
             data: {
                 message: "Invalid Request"
             }
         })
     }
 },
 getDeliveryRequestByOrder: function (req, res) {
     if (req.body) {
         DeliveryRequest.getDeliveryRequestByOrder(req.body, res.callback);
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
