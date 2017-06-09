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
    earnings: Number
});

schema.plugin(deepPopulate, {});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('Earnings', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema));
var model = {
    dashboardApi: function (data, callback) {
        console.log(data);
        var dashboardData = {};
        async.parallel([
            //Function to search event name
            function (complete) {
                var days = moment(new moment().subtract(1, 'months')).daysInMonth();
                var prevMonthFirstDay = new moment().subtract(1, 'months').date(1).toDate();
                var prevMonthLastDay = new moment().subtract(1, 'months').date(days).toDate();
                console.log("prevMonthFirstDay", prevMonthFirstDay, prevMonthLastDay);
                Earnings.aggregate([{
                        $match: {
                            createdAt: {
                                $gte: prevMonthFirstDay,
                                $lt: prevMonthLastDay
                            }
                        }
                    },
                    {
                        $match: {
                            'relationshipPartner': ObjectId(data.user)
                        }
                    }
                ]).exec(function (err, found) {
                    if (err) {
                        console.log(err);
                        callback(err, null);
                    } else {
                       // console.log("previousMonthEarning---", found);

                        var earnings = _.sum(_.map(found, "earnings"));
                       // console.log("previousMonthEarning", earnings);
                        if (earnings) {
                            dashboardData.previousMonthEarning = earnings;
                        }

                        // callback(null, earnings);
                    }
                    complete();
                })
            },

            // function (complete) {
            //     var now = moment();
            //     var days = moment(now).daysInMonth();
            //     var currMonth = moment(now).month();
            //     var dayOne = moment().date(1).month(currMonth).toDate();
            //     var lastDay = moment().date(days).month(currMonth).toDate();
            //     Earnings.aggregate([{
            //             $match: {
            //                 createdAt: {
            //                     $gte: dayOne,
            //                     $lt: lastDay
            //                 }
            //             }
            //         },
            //         {
            //             $match: {
            //                 'relationshipPartner': ObjectId(data.user)
            //             }
            //         }
            //     ]).exec(function (err, found) {
            //         if (err) {
            //             console.log(err);
            //             callback(err, null);
            //         } else {
            //            // console.log("currentMonthEarnings", found.credits);
            //             dashboardData.currentMonthCredits = found.credits;
            //             var earnings = _.sum(_.map(found, "earnings"));
            //            // console.log("found", earnings);
            //             if (earnings) {
            //                 dashboardData.currentMonthEarnings = earnings;

            //             }
            //             // callback(null, earnings);
            //         }
            //         complete();
            //     })
            // },
            function (complete) {
                var now = moment();
                var days = moment(now).daysInMonth();
                var currMonth = moment(now).month();
                var dayOne = moment().date(1).month(currMonth).toDate();
                var lastDay = moment().date(days).month(currMonth).toDate();
                User.findOne({
                    _id: data.user
                }).exec(function (err, found) {
                    if (err) {
                        callback(err, null);
                    } else {
                        if (found) {
                           // console.log("CurrentMonUser---", found);
                            var CurrentMonUser = _.filter(found.customer, function (o) {
                                if (o.addedDate > dayOne && o.addedDate <= lastDay && o.status=='Existing') {
                                    return o;
                                }
                            });
                           // console.log("CurrentMonUser", CurrentMonUser);
                            if (CurrentMonUser) {
                                dashboardData.currentMonthUser = CurrentMonUser.length;
                            }
                            dashboardData.credits=found.credits;
                           dashboardData.currentMonthEarnings=found.earnings;
                            // callback(null, CurrentMonUser);
                        } else {
                            // callback({
                            //     message: "Incorrect Credentials!"
                            // }, null);
                        }
                        complete();
                    }

                });

            }
        ], function (error, data) {
            if (error) {
                console.log(" async.parallel >>> final callback  >>> error", error);
                callback(error, null);
            } else {
                console.log("dashboardData", dashboardData);
                callback(null, dashboardData);
            }
        }); //End of async.parallel

    },
    //to get previous month orders of RM
    getPreviousMonthEarning: function (data, callback) {
        console.log(ObjectId(data.user));
        var days = moment(new moment().subtract(1, 'months')).daysInMonth();
        var prevMonthFirstDay = new moment().subtract(1, 'months').date(1).toDate();
        var prevMonthLastDay = new moment().subtract(1, 'months').date(days).toDate();
        console.log("prevMonthFirstDay", prevMonthFirstDay, prevMonthLastDay);
        Order.aggregate([{
                $match: {
                    createdAt: {
                        $gte: prevMonthFirstDay,
                        $lt: prevMonthLastDay
                    }
                }
            },
            {
                $match: {
                    'relationshipPartner': ObjectId(data.user)
                }
            }
        ]).exec(function (err, found) {
            if (err) {
                console.log(err);
                callback(err, null);
            } else {
                console.log("found", found);

                var earnings = _.sum(_.map(found, "earnings"));
                console.log("found", earnings);
                callback(null, earnings);
            }
        })

    },
    getTotalEarningCurrentMonth: function (data, callback) {
        console.log(ObjectId(data.user));
        var now = moment();
        var days = moment(now).daysInMonth();
        var currMonth = moment(now).month();
        var dayOne = moment().date(1).month(currMonth).toDate();
        var lastDay = moment().date(days).month(currMonth).toDate();
        Earnings.aggregate([{
                $match: {
                    createdAt: {
                        $gte: dayOne,
                        $lt: lastDay
                    }
                }
            },
            {
                $match: {
                    'relationshipPartner': ObjectId(data.user)
                }
            }
        ]).exec(function (err, found) {
            if (err) {
                console.log(err);
                callback(err, null);
            } else {
                console.log("found", found);

                var earnings = _.sum(_.map(found, "earnings"));
                console.log("found", earnings);
                callback(null, earnings);
            }
        })

    },
};
module.exports = _.assign(module.exports, exports, model);