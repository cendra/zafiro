'use strict';

angular.module('zafiro')
  .provider('zafiro', function() {
    var rest = {};
    var wsdl = {};
    var socket = {};
    var self = this;
    var searchConf = null;
    var searchConfListeners = [];
    var perfomedSearchListeners = [];
    var toolbarConf = {};
    var toolbarConfListeners = [];


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

    this.setSearchConf = function(conf) {
      searchConf = conf;
      perfomedSearchListeners = [];
      searchConfListeners.forEach(function(fn) {
        fn(conf);
      });
    };

    this.onSearch = function(fn) {
      perfomedSearchListeners.push(fn);
    };

    this.searchConfigChanged = function(fn) {
      searchConfListeners.push(fn);
      searchConf && fn(searchConf);
    };

    this.setToolbarConf = function(conf) {
      toolbarConf = conf;
      toolbarConfListeners.forEach(function(fn) {
        fn(conf);
      });
    };

    this.toolbarConfChanged = function(fn) {
      toolbarConfListeners.push(fn);
      toolbarConf && fn(toolbarConf);
    };

    var self = this;

    this.$get = ['$http', '$soap', '$mdToast', function($http, $soap, $mdToast) {
      var viewToolbarConf = {};
      var viewToolbarConfListeners = [];
      var loginListeners = [];
      var loginState = false;
      var toastDefaultOptions = {
        templateUrl: 'views/toastTemplate.html',
        controller: function($scope, type, content) {
          $scope.content = content;
          switch(type) {
            case "error":
              $scope.icon = 'error';
              $scope.iconColor='red';
              break;
            case "warning":
              $scope.icon = 'warning';
              $scope.iconColor='yellow';
              break;
            default:
              $scope.icon = 'info';
              $scope.iconColor='blue';
              break;
          }
          $scope.close = function() {
            $mdToast.hide();
          }
        },
        locals: {
          type: 'info',
          content: ''
        },
        position: "top left",
        hideDelay: 3000
      };
      return {
        ptr: {
          rest: 'default', 
          soap: 'default',
          socket: 'default'
        },
        toast: function(content, type) {
          var ops = angular.extend({}, toastDefaultOptions, {locals: {content: content, type: type}});
          $mdToast.show(ops);
          return this;
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
          this.toast('Socket not available', 'error');
        },
        emit: function() {
          if(socket[this.ptr.io]) {
            return socket[this.ptr.io].emit.apply(socket[this.ptr.io], Array.prototype.splice.call(arguments, 0))
          }
          this.toast('Socket not available', 'error');
        },
        call: function() {
          var url = wsdl[this.ptr.soap]||(/^https?:\/\/.+/.test(this.ptr.soap)&&this.ptr.soap)||false;
          if(url) {
            var args = Array.prototype.splice.call(arguments, 0);
            args.unshift(url);
            return $soap.get.apply($soap, args);
          }
          this.toast('Soap not available', 'error');
        },
        login: function(params) {
          $http.post('/api/zafiro/login', params, {cache: false})
          .success(function(data) {
            loginState = data;
            loginListeners.forEach(function(cb) {
              cb(data);
            });
          })
          .error(function(data) {
            this.toast(data||'Could not login', 'error');
            loginState = false;
            loginListeners.forEach(function(cb) {
              cb(false);
            });
          }.bind(this));
          return this;
        },
        logout: function() {
          $http.post('/api/zafiro/logout', params, {cache: false})
          .success(function(data) {
            loginState = false;
            loginListeners.forEach(function(cb) {
              cb(false);
            });
          })
          .error(function(data) {
            this.toast(data||'Could not logout', 'error');
          }.bind(this));
          return this;
        },
        loginChanged: function(cb) {
          loginListeners.push(cb)
          loginState && cb(loginState);
          return this;
        },
        onSearch: function(fn) {
          self.onSearch(fn);
          return this;
        },
        searchConfigChanged: function(fn) {
          self.searchConfigChanged(fn);
          return this;
        },
        setSearchConf: function(conf) {
          self.setSearchConf(conf);
          return this;
        },
        performSearch: function(searchParams) {
          perfomedSearchListeners.forEach(function(fn) {
            fn(searchParams);
          });
          return this;
        },
        setViewToolbarConf: function(conf) {
          viewToolbarConf = conf;
          viewToolbarConfListeners.forEach(function(fn) {
            fn(conf);
          });
          return this;
        },
        viewToolbarConfChanged: function(fn) {
          viewToolbarConfListeners.push(fn);
          viewToolbarConf && fn(viewToolbarConf);
          return this;
        },
        toolbarConfChanged: function(fn) {
          self.toolbarConfChanged(fn);
          return this;
        }
      }
    }];

  })