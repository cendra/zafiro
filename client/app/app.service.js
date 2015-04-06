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
        },
        login: function(params, success, error) {
          $http.post('/api/zafiro/login', params, {cache: false})
          .success(function(data) {
            success&&success(data);
            console.log(data);
          })
          .error(function(data) {
            error&&error(data);
            console.log(data);
          });
          return this;
        },
        onSearch: function(fn) {
          perfomedSearchListeners.push(fn);
        },
        searchConfigChanged: function(fn) {
          searchConfListeners.push(fn);
          searchConf && fn(searchConf);
        },
        setSearchConf: function(conf) {
          searchConf = conf;
          perfomedSearchListeners = [];
          searchConfListeners.forEach(function(fn) {
            fn(conf);
          });
        },
        performSearch: function(searchParams) {
          perfomedSearchListeners.forEach(function(fn) {
            fn(searchParams);
          });
        }
      }
    }];

  })