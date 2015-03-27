'use strict';

var zf = angular.module('zafiro');

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
}]);
zf.directive('zfPolymer', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      element.each(function() {
        this.setScope(scope);
      });
    }
  }
});