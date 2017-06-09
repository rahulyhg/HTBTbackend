var globalfunction = {};
myApp.controller('DashboardCtrl', function ($scope, TemplateService, NavigationService, $timeout, $state) {
        //Used to name the .html file
        $scope.template = TemplateService.changecontent("dashboard");
        $scope.menutitle = NavigationService.makeactive("Dashboard");
        TemplateService.title = $scope.menutitle;
        $scope.navigation = NavigationService.getnav();
    })


    // .controller('AccessController', function ($scope, TemplateService, NavigationService, $timeout, $state) {
    //     if ($.jStorage.get("accessToken")) {

    //     } else {
    //         $state.go("login");
    //     }
    // })

    .controller('JagzCtrl', function ($scope, TemplateService, NavigationService, $timeout, $state, $interval) {

        function toColor(num, red) {
            num >>>= 0;
            var b = num & 0xFF,
                g = (num & 0xFF00) >>> 8,
                r = (num & 0xFF0000) >>> 16,
                a = ((num & 0xFF000000) >>> 24) / 255;
            if (red == "red") {
                r = 255;
                b = 0;
                g = 0;
            }
            return "rgba(" + [r, g, b, a].join(",") + ")";
        }

        $scope.circles = _.times(360, function (n) {

            var radius = _.random(0, 10);
            return {
                width: radius,
                height: radius,
                background: toColor(_.random(-12525360, 12525360)),
                top: _.random(0, $(window).height()),
                left: _.random(0, $(window).width())
            };
        });

        function generateCircle() {
            _.each($scope.circles, function (n, index) {
                var radius = _.random(0, 10);
                n.width = radius;
                n.height = radius;
                n.background = toColor(_.random(-12525360, 12525360));
                if (count % 7 === 0 || count % 7 === 5 || count % 7 === 6) {
                    if (count % 7 === 6) {
                        n.background = toColor(_.random(-12525360, 12525360), "red");
                        // n.width = 3;
                        // n.height = 3;
                    }
                    var t = index * Math.PI / 180;
                    var x = (4.0 * Math.pow(Math.sin(t), 3));
                    var y = ((3.0 * Math.cos(t)) - (1.3 * Math.cos(2 * t)) - (0.6 * Math.cos(3 * t)) - (0.2 * Math.cos(4 * t)));
                    n.top = -50 * y + 300;
                    n.left = 50 * x + $(window).width() / 2;
                } else {
                    n.top = _.random(0, $(window).height());
                    n.left = _.random(0, $(window).width());
                }
            });
        }

        var count = 0;

        $interval(function () {
            count++;
            console.log("Version 1.1");
            generateCircle();
        }, 5000);

    })

    .controller('MultipleSelectCtrl', function ($scope, TemplateService, NavigationService, $timeout, $state, $stateParams, $filter, toastr) {
        var i = 0;
        $scope.getValues = function (filter, insertFirst) {
            var dataSend = {
                keyword: $scope.search.modelData,
                filter: filter,
                page: 1
            };
            if (dataSend.keyword === null || dataSend.keyword === undefined) {
                dataSend.keyword = "";
            }
            NavigationService[$scope.api]($scope.url, dataSend, ++i, function (data) {
                if (data.value) {
                    $scope.list = data.data.results;
                    if ($scope.search.modelData) {
                        $scope.showCreate = true;
                        _.each($scope.list, function (n) {
                            // if (n.name) {
                            if (_.lowerCase(n.name) == _.lowerCase($scope.search.modelData)) {
                                $scope.showCreate = false;
                                return 0;
                            }
                            // }else{
                            //     if (_.lowerCase(n.officeCode) == _.lowerCase($scope.search.modelData)) {
                            //       $scope.showCreate = false;
                            //       return 0;
                            //   }
                            // }

                        });
                    } else {
                        $scope.showCreate = false;

                    }
                    if (insertFirst) {
                        if ($scope.list[0] && $scope.list[0]._id) {
                            // if ($scope.list[0].name) {
                            $scope.sendData($scope.list[0]._id, $scope.list[0].name);
                            // }else{
                            //   $scope.sendData($scope.list[0]._id, $scope.list[0].officeCode);
                            // }
                        } else {
                            console.log("Making this happen");
                            // $scope.sendData(null, null);
                        }
                    }
                } else {
                    console.log("Making this happen2");
                    $scope.sendData(null, null);
                }


            });
        };

        $scope.$watch('model', function (newVal, oldVal) {
            if (newVal && oldVal === undefined) {
                $scope.getValues({
                    _id: $scope.model
                }, true);
            }
        });


        $scope.$watch('filter', function (newVal, oldVal) {
            var filter = {};
            if ($scope.filter) {
                filter = JSON.parse($scope.filter);
            }
            var dataSend = {
                keyword: $scope.search.modelData,
                filter: filter,
                page: 1
            };

            NavigationService[$scope.api]($scope.url, dataSend, ++i, function (data) {
                if (data.value) {
                    $scope.list = data.data.results;
                    $scope.showCreate = false;

                }
            });
        });


        $scope.search = {
            modelData: ""
        };
        if ($scope.model) {
            $scope.getValues({
                _id: $scope.model
            }, true);
        } else {
            $scope.getValues();
        }





        $scope.listview = false;
        $scope.showCreate = false;
        $scope.typeselect = "";
        $scope.showList = function () {
            $scope.listview = true;
            $scope.searchNew(true);
        };
        $scope.closeList = function () {
            $scope.listview = false;
        };
        $scope.closeListSlow = function () {
            $timeout(function () {
                $scope.closeList();
            }, 500);
        };
        $scope.searchNew = function (dontFlush) {
            if (!dontFlush) {
                $scope.model = "";
            }
            var filter = {};
            if ($scope.filter) {
                filter = JSON.parse($scope.filter);
            }
            $scope.getValues(filter);
        };
        $scope.createNew = function (create) {
            var newCreate = $filter("capitalize")(create);
            var data = {
                name: newCreate
            };
            if ($scope.filter) {
                data = _.assign(data, JSON.parse($scope.filter));
            }
            console.log(data);
            NavigationService[$scope.create](data, function (data) {
                if (data.value) {
                    toastr.success($scope.name + " Created Successfully", "Creation Success");
                    $scope.model = data.data._id;
                    $scope.ngName = data.data.name;
                } else {
                    toastr.error("Error while creating " + $scope.name, "Error");
                }
            });
            $scope.listview = false;
        };
        $scope.sendData = function (val, name) {
            $scope.search.modelData = name;
            $scope.ngName = name;
            $scope.model = val;
            $scope.listview = false;
        };
    })

    .controller('PageJsonCtrl', function ($scope, TemplateService, NavigationService, JsonService, $timeout, $state, $stateParams, $uibModal) {
        $scope.json = JsonService;
        $scope.template = TemplateService.changecontent("none");
        $scope.menutitle = NavigationService.makeactive("Country List");
        TemplateService.title = $scope.menutitle;
        $scope.navigation = NavigationService.getnav();
        JsonService.getJson($stateParams.id, function () {});

        globalfunction.confDel = function (callback) {
            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: '/backend/views/modal/conf-delete.html',
                size: 'sm',
                scope: $scope
            });
            $scope.close = function (value) {
                callback(value);
                modalInstance.close("cancel");
            };
        };

        globalfunction.openModal = function (callback) {
            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: '/backend/views/modal/modal.html',
                size: 'lg',
                scope: $scope
            });
            $scope.close = function (value) {
                callback(value);
                modalInstance.close("cancel");
            };
        };

        // globalfunction.confDel(function (value) {
        //     console.log(value);
        //     if (value) {
        //         NavigationService.apiCall(id, function (data) {
        //             if (data.value) {
        //                 $scope.showAllCountries();
        //                 toastr.success("Country deleted successfully.", "Country deleted");
        //             } else {
        //                 toastr.error("There was an error while deleting country", "Country deleting error");
        //             }
        //         });
        //     }
        // });

    })

    .controller('ViewCtrl', function ($scope, TemplateService, NavigationService, JsonService, $timeout, $state, $stateParams) {
        $scope.json = JsonService;
        $scope.template = TemplateService;
        var i = 0;
        if ($stateParams.page && !isNaN(parseInt($stateParams.page))) {
            $scope.currentPage = $stateParams.page;
        } else {
            $scope.currentPage = 1;
        }

        $scope.search = {
            keyword: ""
        };
        if ($stateParams.keyword) {
            $scope.search.keyword = $stateParams.keyword;
        }
        $scope.changePage = function (page) {
            var goTo = "page";
            if ($scope.search.keyword) {
                goTo = "page";
            }
            $state.go(goTo, {
                id: $stateParams.id,
                page: page,
                keyword: $scope.search.keyword
            });
        };

        $scope.getAllItems = function (keywordChange) {
            $scope.totalItems = undefined;
            if (keywordChange) {
                $scope.currentPage = 1;
            }
            NavigationService.search($scope.json.json.apiCall.url, {
                    page: $scope.currentPage,
                    keyword: $scope.search.keyword
                }, ++i,
                function (data, ini) {
                    if (ini == i) {
                        $scope.items = data.data.results;
                        $scope.totalItems = data.data.total;
                        $scope.maxRow = data.data.options.count;
                    }
                });
        };
        JsonService.refreshView = $scope.getAllItems;
        $scope.getAllItems();

    })

    .controller('DetailCtrl', function ($scope, TemplateService, NavigationService, JsonService, $timeout, $state, $stateParams, toastr) {
        $scope.json = JsonService;
        JsonService.setKeyword($stateParams.keyword);
        $scope.template = TemplateService;
        //$scope.json.json.action = [];
        $scope.data = {};
        console.log("detail controller");
        console.log($scope.json);

        //  START FOR EDIT
        if ($scope.json.json.preApi) {
            var obj = {};
            obj[$scope.json.json.preApi.params] = $scope.json.keyword._id;
            NavigationService.apiCall($scope.json.json.preApi.url, obj, function (data) {
                $scope.data = data.data;
                $scope.generateField = true;

            });
        } else {
            $scope.generateField = true;
        }
        //  END FOR EDIT

        $scope.onCancel = function (sendTo) {
            $scope.json.json.action[1].stateName.json.keyword = "";
            $scope.json.json.action[1].stateName.json.page = "";
            $state.go($scope.json.json.action[1].stateName.page, $scope.json.json.action[1].stateName.json);
        };

        $scope.saveData = function (formData) {
            NavigationService.apiCall($scope.json.json.apiCall.url, formData, function (data) {
                var messText = "created";
                if (data.value === true) {

                    $scope.json.json.action[0].stateName.json.keyword = "";
                    $scope.json.json.action[0].stateName.json.page = "";
                    $state.go($scope.json.json.action[0].stateName.page, $scope.json.json.action[0].stateName.json);
                    if ($scope.json.keyword._id) {
                        messText = "edited";
                    }
                    toastr.success($scope.json.json.name + " " + formData.name + " " + messText + " successfully.");
                } else {
                    messText = "creating";
                    if ($scope.json.keyword._id) {
                        messText = "editing";
                    }
                    toastr.error("Failed " + messText + " " + $scope.json.json.name);
                }
            });
        };
    })
    .controller('EditUserCtrl', function ($scope, TemplateService, NavigationService, JsonService, $timeout, $state, $stateParams, $uibModal, toastr) {
        $scope.template = TemplateService.changecontent("editUser");
        $scope.menutitle = NavigationService.makeactive("editUser");
        TemplateService.title = $scope.menutitle;
        $scope.navigation = NavigationService.getnav();
        console.log("$stateParams---", JSON.stringify($stateParams.keyword));
        console.log("$stateParams-json--", JSON.parse($stateParams.keyword)._id);
        NavigationService.apiCall("PartnerLevel/search", formData, function (data) {
            if (data.value === true) {
                console.log("getOrderByUser", data.data);
                $scope.partnerLevel = data.data.results;
            }
        });
        if (!_.isEmpty($stateParams.keyword)) {
            $scope.data = {};
            var formData = {};
            formData._id = JSON.parse($stateParams.keyword)._id;
            NavigationService.apiCall("User/getOne", formData, function (data) {
                if (data.value === true) {
                    console.log("login", data.data);
                    $scope.data = data.data;

                    NavigationService.apiCall("Order/getOrderByUser", formData, function (data) {
                        if (data.value === true) {
                            console.log("getOrderByUser", data.data);
                            $scope.OrderData = data.data;
                            _.forEach($scope.OrderData, function (val) {
                                _.forEach(val.product, function (val1) {
                                    if (_.isEqual(val1.product.subscription, 'yes')) {
                                        $scope.subscription = val;
                                    }
                                })
                            })
                            console.log("$scope.subscription", $scope.subscription);
                            //  $.jStorage.set('user', data.data);
                            //  $.jStorage.set("accessToken", data.data.accessToken[0]);
                        }
                    });

                    NavigationService.apiCall("DeliveryRequest/getDeliveryRequestByUser", formData, function (data) {
                        if (data.value === true) {
                            console.log("getOrderByUser", data.data);
                            $scope.deliverydata = data.data;

                        }

                    });
                    //  $.jStorage.set('user', data.data);
                    //  $.jStorage.set("accessToken", data.data.accessToken[0]);
                }

            });
        } else {
            $scope.data = {};
            $scope.data.notes = [];
        }
        $scope.fields = [{
            name: "Notes"
        }, {
            name: "Time"
        }];

        $scope.addNotes = function (notes) {
            var noteWithTime = {};
            noteWithTime.note = notes.note;
            noteWithTime.notestime = new Date();
            console.log($scope.data.notes);
            // noteWithTime._id=JSON.parse($stateParams.keyword)._id;
            $scope.data.notes.push(noteWithTime);
            NavigationService.apiCall("User/save", $scope.data, function (data) {
                console.log("login", data.data);
            });

        };

        $scope.settleEarnings = function (settle) {
            var settledData = {};
            settledData.earnings = $scope.data.earnings;
            settledData.transactionId = settle.transactionId;
            settledData.settledDate = new Date();
            $scope.data.earningHistory.push(settledData)
            $scope.data.earnings = 0;
            NavigationService.apiCall("User/save", $scope.data, function (data) {
                console.log("login", data.data);
            });
        };

        $scope.compareDeposite = function (amt) {
            console.log("data1,data2", amt, $scope.data.subscribedProd[0].jarDeposit);
            if ($scope.data.subscribedProd[0]) {
                if ($scope.data.subscribedProd[0].jarDeposit < amt) {
                    toastr.error("Amount Exceeds the jar Deposit amount.");
                }
            }
        };
        returnDeposit = function (returnDetails) {
            var returnData = {};
            if ($scope.data.subscribedProd[0]) {
                if ($scope.data.subscribedProd[0].jarDeposit < returnDetails.amountGiven) {
                    toastr.error("Amount Exceeds the jar Deposit amount.");
                }
            } else {
                returnData.amountGiven = returnDetails.amountGiven;
                returnData.methodOfReturn = returnDetails.methodOfReturn;
                returnData.givenDate = new Date();
                $scope.data.depositHistory.push(returnData)
                NavigationService.apiCall("User/save", $scope.data, function (data) {
                    console.log("login", data.data);
                });
            }
        };
        $scope.modalSettle = function (data) {
            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: '/backend/views/modal/settlement.html',
                size: 'lg',
                scope: $scope
            });
        };
        $scope.modalReturn = function (data) {
            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: '/backend/views/modal/returndeposit.html',
                size: 'lg',
                scope: $scope
            });
        };
        NavigationService.apiCall("User/getAllActiveRelPartner", {}, function (data) {
            console.log("login", data.data);
            $scope.activePartner = data.data.results;
        });
        $scope.reassignedmodal = function (rel, cust, status) {
            if (status = "Suspend") {
                var modalInstance = $uibModal.open({
                    animation: $scope.animationsEnabled,
                    templateUrl: '/backend/views/modal/reassigned.html',
                    size: 'lg',
                    scope: $scope
                });
            }

        };
        $scope.saveuser = function (data) {
            if (!_.isEqual(data.accessLevel, 'Customer')) {
                if (!data.levelstatus) {
                    toastr.error("Please assign level to Relationship partner.");
                } else {
                    NavigationService.apiCall("User/save", data, function (data) {
                        console.log("login", data.data);
                    });

                    $state.go("page", {
                        id: "viewRelPartner"
                    });
                }
            } else {
                NavigationService.apiCall("User/save", data, function (data) {
                    console.log("login", data.data);
                });
                if ($scope.data.accessLevel == 'Customer') {
                    $state.go("page", {
                        id: "viewCustomer"
                    });
                } else {
                    $state.go("page", {
                        id: "viewRelPartner"
                    });
                }
            }

        };
        $scope.modalAddNotes = function (data) {

            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: '/backend/views/modal/addnotes.html',
                size: 'lg',
                scope: $scope
            });
        };
        $scope.deleteAnswer = function (indexItem) {
            $scope.notes.notes.splice(indexItem, 1);
        };

    })
    .controller('EditOrderCtrl', function ($scope, TemplateService, NavigationService, JsonService, $timeout, $state, $stateParams, $uibModal, toastr) {
        $scope.template = TemplateService.changecontent("editOrder");
        $scope.menutitle = NavigationService.makeactive("editOrder");
        TemplateService.title = $scope.menutitle;
        $scope.navigation = NavigationService.getnav();
        console.log("$stateParams---", JSON.stringify($stateParams.keyword));
        var formData = {};
        $scope.data = {};
        $scope.orderData = {};
        $scope.orderData.product = [];
        $scope.orderData.totalAmount = 0;
        $scope.orderData.totalQuantity = 0;
        $scope.showMe = true;
        $scope.productList = [];
        NavigationService.apiCall("user/getAllCustomer", formData, function (data) {
            if (data.value === true) {
                console.log("getAllCustomer", data.data);
                $scope.userData = data.data.results;
            }

        });
        NavigationService.apiCall("product/search", formData, function (data) {
            if (data.value === true) {
                console.log("login", data.data);
                $scope.productData = data.data.results;
            }

        });
        if (!_.isEmpty($stateParams.keyword)) {
            var formData = {};
            formData._id = JSON.parse($stateParams.keyword)._id;
            NavigationService.apiCall("Order/getOne", formData, function (data) {
                if (data.value === true) {
                    console.log("Order", data.data);
                    $scope.orderData = data.data;
                    if (_.isEqual($scope.orderData.paymentStatus, 'Refund Pending')) {
                        $scope.refund();
                    }
                    NavigationService.apiCall("DeliveryRequest/getDeliveryRequestByOrder", formData, function (data) {
                        if (data.value === true && data.data[0]) {
                            $scope.deliveryReq = data.data[0];
                            console.log("DeliveryRequest", $scope.deliveryReq);
                            console.log(new Date());
                            console.log(new Date($scope.deliveryReq.deliverdate));

                            if (new Date($scope.deliveryReq.deliverdate) > new Date()) {

                                $scope.showMe = true;
                                console.log("it will work");
                            } else {
                                $scope.showMe = false;
                                console.log("it won't work");
                            }

                        }
                    });
                }
            });
        };
        $scope.refund = function (data) {
            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: '/backend/views/modal/refund.html',
                size: 'sm',
                scope: $scope
            });
        };
        $scope.cancel = function (data) {
            if (data == 'Cancelled') {
                var modalInstance = $uibModal.open({
                    animation: $scope.animationsEnabled,
                    templateUrl: '/backend/views/modal/conf-cancel.html',
                    size: 'lg',
                    scope: $scope
                });
            }
        };

        $scope.addProduct = function () {
            $scope.modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: '/backend/views/modal/addProduct.html',
                size: 'lg',
                scope: $scope
            });
        };
        $scope.saveProducts = function (data) {
            console.log("prod---", data.product)
            var arr = {};
            var prodJson = JSON.parse(data.product);

            var orderedPrice = _.orderBy(prodJson.priceList, function (n) {
                return parseInt(n.endRange);
            });
            console.log("orderedPrice", orderedPrice);
            foundPrice = {};
            if (orderedPrice.length === 0) {
                foundPrice.finalPrice = prodJson.price;
            } else {
                _.each(orderedPrice, function (obj) {
                    if (parseInt(data.productQuantity) <= parseInt(obj.endRange)) {
                        foundPrice = obj;
                    }
                });
                if (data.productQuantity > parseInt(orderedPrice[orderedPrice.length - 1].endRange)) {
                    foundPrice.finalPrice = orderedPrice[orderedPrice.length - 1].finalPrice;
                }
            }


            console.log("foundPrice---", foundPrice);
            if ($scope.orderData.product.length > 0) {
                if (prodJson.category && _.isEqual(prodJson.category.subscription, 'Yes')) {
                    $scope.modalInstance.close("close");
                    toastr.error("Product can't be added with subscription", "Product can't be added with subscription");
                } else {
                    arr.product = prodJson;
                    arr.finalPrice = foundPrice.finalPrice;
                    arr.productQuantity = data.productQuantity
                    $scope.orderData.product.push(arr);
                    $scope.orderData.totalAmount = parseInt($scope.orderData.totalAmount) + (parseInt(data.productQuantity) * parseInt(foundPrice.finalPrice));
                    $scope.orderData.totalQuantity = parseInt($scope.orderData.totalQuantity) + parseInt(data.productQuantity);

                }
            } else {
                arr.product = prodJson;
                arr.finalPrice = foundPrice.finalPrice;
                arr.productQuantity = data.productQuantity
                $scope.orderData.product.push(arr);
                if (!prodJson.category || !_.isEqual(prodJson.category.subscription, 'Yes')) {
                    $scope.orderData.totalQuantity = parseInt($scope.orderData.totalQuantity) + parseInt(data.productQuantity);
                    $scope.orderData.totalAmount = parseInt($scope.orderData.totalAmount) + (parseInt(data.productQuantity) * parseInt(foundPrice.finalPrice));

                }
            }
        };

        // $scope.planWisePrice = function (plan) {
        //     if (_.isEqual(plan, "Monthly")) {
        //         $scope.orderData.totalQuantity = 4 * parseInt($scope.orderData.product[0].productQuantity);
        //         $scope.orderData.totalAmount = parseInt($scope.orderData.totalQuantity) * parseInt($scope.orderData.product[0].finalPrice);
        //     }
        //     if (_.isEqual(plan, "Quarterly")) {
        //         $scope.orderData.totalQuantity = 12 * parseInt($scope.orderData.product[0].productQuantity);
        //         $scope.orderData.totalAmount = parseInt($scope.orderData.totalQuantity) * parseInt($scope.orderData.product[0].finalPrice);
        //     }
        //     if (_.isEqual(plan, "Onetime")) {
        //         $scope.orderData.totalQuantity = parseInt($scope.orderData.product[0].productQuantity);
        //         $scope.orderData.totalAmount = parseInt($scope.orderData.totalQuantity) * parseInt($scope.orderData.product[0].finalPrice);
        //     }
        // }
        $scope.data1 = {};
        $scope.setcustomer = function (data) {
            $scope.orderData.customer = JSON.parse(data);
        };
        $scope.saveOrder = function (data) {

            // if (_.isEqual(data.product[0].product.category.subscription, 'Yes')) {
            //     if (_.isEqual(data.plan, "Monthly")) {
            //         data.totalQuantity = 4 * Number(data.product[0].productQuantity)
            //     } else if (_.isEqual(data.plan, "Quarterly")) {
            //         data.totalQuantity = 12 * Number(data.product[0].productQuantity)
            //     } else {
            //         data.totalQuantity = data.productQuantity
            //     }
            // }
            console.log("saved data", data.product[0].length);
            NavigationService.apiCall("Order/saveOrder", data, function (data) {
                if (data.value === true) {
                    console.log("Order---data saved ", data.data);
                }
            });
            $state.go("page", {
                id: "viewOrder"
            });
        };
        $scope.cancelOrder = function (data) {
            if (_.isEqual(data.paymentStatus, 'Paid')) {
                data.paymentStatus = 'Refund Pending';
            }
            NavigationService.apiCall("Order/saveOrder", data, function (data) {
                if (data.value === true) {
                    console.log("Order---data saved ", data.data);
                }
            });
            $state.go("page", {
                id: "viewOrder"
            });
        };

    })
    .controller('EditOrderRequestCtrl', function ($scope, $state, TemplateService, NavigationService, JsonService, $timeout, $state, $stateParams, $uibModal, toastr) {
        $scope.template = TemplateService.changecontent("editOrderRequest");
        $scope.menutitle = NavigationService.makeactive("editOrderRequest");
        TemplateService.title = $scope.menutitle;
        $scope.navigation = NavigationService.getnav();
        console.log("$stateParams---", JSON.stringify($stateParams.keyword));
        var formData = {};
        NavigationService.apiCall("Order/search", formData, function (data) {
            if (data.value === true) {
                console.log("Order---data ", data.data);
                $scope.orderData = data.data.results;
                //  $.jStorage.set('user', data.data);
                //  $.jStorage.set("accessToken", data.data.accessToken[0]);
            }

        });
        $scope.saveDeliveryRequest = function (data) {

            if (data.Quantity < data.QuantityDelivered) {
                toastr.error("Quantity Delivered exceeds the total Quantity.");
            } else {
                if (data.product.quantity < data.QuantityDelivered) {
                    toastr.error("Inventory for this product is low.");
                } else {
                    NavigationService.apiCall("DeliveryRequest/saveDeliveryRequest", data, function (data) {
                        if (data.value === true) {
                            console.log("Order---data saved ", data.data);
                            $state.go("page", {
                                id: "viewOrderRequest"
                            });
                        }
                    });
                }
            }
        };
        if (!_.isEmpty($stateParams.keyword)) {
            $scope.data = {};
            var formData = {};
            formData._id = JSON.parse($stateParams.keyword)._id;
            NavigationService.apiCall("DeliveryRequest/getOne", formData, function (data) {
                if (data.value === true) {
                    console.log("login", data.data);
                    $scope.data = data.data;
                }
            });
            //  $.jStorage.set('user', data.data);
            //  $.jStorage.set("accessToken", data.data.accessToken[0]);
        };
        $scope.modalAddNotes = function (data) {
            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: '/backend/views/modal/deliverynotes.html',
                size: 'lg',
                scope: $scope
            });
        };
        $scope.addNotes = function (notes) {
            var noteWithTime = {};
            noteWithTime.note = notes.note;
            noteWithTime.notestime = new Date();
            console.log($scope.data.notes);
            // noteWithTime._id=JSON.parse($stateParams.keyword)._id;
            $scope.data.notes.push(noteWithTime);

        };
        $scope.addProduct = function (data) {
            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: '/backend/views/modal/addProduct.html',
                size: 'lg',
                scope: $scope
            });
        };
        $scope.compareQuantity = function (data) {
            console.log("data1,data2", data.Quantity, data.QuantityDelivered);
            if (data.Quantity < data.QuantityDelivered) {
                toastr.error("Quantity Delivered exceeds the total Quantity.");
            }
            if (data.QuantityDelivered == 0) {
                $scope.modalAddNotes();
            }
        };

    })
    .controller('EditProductCtrl', function ($scope, TemplateService,
        NavigationService, JsonService, $timeout, $state, $stateParams,
        $uibModal, toastr) {
        $scope.template = TemplateService.changecontent("editProduct");
        $scope.menutitle = NavigationService.makeactive("editProduct");
        TemplateService.title = $scope.menutitle;
        $scope.navigation = NavigationService.getnav();
        console.log("$stateParams---", JSON.stringify($stateParams.keyword));
        $scope.data = {};
        $scope.productData = {};
        $scope.productData.commission = [];
        $scope.productData.priceList = [];
        $scope.levels = {};

        NavigationService.apiCall("categories/search",
            formData,
            function (data) {
                if (data.value === true) {
                    console.log("getOrderByUser", data.data);
                    $scope.cat = data.data.results;
                    _.forEach($scope.OrderData, function (val) {
                        _.forEach(val.product, function (val1) {
                            if (_.isEqual(val1.product.subscription, 'yes')) {
                                $scope.subscription = val;
                            }
                        })
                    })
                    console.log("$scope.subscription",
                        $scope.subscription);
                    //  $.jStorage.set('user', data.data);
                    //  $.jStorage.set("accessToken",
                }
            });
        if (_.isEmpty($stateParams.keyword)) {
            NavigationService.apiCall("PartnerLevel/search", {},
                function (data) {
                    if (data.value === true) {
                        var found = 'found';
                        console.log(data.data.results);
                        $scope.levels = data.data.results;
                        var i = 0;
                        console.log("$scope.productData.commission", $scope.productData.commission)
                        _.forEach($scope.levels, function (val) {
                            var comm = {};
                            comm.commissionType = val;
                            console.log("commissionType", comm.commissionType);
                            $scope.productData.commission.push(comm);
                        })
                        console.log("$scope.productData.commission---->>", $scope.productData.commission)
                    }

                });
        }
        if (!_.isEmpty($stateParams.keyword)) {
            $scope.data = {};
            var formData = {};
            formData._id = JSON.parse($stateParams.keyword)._id;
            NavigationService.apiCall("Product/getOne", formData, function (data) {
                if (data.value === true) {
                    console.log("login", data.data);
                    $scope.productData = data.data;

                    NavigationService.apiCall("PartnerLevel/search", {},
                        function (data) {
                            if (data.value === true) {
                                var found = 'found';
                                console.log(data.data.results);
                                $scope.levels = data.data.results;
                                var i = 0;
                                console.log("$scope.productData.commission", $scope.productData.commission)
                                _.forEach($scope.levels, function (val) {
                                    if ($scope.productData.commission[0]) {
                                        found = _.find($scope.productData.commission, function (o) {
                                            console.log(o.commissionType);
                                            if (o.commissionType != null) {
                                                return o.commissionType._id == val._id;
                                            }
                                        });
                                        console.log("found", found);
                                        if (found == undefined) {
                                            var comm = {};
                                            comm.commissionType = val;
                                            console.log("commissionType", comm.commissionType);
                                            $scope.productData.commission.push(comm);
                                        }
                                    } else {
                                        var comm = {};
                                        comm.commissionType = val;
                                        console.log("commissionType", comm.commissionType);
                                        $scope.productData.commission.push(comm);
                                    }
                                })
                                console.log("$scope.productData.commission---->>", $scope.productData.commission)
                            }

                        });
                    NavigationService.apiCall("categories/search",
                        formData,
                        function (data) {
                            if (data.value === true) {
                                console.log("getOrderByUser", data.data);
                                $scope.cat = data.data.results;
                                _.forEach($scope.OrderData, function (val) {
                                    _.forEach(val.product, function (val1) {
                                        if (_.isEqual(val1.product.subscription, 'yes')) {
                                            $scope.subscription = val;
                                        }

                                    })
                                })
                                console.log("$scope.subscription",
                                    $scope.subscription);
                                //  $.jStorage.set('user', data.data);
                                //  $.jStorage.set("accessToken",
                            }

                        });
                    //  $.jStorage.set('user', data.data);
                    //  $.jStorage.set("accessToken", data.data.accessToken[0]);
                }
            });
        }
        $scope.addPrice = function (notes) {
            $scope.productData.priceList.push(notes);
        };
        $scope.deletePrice = function (index) {
            $scope.productData.priceList.splice(index, 1);
        };
        $scope.saveProduct = function (formdata) {
            console.log("productData--", formdata);
            // noteWithTime._id=JSON.parse($stateParams.keyword)._id;
            if (!formdata.category) {
                toastr.error("Please select a perticular category.");
            } else {
                NavigationService.apiCall("Product/saveProduct",
                    formdata,
                    function (data) {
                        console.log("saveProduct", data.data);
                    });
                $state.go("page", {
                    id: "viewProduct"
                });
            }

        };

        $scope.modalAddNotes = function (data) {
            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: '/backend/views/modal/addPrice.html',
                size: 'lg',
                scope: $scope
            });
        };
        $scope.deleteAnswer = function (indexItem) {
            $scope.notes.notes.splice(indexItem, 1);
        };

    })
    .controller('DetailFieldCtrl', function ($scope, TemplateService, NavigationService, JsonService, $timeout, $state, $stateParams, $uibModal, toastr) {
        if (!$scope.type.type) {
            $scope.type.type = "text";
        }
        $scope.json = JsonService;
        $scope.tags = {};
        $scope.model = $scope.formData[$scope.type.tableRef];
        $scope.tagNgModel = {};
        // $scope.boxModel
        if ($scope.type.validation) {
            var isRequired = _.findIndex($scope.type.validation, function (n) {
                return n == "required";
            });
            if (isRequired >= 0) {
                $scope.type.required = true;
            }
        }
        $scope.form = {};
        if ($scope.value && $scope.value[$scope.type.tableRef]) {
            $scope.form.model = $scope.value[$scope.type.tableRef];
        }

        $scope.template = "views/field/" + $scope.type.type + ".html";

        // Multiple checkbox selection
        if ($scope.type.type == "multipleCheckbox") {
            if ($scope.type.url !== "") {
                NavigationService.searchCall($scope.type.url, {
                    keyword: ""
                }, 1, function (data1) {
                    $scope.items[$scope.type.tableRef] = data1.data.results;
                    if ($scope.json.keyword._id) {
                        console.log("Edit multiCheckbox formData: ", $scope.formData[$scope.type.tableRef]);
                        for (var idx = 0; idx < $scope.items[$scope.type.tableRef].length; idx++) {
                            for (var formIdx = 0; formIdx < $scope.formData[$scope.type.tableRef].length; formIdx++) {
                                if ($scope.items[$scope.type.tableRef][idx]._id == $scope.formData[$scope.type.tableRef][formIdx]._id) {
                                    $scope.items[$scope.type.tableRef][idx].checked = true;
                                }
                            }
                        }
                    }
                });
            } else {
                $scope.items[$scope.type.tableRef] = $scope.type.dropDown;
            }
        }

        // Set multiple checkbox field
        $scope.setSelectedItem = function (item) {
            if (typeof $scope.formData[$scope.type.tableRef] === 'undefined')
                $scope.formData[$scope.type.tableRef] = [];
            var index = _.findIndex($scope.formData[$scope.type.tableRef], function (doc) {
                return doc._id == item._id;
            });
            if (index < 0) {
                $scope.formData[$scope.type.tableRef].push({
                    _id: item._id
                });
            } else {
                $scope.formData[$scope.type.tableRef].splice(index, 1);
            }
        }

        function getJsonFromUrl(string) {
            var obj = _.split(string, '?');
            var returnval = {};
            if (obj.length >= 2) {
                obj = _.split(obj[1], '&');
                _.each(obj, function (n) {
                    var newn = _.split(n, "=");
                    returnval[newn[0]] = newn[1];
                    return;
                });
                return returnval;
            }

        }
        // BOX
        if ($scope.type.type == "date") {
            $scope.formData[$scope.type.tableRef] = moment($scope.formData[$scope.type.tableRef]).toDate();
        }
        if ($scope.type.type == "password") {
            $scope.formData[$scope.type.tableRef] = "";
        }
        if ($scope.type.type == "youtube") {
            $scope.youtube = {};


            $scope.changeYoutubeUrl = function (string) {
                if (string) {
                    $scope.formData[$scope.type.tableRef] = "";
                    var result = getJsonFromUrl(string);
                    console.log(result);
                    if (result && result.v) {
                        $scope.formData[$scope.type.tableRef] = result.v;
                    }
                }

            };
        }
        if ($scope.type.type == "box") {

            if (_.isEmpty($scope.formData[$scope.type.tableRef])) {
                $scope.formData[$scope.type.tableRef] = [];
                $scope.model = $scope.formData[$scope.type.tableRef];


            } else {
                if ($scope.formData[$scope.type.tableRef]) {
                    $scope.model = $scope.formData[$scope.type.tableRef];
                }
            }
            $scope.search = {
                text: ""
            };
        }
        $scope.state = "";
        $scope.createBox = function (state) {
            $scope.state = state;
            $scope.model.push({});
            $scope.editBox("Create", $scope.model[$scope.model.length - 1]);
        };
        $scope.editBox = function (state, data) {
            $scope.state = state;
            $scope.data = data;
            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: '/backend/views/modal/modal.html',
                size: 'lg',
                scope: $scope
            });
            $scope.close = function (value) {
                callback(value);
                modalInstance.close("cancel");
            };
        };
        $scope.deleteBox = function (index, data) {
            console.log(data);
            data.splice(index, 1);
        };

        //  TAGS STATIC AND FROM TABLE
        $scope.refreshTags = function (search) {
            if ($scope.type.url !== "") {
                NavigationService.searchCall($scope.type.url, {
                    keyword: search
                }, 1, function (data1) {
                    $scope.tags[$scope.type.tableRef] = data1.data.results;
                });
            } else {
                $scope.tags[$scope.type.tableRef] = $scope.type.dropDown;
            }
        };
        if ($scope.type.type == "tags") {
            $scope.refreshTags();
        }

        $scope.tagClicked = function (select, index) {
            if ($scope.type.fieldType === "array") {
                $scope.formData[$scope.type.tableRef] = [];
                _.each(select, function (n) {
                    $scope.formData[$scope.type.tableRef].push(n._id);
                });
            } else {
                $scope.formData[$scope.type.tableRef] = select;
            }
        };
    })

    .controller('LoginCtrl', function ($scope, TemplateService, NavigationService, $timeout, $stateParams, $state, toastr) {
        //Used to name the .html file
        $scope.menutitle = NavigationService.makeactive("Login");
        TemplateService.title = $scope.menutitle;
        $scope.template = TemplateService;
        $scope.currentHost = window.location.origin;
        if ($stateParams.id) {
            if ($stateParams.id === "AccessNotAvailable") {
                toastr.error("You do not have access for the Backend.");
            } else {
                NavigationService.parseAccessToken($stateParams.id, function () {
                    NavigationService.profile(function () {
                        $state.go("dashboard");
                    }, function () {
                        $state.go("login");
                    });
                });
            }
        } else {
            NavigationService.removeAccessToken();
        }

    })

    .controller('CountryCtrl', function ($scope, TemplateService, NavigationService, $timeout, $state, $stateParams, toastr) {
        //Used to name the .html file
        $scope.template = TemplateService.changecontent("country-list");
        $scope.menutitle = NavigationService.makeactive("Country List");
        TemplateService.title = $scope.menutitle;
        $scope.navigation = NavigationService.getnav();
        $scope.currentPage = $stateParams.page;
        var i = 0;
        $scope.search = {
            keyword: ""
        };
        if ($stateParams.keyword) {
            $scope.search.keyword = $stateParams.keyword;
        }
        $scope.showAllCountries = function (keywordChange) {
            $scope.totalItems = undefined;
            if (keywordChange) {
                $scope.currentPage = 1;
            }
            NavigationService.searchCountry({
                page: $scope.currentPage,
                keyword: $scope.search.keyword
            }, ++i, function (data, ini) {
                if (ini == i) {
                    $scope.countries = data.data.results;
                    $scope.totalItems = data.data.total;
                    $scope.maxRow = data.data.options.count;
                }
            });
        };

        $scope.changePage = function (page) {
            var goTo = "country-list";
            if ($scope.search.keyword) {
                goTo = "country-list";
            }
            $state.go(goTo, {
                page: page,
                keyword: $scope.search.keyword
            });
        };
        $scope.showAllCountries();
        $scope.deleteCountry = function (id) {
            globalfunction.confDel(function (value) {
                console.log(value);
                if (value) {
                    NavigationService.deleteCountry(id, function (data) {
                        if (data.value) {
                            $scope.showAllCountries();
                            toastr.success("Country deleted successfully.", "Country deleted");
                        } else {
                            toastr.error("There was an error while deleting country", "Country deleting error");
                        }
                    });
                }
            });
        };
    })

    .controller('CreateCountryCtrl', function ($scope, TemplateService, NavigationService, $timeout, $state, toastr) {
        //Used to name the .html file

        $scope.template = TemplateService.changecontent("country-detail");
        $scope.menutitle = NavigationService.makeactive("Country");
        TemplateService.title = $scope.menutitle;
        $scope.navigation = NavigationService.getnav();

        $scope.header = {
            "name": "Create Country"
        };
        $scope.formData = {};
        $scope.saveCountry = function (formData) {
            console.log($scope.formData);
            NavigationService.countrySave($scope.formData, function (data) {
                if (data.value === true) {
                    $state.go('country-list');
                    toastr.success("Country " + formData.name + " created successfully.", "Country Created");
                } else {
                    toastr.error("Country creation failed.", "Country creation error");
                }
            });
        };

    })

    .controller('CreateAssignmentCtrl', function ($scope, TemplateService, NavigationService, $timeout, $state, toastr, $stateParams, $uibModal) {
        //Used to name the .html file

        $scope.template = TemplateService.changecontent("assignment-detail");
        $scope.menutitle = NavigationService.makeactive("Assignment");
        TemplateService.title = $scope.menutitle;
        $scope.navigation = NavigationService.getnav();

        $scope.header = {
            "name": "Create Assignment"
        };
        $scope.formData = {};
        $scope.formData.status = true;
        $scope.formData.invoice = [];
        $scope.formData.products = [];
        $scope.formData.LRs = [];
        $scope.formData.vehicleNumber = [];
        $scope.formData.others = [];
        $scope.formData.shareWith = [];
        $scope.modalData = {};
        $scope.modalIndex = "";
        $scope.wholeObj = [];
        $scope.addModels = function (dataArray, data) {
            dataArray.push(data);
        };

        // NavigationService.searchNatureLoss(function(data) {
        //     $scope.natureLoss = data.data.results;
        // });

        $scope.refreshShareWith = function (data, office) {
            var formdata = {};
            formdata.search = data;
            formdata.filter = {
                "postedAt": office
            };
            NavigationService.searchEmployee(formdata, 1, function (data) {
                $scope.shareWith = data.data.results;
            });
        };
        $scope.refreshNature = function (data, causeloss) {
            var formdata = {};
            formdata.search = data;
            formdata.filter = {
                "_id": causeloss
            };
            NavigationService.getNatureLoss(formdata, 1, function (data) {
                $scope.natureLoss = data.data.results;
            });
        };

        $scope.addModal = function (filename, index, holdobj, data, current, wholeObj) {
            if (index !== "") {
                $scope.modalData = data;
                $scope.modalIndex = index;
            } else {
                $scope.modalData = {};
                $scope.modalIndex = "";
            }
            $scope.wholeObj = wholeObj;
            $scope.current = current;
            $scope.holdObject = holdobj;
            var modalInstance = $uibModal.open({
                scope: $scope,
                templateUrl: 'backend/views/modal/' + filename + '.html',
                size: 'lg'
            });
        };

        $scope.addElements = function (moddata) {
            if ($scope.modalIndex !== "") {
                $scope.wholeObj[$scope.modalIndex] = moddata;
            } else {
                $scope.newjson = moddata;
                var a = moddata;
                switch ($scope.holdObject) {
                    case "invoice":
                        {
                            var newmod = a.invoiceNumber.split(',');
                            _.each(newmod, function (n) {
                                $scope.newjson.invoiceNumber = n;
                                $scope.wholeObj.push($scope.newjson);
                            });
                        }
                        break;
                    case "products":
                        {
                            var newmod1 = a.item.split(',');
                            _.each(newmod1, function (n) {
                                $scope.newjson.item = n;
                                $scope.wholeObj.push($scope.newjson);
                            });
                        }
                        break;
                    case "LRs":
                        var newmod2 = a.lrNumber.split(',');
                        _.each(newmod2, function (n) {
                            $scope.newjson.lrNumber = n;
                            $scope.wholeObj.push($scope.newjson);
                        });
                        break;
                    case "Vehicle":
                        var newmod3 = a.vehicleNumber.split(',');
                        _.each(newmod3, function (n) {
                            $scope.newjson.vehicleNumber = n;
                            $scope.wholeObj.push($scope.newjson);
                        });
                        break;

                    default:
                        {
                            $scope.wholeObj.push($scope.newjson);
                        }

                }

            }
        };

        $scope.deleteElements = function (index, data) {
            data.splice(index, 1);
        };


        $scope.submit = function (formData) {
            console.log($scope.formData);
            NavigationService.assignmentSave($scope.formData, function (data) {
                if (data.value === true) {
                    $state.go('assignment-list');
                    toastr.success("Assignment " + formData.name + " created successfully.", "Assignment Created");
                } else {
                    toastr.error("Assignment creation failed.", "Assignment creation error");
                }
            });
        };

    })

    .controller('EditAssignmentCtrl', function ($scope, TemplateService, NavigationService, $timeout, $state, toastr, $stateParams, $uibModal) {
        //Used to name the .html file

        $scope.template = TemplateService.changecontent("assignment-detail");
        $scope.menutitle = NavigationService.makeactive("Assignment");
        TemplateService.title = $scope.menutitle;
        $scope.navigation = NavigationService.getnav();

        $scope.header = {
            "name": "Edit Assignment"
        };
        $scope.formData = {};
        $scope.formData.status = true;
        $scope.formData.invoice = [];
        $scope.formData.products = [];
        $scope.formData.LRs = [];
        $scope.formData.vehicleNumber = [];
        $scope.formData.others = [];
        $scope.formData.shareWith = [];
        $scope.modalData = {};
        $scope.modalIndex = "";
        $scope.wholeObj = [];
        $scope.addModels = function (dataArray, data) {
            dataArray.push(data);
        };

        NavigationService.getOneModel("Assignment", $stateParams.id, function (data) {
            $scope.formData = data.data;
            $scope.formData.dateOfIntimation = new Date(data.data.dateOfIntimation);
            $scope.formData.dateOfAppointment = new Date(data.data.dateOfAppointment);
            $scope.formData.country = data.data.city.district.state.zone.country._id;
            $scope.formData.zone = data.data.city.district.state.zone._id;
            $scope.formData.state = data.data.city.district.state._id;
            $scope.formData.district = data.data.city.district._id;
            $scope.formData.city = data.data.city._id;
            $scope.formData.insuredOfficer = data.data.insuredOfficer._id;
            console.log($scope.formData.policyDoc);
            console.log($scope.formData);
        });


        $scope.refreshShareWith = function (data, office) {
            var formdata = {};
            formdata.search = data;
            formdata.filter = {
                "postedAt": office
            };
            NavigationService.searchEmployee(formdata, 1, function (data) {
                $scope.shareWith = data.data.results;
            });
        };
        $scope.refreshNature = function (data, causeloss) {
            var formdata = {};
            formdata.search = data;
            formdata.filter = {
                "_id": causeloss
            };
            NavigationService.getNatureLoss(formdata, 1, function (data) {
                $scope.natureLoss = data.data.results;
            });
        };

        $scope.addModal = function (filename, index, holdobj, data, current, wholeObj) {
            if (index !== "") {
                $scope.modalData = data;
                $scope.modalIndex = index;
            } else {
                $scope.modalData = {};
                $scope.modalIndex = "";
            }
            $scope.wholeObj = wholeObj;
            $scope.current = current;
            $scope.holdObject = holdobj;
            var modalInstance = $uibModal.open({
                scope: $scope,
                templateUrl: 'backend/views/modal/' + filename + '.html',
                size: 'lg'
            });
        };

        $scope.addElements = function (moddata) {
            if ($scope.modalIndex !== "") {
                $scope.wholeObj[$scope.modalIndex] = moddata;
            } else {
                $scope.newjson = moddata;
                var a = moddata;
                switch ($scope.holdObject) {
                    case "invoice":
                        {
                            var newmod = a.invoiceNumber.split(',');
                            _.each(newmod, function (n) {
                                $scope.newjson.invoiceNumber = n;
                                $scope.wholeObj.push($scope.newjson);
                            });
                        }
                        break;
                    case "products":
                        {
                            var newmod1 = a.item.split(',');
                            _.each(newmod1, function (n) {
                                $scope.newjson.item = n;
                                $scope.wholeObj.push($scope.newjson);
                            });
                        }
                        break;
                    case "LRs":
                        var newmod2 = a.lrNumber.split(',');
                        _.each(newmod2, function (n) {
                            $scope.newjson.lrNumber = n;
                            $scope.wholeObj.push($scope.newjson);
                        });
                        break;
                    case "Vehicle":
                        var newmod3 = a.vehicleNumber.split(',');
                        _.each(newmod3, function (n) {
                            $scope.newjson.vehicleNumber = n;
                            $scope.wholeObj.push($scope.newjson);
                        });
                        break;

                    default:
                        {
                            $scope.wholeObj.push($scope.newjson);
                        }

                }

            }
        };

        $scope.deleteElements = function (index, data) {
            data.splice(index, 1);
        };


        $scope.submit = function (formData) {
            console.log($scope.formData);
            NavigationService.assignmentSave($scope.formData, function (data) {
                if (data.value === true) {
                    $state.go('assignment-list');
                    toastr.success("Assignment " + formData.name + " created successfully.", "Assignment Created");
                } else {
                    toastr.error("Assignment creation failed.", "Assignment creation error");
                }
            });
        };

    })

    .controller('EditCountryCtrl', function ($scope, TemplateService, NavigationService, $timeout, $stateParams, $state, toastr) {
        //Used to name the .html file

        $scope.template = TemplateService.changecontent("country-detail");
        $scope.menutitle = NavigationService.makeactive("Country");
        TemplateService.title = $scope.menutitle;
        $scope.navigation = NavigationService.getnav();

        $scope.header = {
            "name": "Edit Country"
        };

        NavigationService.getOneCountry($stateParams.id, function (data) {
            $scope.formData = data.data;
            console.log('$scope.oneCountry', $scope.oneCountry);

        });

        $scope.saveCountry = function (formValid) {
            NavigationService.countryEditSave($scope.formData, function (data) {
                if (data.value === true) {
                    $state.go('country-list');
                    console.log("Check this one");
                    toastr.success("Country " + $scope.formData.name + " edited successfully.", "Country Edited");
                } else {
                    toastr.error("Country edition failed.", "Country editing error");
                }
            });
        };

    })

    .controller('SchemaCreatorCtrl', function ($scope, TemplateService, NavigationService, $timeout, $stateParams, $state, toastr) {
        //Used to name the .html file
        $scope.template = TemplateService.changecontent("schema-creator");
        $scope.menutitle = NavigationService.makeactive("Schema Creator");
        TemplateService.title = $scope.menutitle;
        $scope.navigation = NavigationService.getnav();
        $scope.collectionTypes = ["Table View", "Table View Drag and Drop", "Grid View", "Grid View Drag and Drop"];
        $scope.schema = [{
            "schemaType": "Boolean",
            "Input1": "",
            "Input2": ""
        }, {
            "schemaType": "Color",
            "Input1": "",
            "Input2": ""
        }, {
            "schemaType": "Date",
            "Input1": "",
            "Input2": ""
        }, {
            "schemaType": "Email",
            "Input1": "",
            "Input2": ""
        }, {
            "schemaType": "File",
            "Input1": "MB Limit",
            "Input2": ""
        }, {
            "schemaType": "Image",
            "Input1": "pixel x",
            "Input2": "pixel y "
        }, {
            "schemaType": "Location",
            "Input1": "",
            "Input2": ""
        }, {
            "schemaType": "Mobile",
            "Input1": "",
            "Input2": ""
        }, {
            "schemaType": "Multiple Select",
            "Input1": "Enum",
            "Input2": ""
        }, {
            "schemaType": "Multiple Select From Table",
            "Input1": "Collection",
            "Input2": "Field"
        }, {
            "schemaType": "Number",
            "Input1": "min ",
            "Input2": "max"
        }, {
            "schemaType": "Single Select ",
            "Input1": "Enum",
            "Input2": ""
        }, {
            "schemaType": "Single Select From Table",
            "Input1": "Collection",
            "Input2": "Field"
        }, {
            "schemaType": "Telephone",
            "Input1": "",
            "Input2": ""
        }, {
            "schemaType": "Text",
            "Input1": "min length",
            "Input2": "max length"
        }, {
            "schemaType": "TextArea",
            "Input1": "min length",
            "Input2": "max length"
        }, {
            "schemaType": "URL",
            "Input1": "",
            "Input2": ""
        }, {
            "schemaType": "WYSIWYG",
            "Input1": "",
            "Input2": ""
        }, {
            "schemaType": "Youtube",
            "Input1": "",
            "Input2": ""
        }];


        $scope.inputTypes = [{
            value: '',
            name: 'Select type of input'
        }, {
            value: 'Text',
            name: 'Text'
        }, {
            value: 'Date',
            name: 'Date'
        }, {
            value: 'Textarea',
            name: 'Textarea'
        }];

        $scope.formData = {};
        $scope.formData.status = true;

        $scope.formData.forms = [{
            head: '',
            items: [{}, {}]
        }];

        $scope.addHead = function () {
            $scope.formData.forms.push({
                head: $scope.formData.forms.length + 1,
                items: [{}]
            });
        };
        $scope.removeHead = function (index) {
            if ($scope.formData.forms.length > 1) {
                $scope.formData.forms.splice(index, 1);
            } else {
                $scope.formData.forms = [{
                    head: '',
                    items: [{}, {}]
                }];
            }
        };

        $scope.addItem = function (obj) {
            var index = $scope.formData.forms.indexOf(obj);
            $scope.formData.forms[index].items.push({});
        };

        $scope.removeItem = function (obj, indexItem) {
            var indexHead = $scope.formData.forms.indexOf(obj);
            if ($scope.formData.forms[indexHead].items.length > 1) {
                $scope.formData.forms[indexHead].items.splice(indexItem, 1);
            } else {
                $scope.formData.forms[indexHead].items = [{}];
            }
        };

    })

    .controller('ExcelUploadCtrl', function ($scope, TemplateService, NavigationService, $timeout, $stateParams, $state, toastr) {
        //Used to name the .html file
        $scope.template = TemplateService.changecontent("excel-upload");
        $scope.menutitle = NavigationService.makeactive("Excel Upload");
        TemplateService.title = $scope.menutitle;
        $scope.navigation = NavigationService.getnav();
        $scope.form = {
            file: null,
            model: $stateParams.model
        };

        $scope.excelUploaded = function () {
            console.log("Excel is uploaded with name " + $scope.form.file);
            NavigationService.uploadExcel($scope.form, function (data) {
                $scope.data = data.data;
            });
        };
    })

    .controller('headerctrl', function ($scope, TemplateService, $uibModal) {
        $scope.template = TemplateService;
        $scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
            $(window).scrollTop(0);
        });

    })

    .controller('languageCtrl', function ($scope, TemplateService, $translate, $rootScope) {

        $scope.changeLanguage = function () {
            console.log("Language CLicked");

            if (!$.jStorage.get("language")) {
                $translate.use("hi");
                $.jStorage.set("language", "hi");
            } else {
                if ($.jStorage.get("language") == "en") {
                    $translate.use("hi");
                    $.jStorage.set("language", "hi");
                } else {
                    $translate.use("en");
                    $.jStorage.set("language", "en");
                }
            }
            //  $rootScope.$apply();
        };
    });