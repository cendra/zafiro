'use strict';

angular.module('zafiroApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'btford.socket-io',
  'ui.router',
  'ct.ui.router.extras',
  'ui.bootstrap'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $futureStateProvider) {
    $urlRouterProvider
      .otherwise(function($injector, $location) {
        var host = $location.host().split('.')[0];
        var path = $location.path().split('/')[1];

        if(host != path) {
          return '/'+host+$location.url();
        } else {
          return '/error/app';
        }

      });

    $stateProvider
      .state('root', {
        url: '/',
        abstract: true
      })
      .state('error', {
        url: '/error',
        template: '<div ui-view></div>',
        abstract: true
      })
      .state('error.appNotFound', {
        url: '/app',
        template: '<h3>Application not found</h3><a ui-sref="root.test">n</a>'
      });

    $futureStateProvider.addResolve(function($http) {
      return $http.get('/api/zafiro/module').then(function(resp) {
        angular.forEach(resp.data, function(fstate) {
          $futureStateProvider.futureState(fstate);
        });
      });
    });

    $futureStateProvider.stateFactory('module', function($http, futureState) {
      return $http.get('/api/zafiro/module/'+futureState.name).then(function(resp) {
        return processRoutes(resp.data);
      });
    });

    function processRoutes(route, parentState) {
      if(!parentState) {
        parentState = 'root';
        (route.url=='/'||!route.url)&&(route.url=route.name);
      }

      var children = route.children||[];
      var files = route.files||[];
      route.templateUrl&&files.push(route.templateUrl);
      delete route.children;
      delete route.templateUrl;
  
      var state = $.extend(true, {}, route, {
        name: parentState+'.'+route.name,
        children: []
      });

      if(files.length) {
        if(!state.resolve) {
          state.resolve = {};
        }

        state.resolve[state.name] = ['$ocLazyLoad', function($ocLazyLoad) {
          $ocLazyLoad.load({
            name: state.name.split('.')[1]+'App',
            files: files
          });
        }]; 
      }

      children.forEach(function(child) {
        state.children.push(processRoutes(child, state.name));
      })
       
      return state;
    }

    $locationProvider.html5Mode(true);
  })
  .run(function ($rootScope) {
    $rootScope.$on('$stateNotFound', function(event, unfoundState, fromState, fromParams) {
      console.log(event);
      console.log(unfoundState);
      console.log(fromState);
      console.log(fromParams);
    });
  });