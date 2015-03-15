'use strict';

angular.module('zafiro')
.config(function ($stateProvider, $urlRouterProvider, $locationProvider, $futureStateProvider) {
    $urlRouterProvider
      .otherwise(function($injector, $location) {
        var host = $location.host().split('.')[0];
        var path = $location.path().split('/')[1];

        if(new RegExp('^/'+path+'$').test($location.path())) {
          return $location.path()+'/';
        } else if(host != path) {
          return '/'+host+$location.url();
        } else if(new RegExp('^/'+path+'/$').test($location.path())){
          return '/error/app';
        } else {
          return '/error/page';
        }
      });

    $stateProvider
      .state('root', {
        url: '/',
        template: '<div ui-view class="zafiroRoot container" ng-class="{moveLeft:move==\'left\',moveRight:move==\'right\'}"></div>',
        abstract: true
      })
      .state('error', {
        url: '/error',
        template: '<div ui-view></div>',
        abstract: true
      })
      .state('error.appNotFound', {
        url: '/app',
        template: '<h3>Application not found</h3><a zf-sref="(yuli)comdoc">n</a>'
      })
      .state('error.pageNotFound', {
        url: '/page',
        template: '<h3>Page not found</h3><a zf-sref="(test)">n</a>'
      });

    $futureStateProvider.addResolve(function($http) {
      return $http.get('/api/zafiro/module').then(function(resp) {
        angular.forEach(resp.data, function(fstate) {
          $futureStateProvider.futureState(fstate);
        });
      });
    });

    $futureStateProvider.stateFactory('module', function($http, futureState, $rootScope) {
      return $http.get('/api/zafiro/module/'+futureState.name).then(function(resp) {
          processRoutes(angular.copy(resp.data.routes), resp.data.routes.setModule);
          $rootScope.$broadcast('zfAppRouteLoaded', futureState.name, resp.data);
      });
    });

    function processRoutes(route, setModule, parentState, appName, parentResolve) {
      var thisResolve = false;
      if(!parentState) {
        parentState = 'root';

        appName = route.name;
        
        (route.url=='/'||!route.url)&&(route.url=route.name);
        route.abstract = true;
        if(!route.template&&!route.templateUrl) route.template = "<div ui-view></div>";
      }
      var appUrl = '/app/'+appName+'/';

      var children = route.children||[];
      var files = route.files||[];
      //route.templateUrl&&files.push(route.templateUrl);
      files = files.map(function(filePath) {
        return (filePath[0]=='/')?filePath:appUrl+filePath;
      });
      route.templateUrl&&(route.templateUrl=appUrl+route.templateUrl);
      delete route.children;
      delete route.files;

      var name = route.name;
      delete route.name;
  
      if(files.length) {
        if(!route.resolve) {
          route.resolve = {};
        }
        var loader = function($ocLazyLoad) {
          return $ocLazyLoad.load({
            name: 'zafiro'+(setModule?'.'+appName:''),
            files: files
          });
        };
        thisResolve = parentState+'.'+name+'Resolve';
        var resolves = ['$ocLazyLoad'];
        if(parentResolve) {
          resolves.push(parentResolve);
          resolves.push(function($ocLazyLoad, parent) {
            return loader($ocLazyLoad);
          });
        } else {
          resolves.push(loader);  
        }
        
        route.resolve[thisResolve] = resolves; 
      }
       
      $stateProvider.state(parentState+'.'+name, route);

      children.forEach(function(child) {
        processRoutes(child, setModule, parentState+'.'+name, appName, thisResolve||parentResolve);
      });
    }

    $locationProvider.html5Mode(true);
});