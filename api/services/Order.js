var schema = new Schema({
  orderID:String,
  requestID:String,
    product: [{
          product:  {
                type: Schema.Types.ObjectId,
                ref: 'Product',
            },
            "product-nameOnly":String,
            productQuantity: {
                type: String,
            }
        }
    ],
    plan: {
        type: String,
        enum: ['Monthly', 'Quarterly', 'Onetime']
    },
    orderFor: {
        type: String,
        enum: ['customer', 'self']
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    deliverdate: Date,
    delivertime: Date,
    couponCode: String,
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    "user-nameOnly":String,
    paymentStatus:{
          type:String,
          enum:['Paid', 'Unpaid'],
          default:"Unpaid"
        },
    balance:String,
    totalAmount:{
      type:String
    },
    status: {
      type:String,//'Processing', 'Confirmed','Cancelled','Delivered','delay',
      default:"Processing"
    },
    orderDate: Date,
    requestDate: Date,
methodOfOrder:String,
methodOfRequest:String,


});

schema.plugin(deepPopulate, {
    populate: {
        'user': {
            select: ''
        },
        'product.product': {
            select: ''
        }
    }
});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);

module.exports = mongoose.model('Order', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "user product.product", "user product.product"));
var model = {

  getOrderByUser: function (data, callback) {
      console.log("data", data)
      Order.find({
          user: data._id
      }).exec(function (err, found) {
          if (err) {
              callback(err, null);
          } else {
              if (found) {
                  callback(null, found);
              } else {
                  callback({
                      message: "Invalid data!"
                  }, null);
              }
          }

      });
  },
  saveOrder: function (data, callback) {
    var year = new Date().getFullYear().toString().substr(2, 2);
    var month=new Date().getMonth();
    var strMon='';
    console.log(month.toString().length,year);

    if(month.toString().length>1){
      console.log(month.length);
      strMon=month;
    }
    else {
      strMon="0"+month;
    }
      var orderID = '';
      Order.find({}).sort({
        createdAt: -1
      }).exec(function (err, fdata) {
        if (err) {
          console.log(err);
          callback(err, null);
        } else {
          // var getmonth = fdata[fdata.length-1].orderID.toString().substr(fdata[fdata.length-1].orderID.toString().length-7,fdata[fdata.length-1].orderID.toString().length);
          // var getmonth = 03;
          // var strMon = 03;

              console.log(fdata.length);
              if(fdata.length>0 )
              {
                console.log(fdata[0]);
                var ID = parseInt(fdata[0].orderID.toString().substr(fdata[0].orderID.toString().length-5,fdata[0].orderID.toString().length))+1;
                console.log(ID);
                if(ID.toString().length==5){
                  orderID="orderID"+year+strMon+ID;
                  console.log("5",orderID);

                }else if(ID.toString().length==4){
                  orderID="orderID"+year+strMon+"0"+ID;
                  console.log("4",orderID);

              }else if(ID.toString().length==3){
                  orderID="orderID"+year+strMon+"00"+ID;
                  console.log("3",orderID);

              }else if(ID.toString().length==2){
                  orderID="orderID"+year+strMon+"000"+ID;
                  console.log("2",orderID);

              }else{
                  orderID="orderID"+year+strMon+"0000"+ID;
                  console.log("1",orderID);
                }
                // orderID="cust"+year+strMon+ID;
                // console.log(orderID);


              }
              else {
                console.log("hello");
                orderID="orderID"+year+strMon+"00001";
                console.log(orderID);
              }
              data.orderID=orderID;
              data.orderDate= new Date();
              Order.saveData(data,function(err,savedData){
                if(err){
                  callback(err,null);
                }
                else {
                  callback(null,savedData);
                }
              })
        }
      });
    },

};
module.exports = _.assign(module.exports, exports, model);
