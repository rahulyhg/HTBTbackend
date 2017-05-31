// Link all the JS Docs here
var myApp = angular.module('myApp', [
    'ui.router',
    'pascalprecht.translate',
    'angulartics',
    'angulartics.google.analytics',
    'ui.bootstrap',
    'ngAnimate',
    'ngSanitize',
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

        .state('signup', {
            url: "/signup/:orderId",
            templateUrl: tempateURL,
            controller: 'SignUpCtrl'
        })

        .state('review', {
            url: "/review/:orderId",
            templateUrl: tempateURL,
            controller: 'ReviewCtrl'
        })

        .state('nonsub', {
            url: "/nonsub",
            templateUrl: tempateURL,
            controller: 'NonSubCtrl'
        });




    $urlRouterProvider.otherwise("/signup");
    $locationProvider.html5Mode(isproduction);
})





// For Language JS
myApp.config(function ($translateProvider) {
    $translateProvider.translations('en', LanguageEnglish);
    $translateProvider.translations('hi', LanguageHindi);
    $translateProvider.preferredLanguage('en');
});