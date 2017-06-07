myApp.factory('apiService', function ($http, $q, $timeout, $state) {

    return {

        // This is a demo Service for POST Method.
        // getDemo: function (formData, callback) {
        //     $http({
        //         url: adminurl + 'demo/demoService',
        //         method: 'POST',
        //         data: formData
        //     }).success(callback);
        // },
        // This is a demo Service for POST Method.
        apiCall: function (url, formData, callback) {
            $http.post(adminurl + url, formData).then(function (data) {
                data = data.data;
                data.data.totalPrice = 0;
                _.each(data.data.product, function (product) {
                    if (!product.finalPrice) {
                        product.finalPrice = parseFloat(product.product.price);
                    }
                    if (product.product.category && product.product.category.subscription == "Yes") {
                        data.data.type = "Subscription";
                    }
                    data.data.totalPrice += parseFloat(product.finalPrice) * parseInt(product.productQuantity);
                });
                callback(data);
            });
        },
        getPinDetail: function (formData, callback) {
            $http.post(adminurl + "Pincode/getByPin", formData).then(function (data) {
                callback(data);
            });
        },
        getNextDate: function(stringArr) {
            var objs = [];
            _.each(stringArr,function(day) {
                var dateDay = moment(day,"dddd").toDate();
                objs.push(dateDay);
            });
            _.each(stringArr,function(day) {
                var dateDay = moment(day,"dddd").add(1,"week").toDate();
                objs.push(dateDay);
            });
            var remaining = _.filter(objs,function(dat) {
                return !moment(dat).isSameOrBefore(moment(), 'day');
            });
            return remaining[0];
        }

    };
});