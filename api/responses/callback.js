module.exports = function(err, data) {
    var req = this.req;
    var res = this.res;
    var sails = req._sails;
    if (err) {
        res.json({
            error: err,
            value: false
        });
    } else if (data || data==0) {
        res.json({
            data: data,
            value: true
        });
    } else {
        res.json({
            data: "No Data Found",
            value: false
        });
    }
};
