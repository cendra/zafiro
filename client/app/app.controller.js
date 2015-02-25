'use strict';

angular.module('zafiro')
.controller('zafiroCtrl', function($scope, $state, $mdSidenav, $location) {
    
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
    });

    $scope.$watch('currentAppName', function(value) {
      $scope.currentApp = $scope.apps[$scope.currentAppName]||{};
    });

    $scope.$on('zfAppRouteLoaded', function(evt, app, config) {
      $scope.apps[app] = {
        appImgAction: 'main',
        appImg: config.image,
        appTitle: config.title,
        appDesc: config.description,
        sideNav: []
      };
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
              app.sideNav.push(route.sidenav);
            } else if(angular.isString(route.sidenav)) {
              app.sideNav.push({title: route.sidenav, to: parent+route.name});
            } else {
              app.sideNav.push({title: route.name, to: parent+route.name});
            }
          }
          if(route.children) {
            setSideNav(app, route.children, parent+route.name+'.');
          }
        });
      }
    }
  })