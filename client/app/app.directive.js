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

zf.directive('zfInclude', ['$location', '$sce', '$animate', '$templateRequest', '$anchorScroll', function($location, $sce, $animate, $templateRequest, $anchorScroll) {
  return {
    restrict: 'E',
    priority: 400,
    controller: angular.noop,
    transclude: 'element',
    terminal: true,
    link: function (scope, $element, attrs, ctrl, $transclude) {

      var onloadExp = attrs.onload || '',
          autoScrollExp = attrs.autoscroll;
      var changeCounter = 0,
          currentScope,
          previousElement,
          currentElement;

      var cleanupLastIncludeContent = function() {
        if (previousElement) {
          previousElement.remove();
          previousElement = null;
        }
        if (currentScope) {
          currentScope.$destroy();
          currentScope = null;
        }
        if (currentElement) {
          $animate.leave(currentElement).then(function() {
            previousElement = null;
          });
          previousElement = currentElement;
          currentElement = null;
        }
      };

      scope.$watch($sce.parseAsResourceUrl(attrs.src), function ngIncludeWatchAction(src) {
        var afterAnimation = function() {
          if (angular.isDefined(autoScrollExp) && (!autoScrollExp || scope.$eval(autoScrollExp))) {
            $anchorScroll();
          }
        };
        var thisChangeId = ++changeCounter;

        if (src) {
          var app = $location.path().match(/^\/?([^\/]+)/);
          if(app[1] && !new RegExp('^/app/'+app[1]+'/').test(src)) {
            src = '/app/'+app[1]+'/'+src.replace(/^\/+/, '');
          }

          //set the 2nd param to true to ignore the template request error so that the inner
          //contents and scope can be cleaned up.
          $templateRequest(src, true).then(function(response) {
            if (thisChangeId !== changeCounter) return;
            var newScope = scope.$new();
            ctrl.template = response;

            // Note: This will also link all children of ng-include that were contained in the original
            // html. If that content contains controllers, ... they could pollute/change the scope.
            // However, using ng-include on an element with additional content does not make sense...
            // Note: We can't remove them in the cloneAttchFn of $transclude as that
            // function is called before linking the content, which would apply child
            // directives to non existing elements.
            var clone = $transclude(newScope, function(clone) {
              cleanupLastIncludeContent();
              $animate.enter(clone, null, $element).then(afterAnimation);
            });

            currentScope = newScope;
            currentElement = clone;

            currentScope.$emit('$includeContentLoaded', src);
            scope.$eval(onloadExp);
          }, function() {
            if (thisChangeId === changeCounter) {
              cleanupLastIncludeContent();
              scope.$emit('$includeContentError', src);
            }
          });
          scope.$emit('$includeContentRequested', src);
        } else {
          cleanupLastIncludeContent();
          ctrl.template = null;
        }
      });
        
    }
  }
}]);

zf.directive('zfInclude', ['$compile', function($compile) {
  return {
    restrict: 'ECA',
    priority: -400,
    require: 'zfInclude',
    link: function(scope, $element, $attr, ctrl) {
      if (/SVG/.test($element[0].toString())) {
        // WebKit: https://bugs.webkit.org/show_bug.cgi?id=135698 --- SVG elements do not
        // support innerHTML, so detect this here and try to generate the contents
        // specially.
        $element.empty();
        $compile(jqLiteBuildFragment(ctrl.template, document).childNodes)(scope,
            function namespaceAdaptedClone(clone) {
          $element.append(clone);
        }, {futureParentElement: $element});
        return;
      }

      $element.html(ctrl.template);
      $compile($element.contents())(scope);
    }
  };
}])


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

zf.directive( 'zfCompileData', function ( $compile ) {
  return {
    restrict: 'E',
    scope: true,
    link: function ( scope, element, attrs ) {

      var elmnt;

      attrs.$observe( 'template', function ( myTemplate ) {
        if ( angular.isDefined( myTemplate ) ) {
          // compile the provided template against the current scope
          elmnt = $compile( myTemplate )( scope );

            element.html(""); // dummy "clear"

          element.append( elmnt );
        }
      });
    }
  };
});;