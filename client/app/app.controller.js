'use strict';

angular.module('zafiro')
.controller('zafiroCtrl', function($scope, $state, $mdSidenav, $location, $http, zafiro) {

    $http.get('/api/zafiro/organization')
    .success(function(data) {
      $scope.orgImage = data.image;
    });

    zafiro.searchConfigChanged(function(config) {
      $scope.searchConfig = config;
    });

    $scope.searchModel = {};
    $scope.searchConfig = {};
    
    $scope.search = function() {
      zafiro.performSearch($scope.searchModel);
    };

    $scope.menu = function() {
      $mdSidenav('menu').toggle();
    };

    $scope.navigate = function(to, title) {
      $state.go(to).then(function() {
        $mdSidenav('menu').close();
      });
      $scope.currentTitle = title;
    };

    $scope.currentApp=null;
    $scope.apps=[];

    $scope.$on('$transitionSuccess', function(evt, result) {
      var match;
      var app = $location.path().match(/^\/?([^\/]+)/);
      if(app[1] && $scope.currentAppName != app[1]) {
        $scope.currentAppName = app[1];
      }
      if(result.to.state.title) {
        $scope.currentTitle = result.to.state.title;
      }
    });

    $scope.$watch('currentAppName', function(value) {
      $scope.currentApp = $scope.apps[$scope.currentAppName]||{};
      if($scope.currentApp.appBgImg) {
        angular.element('#toolbarBackground').css('background-image', 'url(/app/'+$scope.currentAppName+'/'+$scope.currentApp.appBgImg+')');
      } else {
        angular.element('#toolbarBackground').css('background-image', '');
      }
      if($scope.currentApp.searchConfig) {
        $scope.searchConfig = $scope.currentApp.searchConfig;
      }
    });

    $scope.$on('zfAppRouteLoaded', function(evt, app, config) {
      $scope.apps[app] = {
        appImgAction: 'main',
        appImg: config.image,
        appBgImg: config.background,
        appTitle: config.title,
        appDesc: config.description,
        sideNav: [],
        searchConfig: config.search
      };
      $scope.searchConfig = config.search;
      setSideNav($scope.apps[app], config.routes.children, 'root.'+app+'.');
      $scope.currentAppName = app;
    });

    function setSideNav(app, routes, parent) {
      if(angular.isArray(routes)) {
        angular.forEach(routes, function(route) {
          if(route.sidenav == 'default') {
            app.appImgAction = parent+route.name;
          } else if(route.sidenav) {
            if(angular.isObject(route.sidenav)) {
              route.sidenav.to = parent+route.name;
              !route.sidenav.title && (route.sidenav.title=route.title);
              app.sideNav.push(route.sidenav);
            } else if(angular.isString(route.sidenav)) {
              app.sideNav.push({title: route.sidenav, to: parent+route.name});
            } else {
              app.sideNav.push({title: route.title||route.name, to: parent+route.name});
            }
          }
          if(route.children) {
            setSideNav(app, route.children, parent+route.name+'.');
          }
        });
      }
    }
  })