myApp.controller('HomeCtrl', function ($scope, TemplateService, NavigationService, $timeout) {
    $scope.template = TemplateService.getHTML("content/home.html");
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
  .controller('DemoAPICtrl', function ($scope, TemplateService, apiService, NavigationService, $timeout) {
    apiService.getDemo($scope.formData, function (data) {
      console.log(data);
    });
  })

  .controller('SignUpCtrl', function ($scope, TemplateService, $state, $stateParams, apiService, NavigationService, $timeout) {
    $scope.template = TemplateService.getHTML("content/signup.html");
    TemplateService.title = "Sign Up"; //This is the Title of the Website
    apiService.getDemo($scope.formData, function (data) {
      console.log(data);
    });
    if ($stateParams.orderId) {
      console.log("orderId", $stateParams.orderId);
      var formData = {};
      formData._id = $stateParams.orderId;
      apiService.apiCall("Order/getOne", formData, function (data) {
        if (data.value === true) {
          console.log("Order/getOne", data.data);
          $scope.orderData = data.data;
        }
      });
    };
    $scope.addShipBilDetails = function (orderData) {
      //redirect them to cart summery and payment gateway
      apiService.apiCall("Order/save", orderData, function (data) {
        if (data.value === true) {
          console.log("Order updated successfully---inside if---customer pay case");
          $state.go("review", {
            "orderId": orderData._id
          });
        }
      });
    }
  })

  .controller('ReviewCtrl', function ($scope, TemplateService, $stateParams, apiService, NavigationService, $uibModal, $timeout) {
    $scope.template = TemplateService.getHTML("content/review.html");
    TemplateService.title = "Review"; //This is the Title of the Website
    apiService.getDemo($scope.formData, function (data) {
      console.log(data);
    });
    $scope.orderData = {};
    if ($stateParams.orderId) {
      console.log("orderId", $stateParams.orderId);
      var formData = {};
      formData._id = $stateParams.orderId;
      apiService.apiCall("Order/getOne", formData, function (data) {
        if (data.value === true) {
          console.log("login", data.data);
          $scope.orderData = data.data;
          $scope.options = {
            'key': 'rzp_test_BrwXxB7w8pKsfS',
            'amount': parseInt($scope.orderData.totalAmount) * 100,
            'name': $scope.orderData.customer.name,
            'description': 'Pay for Order ' + $scope.orderData.orderID,
            'image': '',
            'handler': function (transaction) {
              $scope.transactionHandler(transaction);
            },
            'prefill': {
              'name': $scope.orderData.customer.name,
              'email': $scope.orderData.customer.email,
              'contact': $scope.orderData.customer.mobile
            },
            theme: {
              color: '#3399FF'
            }
          };
          //  $.jStorage.set('user', data.data);
          //  $.jStorage.set("accessToken", data.data.accessToken[0]);
        }
      });
    }


    $scope.pay = function () {
      $.getScript('https://checkout.razorpay.com/v1/checkout.js', function () {
        var rzp1 = new Razorpay($scope.options);
        rzp1.open();

      });
    };

    $scope.transactionHandler = function (success) {
      console.log("transaction", success);
      if (success.razorpay_payment_id) {
        $scope.orderData.razorpay_payment_id = success.razorpay_payment_id;
        apiService.apiCall("Order/payAndCapture", $scope.orderData, function (data) {
          if (data.value === true) {
            console.log("payAndCapture");
          }
        });
      }
    };
    $scope.orderConfirmation = function (orderData) {
      orderData.status = 'Confirmed';
      apiService.apiCall("Order/save", orderData, function (data) {
        if (data.value === true) {
          console.log("Order confirmed successfully--- redirect to thank you page");

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


    .controller('NonSubCtrl', function ($scope, TemplateService, apiService, NavigationService, $uibModal, $timeout) {
        $scope.template = TemplateService.getHTML("content/nonsub.html");
        TemplateService.title = "NonSub"; //This is the Title of the Website
        apiService.getDemo($scope.formData, function (data) {
            console.log(data);
        });

        $scope.terms = function(){
            $uibModal.open({
                animation:true,
                templateUrl:"views/terms.html",
                // $scope:scope
            })
            // $scope.template = TemplateService.getHTML("/terms.html");
        }
        $scope.today = function() {
    $scope.dt = new Date();
  };
  $scope.today();

  $scope.clear = function() {
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

  $scope.toggleMin = function() {
    $scope.inlineOptions.minDate = $scope.inlineOptions.minDate ? null : new Date();
    $scope.dateOptions.minDate = $scope.inlineOptions.minDate;
  };

  $scope.toggleMin();

  $scope.open1 = function() {
    $scope.popup1.opened = true;
  };

  $scope.open2 = function() {
    $scope.popup2.opened = true;
  };

  $scope.setDate = function(year, month, day) {
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
  $scope.events = [
    {
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
      var dayToCheck = new Date(date).setHours(0,0,0,0);

      for (var i = 0; i < $scope.events.length; i++) {
        var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);

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

    .controller('SorryCtrl', function ($scope, TemplateService, NavigationService, $timeout) {
        $scope.template = TemplateService.getHTML("content/Sorry.html");
        TemplateService.title = "Sorry"; //This is the Title of the Website
    })

    .controller('headerctrl', function($scope, TemplateService) {
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
   
