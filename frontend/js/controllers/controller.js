myApp.controller('HomeCtrl', function ($scope, TemplateService, NavigationService, $timeout) {
    // $scope.template = TemplateService.getHTML("content/home.html");
    TemplateService.title = "Home"; //This is the Title of the Website
    $scope.navigation = NavigationService.getNavigation();

    $scope.mySlides = [
      'http://flexslider.woothemes.com/images/kitchen_adventurer_cheesecake_brownie.jpg',
      'http://flexslider.woothemes.com/images/kitchen_adventurer_lemon.jpg',
      'http://flexslider.woothemes.com/images/kitchen_adventurer_donut.jpg',
      'http://flexslider.woothemes.com/images/kitchen_adventurer_caramel.jpg'
    ];
    var abc = _.times(100, function (n) {
      return n;
    });

    var i = 0;
    $scope.buttonClick = function () {
      i++;
      console.log("This is a button Click");
    };
  })

  .controller('FormCtrl', function ($scope, TemplateService, NavigationService, $timeout) {
    $scope.template = TemplateService.getHTML("content/form.html");
    TemplateService.title = "Form"; //This is the Title of the Website
    $scope.navigation = NavigationService.getNavigation();
    $scope.formSubmitted = false;
    $scope.submitForm = function (data) {
      console.log(data);
      $scope.formSubmitted = true;
    };
  })

  //Example API Controller
  // .controller('DemoAPICtrl', function ($scope, TemplateService, apiService, NavigationService, $timeout) {
  //   apiService.getDemo($scope.formData, function (data) {
  //     console.log(data);
  //   });
  // })

  .controller('SignUpCtrl', function ($scope, TemplateService, $state, $stateParams, apiService, NavigationService, $timeout) {
    $scope.template = TemplateService.getHTML("content/signup.html");
    TemplateService.title = "Sign Up"; //This is the Title of the Website

    if ($stateParams.orderId) {

      var formData = {};
      $scope.orderData = {};
      $scope.orderData.shippingAddress = {};
      formData._id = $stateParams.orderId;
      apiService.apiCall("Order/getOne", formData, function (data) {
        if (data.value === true) {
          $scope.orderData = data.data;
          $scope.orderData.shippingAddressName = $scope.orderData.customer.name;
          $scope.orderData.shippingAddressMobile = $scope.orderData.customer.mobile;
          $scope.orderData.shippingAddressEmail = $scope.orderData.customer.email;
          $scope.orderData.billingAddressName = $scope.orderData.customer.name;
          $scope.orderData.billingAddressMobile = $scope.orderData.customer.mobile;
          if (_.isEqual($scope.orderData.paymentStatus, 'Paid')) {
            $state.go("linkexpire");
          } else {
            var custForm = {};
            custForm._id = $scope.orderData.customer._id;
            apiService.apiCall("Order/getOrderByUser", custForm, function (data) {
              if (data.value === true) {
                $scope.PreviousOrder = data.data[1];
                $scope.orderData.shippingAddress = $scope.PreviousOrder.shippingAddress;
              }
            });
          }
          $scope.showaddr = true;
          $scope.addSameBillingDetails(true);
        }
      });
    }
    $scope.addSameBillingDetails = function (showaddr) {
      console.log($scope.orderData.billingAddress);
      if (showaddr) {
        $scope.orderData.billingAddress = _.cloneDeep($scope.orderData.shippingAddress);
      } else {
        $scope.orderData.billingAddress = {};
      }
    };
    $scope.addShipBilDetails = function (orderData) {
      //redirect them to cart summery and payment gateway
      if (!orderData.shippingAddress) {
        orderData.shippingAddress = {};
      }
      if (!orderData.billingAddress) {
        orderData.billingAddress = {};
      }
      orderData.shippingAddress.name = orderData.shippingAddressName;
      orderData.shippingAddress.mobile = orderData.shippingAddressMobile;
      orderData.shippingAddress.email = orderData.shippingAddressEmail;
      orderData.billingAddress.name = orderData.billingAddressName;
      orderData.billingAddress.mobile = orderData.billingAddressMobile;
      if ($scope.showaddr) {
        orderData.billingAddress = _.cloneDeep(orderData.shippingAddress);
      }
      if (!$scope.orderData.customer.email) {
        $scope.orderData.customer.email = orderData.shippingAddressEmail;
        apiService.apiCall("User/save", $scope.orderData.customer, function (data) {
          if (data.value === true) {
            console.log("User updated successfully---");
          }
        });
      }
      apiService.apiCall("Order/save", orderData, function (data) {
        if (data.value === true) {
          console.log("Order updated successfully---");
          $state.go("payment", {
            "orderId": orderData._id
          });
        }
      });
    }
  })

  .controller('ReviewCtrl', function ($scope, $state, TemplateService, $stateParams, apiService, NavigationService, $uibModal, $timeout) {
    $scope.template = TemplateService.getHTML("content/review.html");
    TemplateService.title = "Review"; //This is the Title of the Website
    $scope.template.isRP = $stateParams.rpId;
    $scope.amountToBePaid = 0;
    if ($stateParams.orderId) {
      console.log("orderId", $stateParams.orderId);
      var formData = {};
      formData._id = $stateParams.orderId;
      apiService.apiCall("Order/getOne", formData, function (data) {
        if (data.value === true) {
          $scope.orderData = data.data;
          var pinForm = {};
          pinForm.pin = $scope.orderData.shippingAddress.pincode;
          apiService.getPinDetail(pinForm, function (pinData) {
            if (pinData.data.value === true) {
              $scope.daysByPincode = pinData.data.data;
              console.log($scope.daysByPincode.days);
            } else {
              $state.go("pincode");
              $scope.orderData.status="Outside Delivery Zone";
              apiService.apiCall("Order/save", $scope.orderData, function (data) {
                console.log(data);
});
            }
          });
          if (_.isEqual($scope.orderData.paymentStatus, 'Paid')) {
            $state.go("linkexpire");
          }
          _.each($scope.orderData.product, function (n, key) {
            $scope.amountToBePaid += parseFloat(n.product.price) * parseInt(n.productQuantity);
          });

          if (!$scope.template.isRP) {
            $scope.nameOnPayment = $scope.orderData.customer.name
            $scope.emailOnPayment = $scope.orderData.customer.email;
            $scope.mobileOnPayment = $scope.orderData.customer.mobile;
          } else {
            var rpFormData = {};
            rpFormData._id = $scope.orderData.customer.relationshipId;
            apiService.apiCall("User/getOne", rpFormData, function (data) {
              if (data.value === true) {
                $scope.rpData = data.data;
                $scope.nameOnPayment = $scope.rpData.name;
                $scope.emailOnPayment = $scope.rpData.email;
                $scope.mobileOnPayment = $scope.rpData.mobile;
              }
            });

          }
          $scope.options = {
            'key': 'rzp_test_BrwXxB7w8pKsfS',
            'amount': parseInt($scope.orderData.totalPrice) * 100,
            'name': $scope.nameOnPayment,
            'description': 'Pay for Order ' + $scope.orderData.orderID,
            'image': '',
            'handler': function (transaction) {
              $scope.transactionHandler(transaction);
            },
            'prefill': {
              'name': $scope.nameOnPayment,
              'email': $scope.emailOnPayment,
              'contact': $scope.mobileOnPayment
            },
            theme: {
              color: '#3399FF'
            }
          };
        }
      });
    }

    $scope.pay = function () {
      console.log("inside payment");
      $.getScript('https://checkout.razorpay.com/v1/checkout.js', function () {
        var rzp1 = new Razorpay($scope.options);
        rzp1.open();

      });
    };

    $scope.transactionHandler = function (success) {
      console.log("transaction", success);
      if (success.razorpay_payment_id) {
        $state.go("thankyou");
        $scope.orderData.razorpay_payment_id = success.razorpay_payment_id;
        $scope.orderData.status = 'Confirmed';
        apiService.apiCall("Order/orderConfirmationOrPay", $scope.orderData, function (data) {
          if (data.value === true) {
<<<<<<< HEAD
            if ($stateParams.rpId == "")

              $state.go("successconfirm", {
                orderId: $stateParams.orderId
              });
=======
       if ($stateParams.rpId == "")

            $state.go("successconfirm",{orderId:$stateParams.orderId});
>>>>>>> f223b3117702f9b5685147843e0c893e367a12ea
            console.log("payAndCapture");
            //redirect to thank you page

          }
        });
      }
    };
    $scope.orderConfirmation = function (orderData) {
      orderData.status = 'Confirmed';
      console.log($scope.dt);
      apiService.apiCall("Order/orderConfirmationOrPay", orderData, function (data) {
        if (data.value === true) {
          $state.go("thankyoupage2");
          console.log("Order confirmed successfully--- redirect to thank you page");

        } else {
          $state.go("wrong");
        }
      });
    }

    $scope.terms = function () {
      $uibModal.open({
        animation: true,
        templateUrl: "views/terms.html",
        // $scope:scope
      })
      // $scope.template = TemplateService.getHTML("/terms.html");
    }
    $scope.today = function () {
      $scope.dt = new Date();
    };
    $scope.today();

    $scope.clear = function () {
      $scope.dt = null;
    };

    $scope.inlineOptions = {
      customClass: getDayClass,
      minDate: new Date(),
      showWeeks: true
    };

    $scope.dateOptions = {
      dateDisabled: disabled,
      formatYear: 'yy',
      maxDate: new Date(2020, 5, 22),
      minDate: new Date(),
      startingDay: 1
    };

    // Disable weekend selection
    function disabled(data) {
      var currentDay = _.upperCase(moment(data.date).format("dddd"));
      var retVal = true;
      _.each($scope.daysByPincode.days, function (n) {
        var capN = _.upperCase(n);
        if (capN == currentDay) {
          retVal = false;
        }
      });
      var diff = moment(data.date).diff(moment(), 'days')
      if (diff <= 0) {
        retVal = true;
      }
      return retVal;
    }

    $scope.toggleMin = function () {
      $scope.inlineOptions.minDate = $scope.inlineOptions.minDate ? null : new Date();
      $scope.dateOptions.minDate = $scope.inlineOptions.minDate;
    };

    $scope.toggleMin();

    $scope.open1 = function () {
      $scope.popup1.opened = true;
    };

    $scope.open2 = function () {
      $scope.popup2.opened = true;
    };

    $scope.setDate = function (year, month, day) {
      $scope.dt = new Date(year, month, day);
    };

    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
    $scope.format = $scope.formats[0];
    $scope.altInputFormats = ['M!/d!/yyyy'];

    $scope.popup1 = {
      opened: false
    };

    $scope.popup2 = {
      opened: false
    };

    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    var afterTomorrow = new Date();
    afterTomorrow.setDate(tomorrow.getDate() + 1);
    $scope.events = [{
        date: tomorrow,
        status: 'full'
      },
      {
        date: afterTomorrow,
        status: 'partially'
      }
    ];

    function getDayClass(data) {
      var date = data.date,
        mode = data.mode;
      if (mode === 'day') {
        var dayToCheck = new Date(date).setHours(0, 0, 0, 0);

        for (var i = 0; i < $scope.events.length; i++) {
          var currentDay = new Date($scope.events[i].date).setHours(0, 0, 0, 0);

          if (dayToCheck === currentDay) {
            return $scope.events[i].status;
          }
        }
      }

      return '';
    }
  })


  .controller('NonSubCtrl', function ($scope, TemplateService, apiService, NavigationService, $uibModal, $timeout) {
    $scope.template = TemplateService.getHTML("content/nonsub.html");
    TemplateService.title = "NonSub"; //This is the Title of the Website


    $scope.terms = function () {
      $uibModal.open({
        animation: true,
        templateUrl: "views/terms.html",
        // $scope:scope
      })
      // $scope.template = TemplateService.getHTML("/terms.html");
    }
    $scope.today = function () {
      $scope.dt = new Date();
    };
    $scope.today();

    $scope.clear = function () {
      $scope.dt = null;
    };

    $scope.inlineOptions = {
      customClass: getDayClass,
      minDate: new Date(),
      showWeeks: true
    };

    $scope.dateOptions = {
      dateDisabled: disabled,
      formatYear: 'yy',
      maxDate: new Date(2020, 5, 22),
      minDate: new Date(),
      startingDay: 1
    };

    // Disable weekend selection
    function disabled(data) {
      var date = data.date,
        mode = data.mode;
      return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
    }

    $scope.toggleMin = function () {
      $scope.inlineOptions.minDate = $scope.inlineOptions.minDate ? null : new Date();
      $scope.dateOptions.minDate = $scope.inlineOptions.minDate;
    };

    $scope.toggleMin();

    $scope.open1 = function () {
      $scope.popup1.opened = true;
    };

    $scope.open2 = function () {
      $scope.popup2.opened = true;
    };

    $scope.setDate = function (year, month, day) {
      $scope.dt = new Date(year, month, day);
    };

    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
    $scope.format = $scope.formats[0];
    $scope.altInputFormats = ['M!/d!/yyyy'];

    $scope.popup1 = {
      opened: false
    };

    $scope.popup2 = {
      opened: false
    };

    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    var afterTomorrow = new Date();
    afterTomorrow.setDate(tomorrow.getDate() + 1);
    $scope.events = [{
        date: tomorrow,
        status: 'full'
      },
      {
        date: afterTomorrow,
        status: 'partially'
      }
    ];

    function getDayClass(data) {
      var date = data.date,
        mode = data.mode;
      if (mode === 'day') {
        var dayToCheck = new Date(date).setHours(0, 0, 0, 0);

        for (var i = 0; i < $scope.events.length; i++) {
          var currentDay = new Date($scope.events[i].date).setHours(0, 0, 0, 0);

          if (dayToCheck === currentDay) {
            return $scope.events[i].status;
          }
        }
      }

      return '';
    }
  })



  .controller('ThankYouCtrl', function ($scope, TemplateService, NavigationService, $timeout) {
    $scope.template = TemplateService.getHTML("content/thankyou.html");
    TemplateService.title = "thankyou"; //This is the Title of the Website
  })

  .controller('PaymentSuccessCtrl', function ($scope, TemplateService, NavigationService, $timeout) {
    $scope.template = TemplateService.getHTML("content/paymentsuccess.html");
    TemplateService.title = "paymentsuccess"; //This is the Title of the Website
  })

  .controller('LinkExpireCtrl', function ($scope, TemplateService, NavigationService, $timeout) {
    $scope.template = TemplateService.getHTML("content/linkexpire.html");
    TemplateService.title = "linkexpire"; //This is the Title of the Website
  })

  .controller('SorryCtrl', function ($scope, TemplateService, NavigationService, $timeout) {
    $scope.template = TemplateService.getHTML("content/sorry.html");
    TemplateService.title = "Sorry"; //This is the Title of the Website
  })

  .controller('PincodeCtrl', function ($scope, TemplateService, NavigationService, $timeout) {
    $scope.template = TemplateService.getHTML("content/pincode.html");
    TemplateService.title = "pincode"; //This is the Title of the Website

  })


  .controller('SuccessConfirmCtrl', function ($scope, TemplateService, NavigationService, $timeout) {
    $scope.template = TemplateService.getHTML("content/successconfirm.html");
    TemplateService.title = "successconfirm"; //This is the Title of the Website
  })

  .controller('WrongCtrl', function ($scope, TemplateService, NavigationService, $timeout) {
    $scope.template = TemplateService.getHTML("content/wrong.html");
    TemplateService.title = "wrong"; //This is the Title of the Website
  })

  .controller('ThankYouPage2Ctrl', function ($scope, TemplateService, NavigationService, $timeout) {
    $scope.template = TemplateService.getHTML("content/thankyoupage2.html");
    TemplateService.title = "thankyoupage2"; //This is the Title of the Website
  })

  .controller('SuccessCtrl', function ($scope, TemplateService, NavigationService, $timeout) {
    $scope.template = TemplateService.getHTML("content/success.html");
    TemplateService.title = "success"; //This is the Title of the Website
  })


  .controller('ThankYouConfirmCtrl', function ($scope, TemplateService, NavigationService, $timeout) {
    $scope.template = TemplateService.getHTML("content/thankyouconfirm.html");
    TemplateService.title = "thankyouconfirm"; //This is the Title of the Website
  })

  .controller('headerctrl', function ($scope, TemplateService) {

    $scope.template = TemplateService;
    $scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
      $(window).scrollTop(0);
    });
    $scope.status = {
      isCustomHeaderOpen: false,
      isFirstOpen: true,
      isFirstDisabled: false
    };

  });
