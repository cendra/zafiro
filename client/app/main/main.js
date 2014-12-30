'use strict';

angular.module('zafiroApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('main', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl'
      }).state('main.algo', {
      template: '<div>Algo</div>',
      url: 'algo'
    });

  });