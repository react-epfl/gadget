var app = angular.module('timeSpentGadget', ['ngResource']);

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

