var imgurl = adminurl + "upload/";

var imgpath = imgurl + "readFile";
var uploadurl = imgurl;



myApp.factory('NavigationService', function ($http) {
    var navigation = [{
            name: "Users’ Summary",
            classis: "active",
            sref: "#/page/viewUser//",
            icon: "phone"
        }, {
            name: "Customer",
            classis: "active",
            sref: "#/page/viewCustomer//",
            icon: "phone"
        }, {
            name: "Relationship Partner",
            classis: "active",
            sref: "#/page/viewRelPartner//",
            icon: "phone"
        }, {
            name: "Categories",
            classis: "active",
            sref: "#/page/viewCategories//",
            icon: "phone"
        }, {
            name: "Products",
            classis: "active",
            sref: "#/page/viewProduct//",
            icon: "phone"
        },
        // {
        //     name: "Other Products",
        //     classis: "active",
        //     sref: "#/page/viewOtherProduct//",
        //     icon: "phone"
        // },
        {
            name: "Pincode",
            classis: "active",
            sref: "#/page/viewPincode//",
            icon: "phone"
        }, {
            name: "Coupon",
            classis: "active",
            sref: "#/page/viewCoupon//",
            icon: "phone"
        }, {
            name: "Levels",
            classis: "active",
            sref: "#/page/viewPartnerLevel//",
            icon: "phone"
        }, {
            name: "Order",
            classis: "active",
            sref: "#/page/viewOrder//",
            icon: "phone"
        }, {
            name: "Delivery Request",
            classis: "active",
            sref: "#/page/viewOrderRequest//",
            icon: "phone"
        }, {
            name: "Inventory",
            classis: "active",
            sref: "#/page/viewInventory//",
            icon: "phone"
        }
    ];

    return {
        getnav: function () {
            return navigation;
        },

        parseAccessToken: function (data, callback) {
            if (data) {
                $.jStorage.set("accessToken", data);
                callback();
            }
        },
        removeAccessToken: function (data, callback) {
            $.jStorage.flush();
        },
        profile: function (callback, errorCallback) {
            var data = {
                accessToken: $.jStorage.get("accessToken")
            };
            $http.post(adminurl + 'user/profile', data).then(function (data) {
                data = data.data;
                if (data.value === true) {
                    $.jStorage.set("profile", data.data);
                    callback();
                } else {
                    errorCallback(data.error);
                }
            });
        },
        makeactive: function (menuname) {
            for (var i = 0; i < navigation.length; i++) {
                if (navigation[i].name == menuname) {
                    navigation[i].classis = "active";
                } else {
                    navigation[i].classis = "";
                }
            }
            return menuname;
        },

        search: function (url, formData, i, callback) {
            $http.post(adminurl + url, formData).then(function (data) {
                data = data.data;
                callback(data, i);
            });
        },
        delete: function (url, formData, callback) {
            $http.post(adminurl + url, formData).then(function (data) {
                data = data.data;
                callback(data);
            });
        },
        countrySave: function (formData, callback) {
            $http.post(adminurl + 'country/save', formData).then(function (data) {
                data = data.data;
                callback(data);

            });
        },

        apiCall: function (url, formData, callback) {
            $http.post(adminurl + url, formData).then(function (data) {
                data = data.data;
                callback(data);

            });
        },
        searchCall: function (url, formData, i, callback) {
            $http.post(adminurl + url, formData).then(function (data) {
                data = data.data;
                callback(data, i);
            });
        },

        getOneCountry: function (id, callback) {
            $http.post(adminurl + 'country/getOne', {
                _id: id
            }).then(function (data) {
                data = data.data;
                callback(data);

            });
        },
        getLatLng: function (address, i, callback) {
            $http({
                url: "https://maps.googleapis.com/maps/api/geocode/json?address=" + address + "&key=AIzaSyC62zlixVsjaq4zDaL4cefNCubjCgxkte4",
                method: 'GET',
                withCredentials: false,
            }).then(function (data) {
                data = data.data;
                callback(data, i);
            });
        },
        uploadExcel: function (form, callback) {
            $http.post(adminurl + form.model + '/import', {
                file: form.file
            }).then(function (data) {
                data = data.data;
                callback(data);

            });

        },
        makePaid: function (data, callback) {
            $http.post(adminurl + 'order/orderConfirmationOrPayBackend', data).then(function (data) {
                data = data.data;
                callback(data);
            });
        },

    };
});