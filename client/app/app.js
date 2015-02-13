'use strict';

var zf = angular.module('zafiro', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngAnimate',
  'btford.socket-io',
  'ui.router',
  'ct.ui.router.extras',
  'oc.lazyLoad',
  'toasty',
  'angularSoap',
  'ngMaterial',
  'ngMdIcons'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $futureStateProvider, defaultUrl) {
    $urlRouterProvider
      .otherwise(function($injector, $location) {
        var host = $location.host().split('.')[0];
        var path = $location.path().split('/')[1];


        if(host != path) {
          return '/'+host+$location.url();
        } else if(new RegExp('^/'+path+'/?$').test($location.path())){
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
        processRoutes(angular.copy(resp.data.routes));
        $rootScope.$broadcast('zfAppRouteLoaded', futureState.name, resp.data);
      });
    });

    function processRoutes(route, parentState, appUrl) {
      if(!parentState) {
        parentState = 'root';
       
        appUrl = '/app/'+route.name+'/';
        
        (route.url=='/'||!route.url)&&(route.url=route.name);
        route.abstract = true;
        if(!route.template&&!route.templateUrl) route.template = "<div ui-view></div>";
      }

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

        route.resolve[name+'Resolve'] = function($ocLazyLoad) {
          return $ocLazyLoad.load({
            name: 'zafiro',
            files: files
          });
        }; 
      }
       
      $stateProvider.state(parentState+'.'+name, route);

      children.forEach(function(child) {
        processRoutes(child, parentState+'.'+name, appUrl);
      });
    }

    $locationProvider.html5Mode(true);
  })
  .controller('zafiroCtrl', function($scope, $state, $mdSidenav, $location) {
    
    $scope.menu = function() {
      $mdSidenav('menu').toggle();
    };

    $scope.navigate = function(to) {
      $state.go(to).then(function() {
        $mdSidenav('menu').close();
      });
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
  .constant('defaultUrl', '/yuli/login')
  .provider('zafiro', function() {
    var rest = {};
    var wsdl = {};
    var socket = {};
    var self = this;

    this.setRest = function(name, restBase) {
      if(!name) return rest={};
      if(!restBase&&angular.isObject(name)) {
        return angular.forEach(name, function(value, key) { self.setRest(key, value); })
      }
      !restBase&&(restBase=name)&&(name='default');
      rest[name] = restBase;
    };

    this.setSoap = function(name, wsdlUrl) {
      if(!name) return wsdl={};
      if(!wsdlUrl&&angular.isObject(name)) {
        return angular.forEach(name, function(value, key) { self.setSoap(key, value); })
      }
      !wsdlUrl&&(wsdlUrl=name)&&(name='default');
      wsdl[name] = wsdlUrl;
    };

    this.setSocket = function(name, sockBase) {
      if(!name) return io={};
      if(!sockBase&&angular.isObject(name)) {
        return angular.forEach(name, function(value, key) { self.setSocket(key, value); }) 
      }
      !sockBase&&(sockBase=name)&&(name='default');
      socket[name] = io.connect(sockBase);
    };

    this.$get = ['$http', '$soap',  function($http, $soap) {
      return {
        ptr: {
          rest: 'default', 
          soap: 'default',
          socket: 'default'
        },
        set: function(name) {
          if(!name||angular.isString(name)) {
            angular.forEach(this.ptr, function(value, key, ptr) {
              ptr[key] = name||'default'
            });
          } else {
            this.ptr = angular.copy(name);
          }
          return this;
        },
        rest: function(options) {
          if(options.url) {
            var base = rest[this.ptr.rest]||(/^https?:\/\/.+/.test(this.ptr.rest)&&this.ptr.rest)||'';
            options.url= base.replace(/\/+$/, '') + (base==''||/^\/.+/.test(options.url)?options.url:'/'+options.url);
          } 
          return $http(options);
        },
        get: function(url, options) {
          options = options||{};
          options.url = url;
          options.method = 'GET';
          return this.rest(options);
        },
        delete: function(url, options) {
          options = options||{};
          options.url = url;
          options.method = 'DELETE';
          return this.rest(options);
        },
        post: function(url, data, options) {
          options = options||{};
          options.url = url;
          options.data = data;
          options.method = 'POST';
          return this.rest(options);
        },
        put: function(url, data, options) {
          options = options||{};
          options.url = url;
          options.data = data;
          options.method = 'PUT';
          return this.rest(options);
        },
        on: function() {
          if(socket[this.ptr.io]) {
            return socket[this.ptr.io].on.apply(socket[this.ptr.io], Array.prototype.splice.call(arguments, 0))
          }
          throw 'Socket not available';
        },
        emit: function() {
          if(socket[this.ptr.io]) {
            return socket[this.ptr.io].emit.apply(socket[this.ptr.io], Array.prototype.splice.call(arguments, 0))
          }
          throw 'Socket not available';
        },
        call: function() {
          var url = wsdl[this.ptr.soap]||(/^https?:\/\/.+/.test(this.ptr.soap)&&this.ptr.soap)||false;
          if(url) {
            var args = Array.prototype.splice.call(arguments, 0);
            args.unshift(url);
            return $soap.get.apply($soap, args);
          }
          throw 'Soap not available';
        }
      }
    }];

  })
  .animation('.zafiroRoot', function() {
    return {
      addClass: function(element, className, done) {
        if(className == 'moveLeft' || className == 'moveRight') {
          //if(element.hasClass('active')) {
            element.removeClass('moveLeft');
            element.animate({
              transform: "scale(0.75)",
              border: "1px solid gray"
            }, 300, function() {
              element.animate({
                left: className=='moveLeft'?'-1200px':'2400px'
              }, 700, done);
            });
            
         // }
        }
        return function(cancel) {
          if(cancel) element.stop();
        }
      },
      removeClass: function(element, className, done) {
        if(className == 'moveLeft' || className == 'moveRight') {

        }
        return function(cancel) {
          if(cancel) element.stop();
        }

      }
    }
  });

['src', 'href'].forEach(function(refAttr) {
  var refAttr = refAttr.toLowerCase();
  var dirAttr = 'zf'+(refAttr[0].toUpperCase()+refAttr.substr(1));
  zf.directive('zf'+(refAttr[0].toUpperCase()+refAttr.substr(1)), ['$location', function($location) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        attrs.$observe(dirAttr, function(value) {
          var app = $location.path().match(/^\/?([^\/]+)/);
          if(app[1] && !new RegExp('^/app/'+app[1]+'/').test(value)) {
            value = '/app/'+app[1]+'/'+value.replace(/^\/+/, '');
          }
          attrs.$set(refAttr, value);
        });
      }
    };
  }]);  
});

zf.directive('zfSref', ['$location', '$state', '$rootScope', function($location, $state, $rootScope) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var linkFn = function(){};
      element.click(function(evt) {
        evt.preventDefault();
        linkFn();
      });
      attrs.$observe('zfSref', function(value) {
        linkFn = function(){};
        if(angular.isString(value) && !/^[\^.]/.test(value)) {
          var match;
          var app;
          if(match = value.match(/^\(([a-z]+)\)(.*)$/)) {
            linkFn = function() {
              var off = $rootScope.$on('zfAppRouteLoaded', function(evt, root) {
                off();
                var toffS = $rootScope.$on('$transitionSuccess', function() {
                  toffS();
                  toffE();
                  if(root == match[1]) {
                    $state.go('root.'+match[1]+'.'+(match[2]||'main'));
                  }
                });
                var toffE = $rootScope.$on('$transitionError', function() {
                  toffS();
                  toffE();
                });
              });
              $location.path('/'+match[1]+'/');
              scope.$apply();
            }
            return;
          } else if(app = $location.path().match(/^\/?([^\/]+)/)) {
              value = 'root.'+app[1]+'.'+value;
          } else {
            return;
          }
        }
        linkFn = function() {
          $state.go(value);
        };
      });
    }
  };
}])
