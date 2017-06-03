// Link all the JS Docs here
var myApp = angular.module('myApp', [
    'ui.router',
    'pascalprecht.translate',
    'angulartics',
    'angulartics.google.analytics',
    'ui.bootstrap',
    'angular-flexslider',
    'ui.swiper'
]);

// Define all the routes below
myApp.config(function ($stateProvider, $urlRouterProvider, $httpProvider, $locationProvider) {
    var tempateURL = "views/template/template.html"; //Default Template URL

    // for http request with session
    $httpProvider.defaults.withCredentials = true;
    $stateProvider
        .state('home', {
            url: "/",
            templateUrl: "",
            controller: 'HomeCtrl'
        })
        .state('form', {
            url: "/form",
            templateUrl: tempateURL,
            controller: 'FormCtrl'
        })

        .state('orderconfirmation', {
            url: "/orderconfirmation/:orderId",
            templateUrl: tempateURL,
            controller: 'SignUpCtrl'
        })

        .state('payment', {
            url: "/payment/:orderId",
            templateUrl: tempateURL,
            controller: 'ReviewCtrl'
        })

         .state('paymentRP', {
            url: "/payment/:orderId/:rpId",
            templateUrl: tempateURL,
            controller: 'ReviewCtrl'
        })

        .state('nonsub', {
            url: "/nonsub/:orderId",
            templateUrl: tempateURL,
            controller: 'NonSubCtrl'
        })


        .state('thankyou', {
            url: "/thankyou",
            templateUrl: tempateURL,
            controller: 'ThankYouCtrl'
        })

        .state('linkexpire', {
            url: "/linkexpire",
            templateUrl: tempateURL,
            controller: 'LinkExpireCtrl'
        })

        .state('sorry', {
            url: "/sorry",
            templateUrl: tempateURL,
            controller: 'SorryCtrl'
        });

    $urlRouterProvider.otherwise("/orderconfirmation/");

    $locationProvider.html5Mode(isproduction);
})





// For Language JS
myApp.config(function ($translateProvider) {
    $translateProvider.translations('en', LanguageEnglish);
    $translateProvider.translations('hi', LanguageHindi);
    $translateProvider.preferredLanguage('en');
});
