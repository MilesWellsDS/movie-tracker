'use strict';

/**********************************************************************
 * Angular Application
 **********************************************************************/
let app = angular.module('MovieTracker', ['ngResource', 'ngRoute', 'ngMessages', 'toastr', 'angularSpinner'])
    .factory('InterceptorService',['$rootScope', '$q', '$location', function($rootScope, $q){
        let InterceptorServiceFactory = {};

        const _request = function(config){
            //success logic here
            return config;
        };

        const _responseError = function(rejection) {
            //error here. for example server respond with 401
            if(rejection.status == 401) {
                $rootScope.logout();
            }
            return $q.reject(rejection);
        };

        InterceptorServiceFactory.request = _request;
        InterceptorServiceFactory.responseError = _responseError;
        return InterceptorServiceFactory;

    }])
    .config(($routeProvider, $locationProvider, $httpProvider, $windowProvider) => {
        $locationProvider.hashPrefix('');

        $httpProvider.interceptors.push('InterceptorService');

        //================================================
        // Check if the user is connected
        //================================================
        let checkLoggedin = function($q, $timeout, $http, $location, $rootScope){
            // Initialize a new promise
            let deferred = $q.defer();

            // Make an AJAX call to check if the user is logged in
            $http.get('/loggedin').then(user => {
                // Authenticated
                if (user !== '0')
                /*$timeout(deferred.resolve, 0);*/
                    deferred.resolve();

                // Not Authenticated
                else {
                    $rootScope.message = 'You need to log in.';
                    //$timeout(function(){deferred.reject();}, 0);
                    deferred.reject();
                    $location.url('/login');
                }
            });

            return deferred.promise;
        };
        //================================================

        //================================================
        // Check if the user is an admin
        //================================================
        let checkAdminStatus = function($q, $timeout, $http, $location){
            // Initialize a new promise
            let deferred = $q.defer();

            // Make an AJAX call to check if the user is logged in
            $http.get('/isadmin').then(user => {
                // Authenticated
                if (user !== '0')
                /*$timeout(deferred.resolve, 0);*/
                    deferred.resolve();

                // Not Authenticated
                else {
                    //$timeout(function(){deferred.reject();}, 0);
                    deferred.reject();
                    $location.url('/');
                }
            });

            return deferred.promise;
        };
        //================================================

        //================================================
        // Add an interceptor for AJAX errors
        //================================================
        $httpProvider.interceptors.push(($q, $location) => {
            return {
                response: function(response) {
                    // do something on success
                    return response;
                },
                responseError: function(response) {
                    if (response.status === 401)
                        $location.url('#/login');
                    return $q.reject(response);
                }
            };
        });
        //================================================

        //================================================
        // Define all the routes
        //================================================
        let isMobile = $windowProvider.$get().innerWidth <= 1024;
        $routeProvider
            .when('/', {
                templateUrl: '/components/home/homeView.html'
            })
            .when('/profile', {
                templateUrl: '/components/profile/profileView.html',
                controller: 'ProfileCtrl',
                resolve: {
                    loggedin: checkLoggedin
                }
            })
            .when('/movies', {
                templateUrl: isMobile ? '/components/myMovies/myMoviesView.mobile.html' : '/components/myMovies/myMoviesView.html',
                controller: 'MyMoviesCtrl',
                resolve: {
                    loggedin: checkLoggedin
                }
            })
            .when('/admin', {
                templateUrl: '/components/adminPanel/adminPanelView.html',
                controller: 'AdminPanelCtrl',
                resolve: {
                    loggedin: checkAdminStatus
                }
            })
            .when('/login', {
                templateUrl: isMobile ? '/components/login/loginView.mobile.html' : '/components/login/loginView.html',
                controller: 'LoginCtrl'
            })
            .when('/register', {
                templateUrl: isMobile ? '/components/register/registerView.mobile.html' : '/components/register/registerView.html',
                controller: 'RegisterCtrl'
            })
            .when('/search', {
                templateUrl: isMobile ? '/components/search/searchView.mobile.html' : '/components/search/searchView.html',
                controller: 'SearchCtrl',
                resolve: {
                    loggedin: checkLoggedin
                }
            })
            .otherwise({
                redirectTo: '/'
            });
        //================================================

    }) // end of config()
    .run(($rootScope, $http, $location) => {
        $rootScope.message = '';

        // Logout function is available in any pages
        $rootScope.logout = function(){
            $rootScope.message = 'Logged out.';
            $rootScope.setUser(null);
            $http.post('/logout')
                .then(() => {
                    $location.url('/login');
                });
        };
    })
    .run(["$rootScope", "UserService",
        ($rootScope, UserService) => {
            $rootScope.getUser = UserService.getUser;
            $rootScope.setUser = UserService.setUser;
        }
    ])
    .run(["$rootScope", "CommonService",
        ($rootScope, CommonService) => {
            $rootScope.allFalse = CommonService.allFalse;
        }
    ])
    .filter('range', function() {
        return function(input, from, to) {
            const min = parseInt(from);
            const max = parseInt(to);
            for (let i = min; i <= max; i++)
                input.push(i);
            return input;
        };
    })
    .filter('filterSubstr', function() {
        return function (strings, substr) {
            return strings.filter(function (item) {
                return item.Title.toLowerCase().includes(substr.toLowerCase());
            });
        };
    })
    .directive('ngConfirmClick', [
        function() {
            return {
                link: function (scope, element, attr) {
                    let msg = attr.ngConfirmClick || "Are you sure?";
                    let clickAction = attr.confirmedClick;
                    element.bind('click', function (event) {
                        if (window.confirm(msg)) {
                            scope.$eval(clickAction)
                        }
                    });
                }
            };
        }]);