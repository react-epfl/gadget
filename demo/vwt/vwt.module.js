'use strict';

var app = angular.module('WebsocketClient', ['ngResource', 'angularMoment']);

app.filter('numberFixedLen', function () {
  return function (n, len) {
    var num = parseInt(n, 10);
    len = parseInt(len, 10);
    if (isNaN(num) || isNaN(len)) {
      return n;
    }
    num = ''+num;
    while (num.length < len) {
      num = '0'+num;
    }
    return num;
  };
});

if (location.hostname === 'localhost' && location.port === '8080') {
  var hostToConnect = 'http://localhost:9091';
} else {
  var hostToConnect = 'http://graasp.eu';
}

var socket = io.connect(hostToConnect);

moment.locale('en', {
    longDateFormat : {
        LT: "H:mm",
        LTS: "H:mm:ss",
        L: "DD/MM/YYYY",
        l: "D/M/YYYY",
        LL: "MMMM Do YYYY",
        ll: "MMM D YYYY",
        LLL: "MMMM Do YYYY LT",
        lll: "MMM D YYYY LT",
        LLLL: "dddd, MMMM Do YYYY LT",
        llll: "ddd, MMM D YYYY LT"
    }
});
