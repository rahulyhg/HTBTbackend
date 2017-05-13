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

    .controller('SignUpCtrl', function ($scope, TemplateService, apiService, NavigationService, $timeout) {
        $scope.template = TemplateService.getHTML("content/signup.html");
        TemplateService.title = "Sign Up"; //This is the Title of the Website
        apiService.getDemo($scope.formData, function (data) {
            console.log(data);
        });
    })

 .controller('ReviewCtrl', function ($scope, TemplateService, apiService, NavigationService, $uibModal, $timeout) {
        $scope.template = TemplateService.getHTML("content/review.html");
        TemplateService.title = "Review"; //This is the Title of the Website
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
    })

    .controller('headerctrl', function($scope, TemplateService) {
    $scope.template = TemplateService;
    $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
        $(window).scrollTop(0);
    });
    $scope.status = {
            isCustomHeaderOpen: false,
            isFirstOpen: true,
            isFirstDisabled: false
        };
});