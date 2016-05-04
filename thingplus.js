var jsonrpc = require('jsonrpc-tcp'),
    _ = require('lodash'),
    util = require('util'),
    debug = require('debug')('thingplus');

var notiConfigs = {};
var clientConnection;
var targetBands = [];

var ONE_HOUR_IN_MILLIS = 60 * 60 * 1000;

function setBatteryLevel(addr, level, ctime){
  if (!level){
    return false;
  }
  var band = _.find(targetBands, {'addr': addr});
  band.battery = {'level' : level, 'ctime': ctime};
}
// stepCount에 대해서만 현재는 notification을 보낼 수 있다.
// params id 
// 현재는 Thingplus Gateway는 한대의 Sensor-Device만을 지원한다. 
function setTemperature(addr, temperature){
  'use strict';
  if (!clientConnection){
    debug('[sendNotification] jsonrcp client connection disconnected ');
    return;
  }
  var band = _.find(targetBands, {'addr': addr});
  if (band) {
    band.temperature = temperature;
  }
}

// thingplus에서는 {Address}-{Type}-{Sequenct #} 형태로 ID가 구성되어야 한다.
function parseThingplusId(id){
  'use strict';
  var band = {};
  var splits = id.split('-');
  band.addr = splits[0];
  band.type = splits[1];
  band.seq = splits[2];
  return band;
}

// band data gettering
var SensorService = {
  get: function(id, result){
    if (!targetBands){
      debug('[SensorService]Device(%s) is not yet initialized', id);
      return result(new Error('Device not yet initialized' + id));
    }
    var thingplusDevice = parseThingplusId(id);
    var band = _.find(targetBands , {'addr':  thingplusDevice.addr});
    if (!band) {
      debug('[SensorService] cannot found band id = %s', id);
      return result(new Error('cannot found band id = ' + id));
    }

    debug('[SenserService]band: ' + util.inspect(band));

    if (band[thingplusDevice.type]){
      debug('[SensorService] data= %s', util.inspect(band[thingplusDevice.type]));
    	return result(null, {'value': band[thingplusDevice.type].value, 'status': 'on'});
    }else{
      //return result(new Error(band[thingplusDevice.type]  + ' is not yet recorded'));
      return result(null, {'value' : 36.5, 'status': 'on'});
    }
  },
  set: function (id, result){
    result(null, 'success');
  },
  setNotification: function (id, result){
    result(null, 'success');
  }
};

// for thingplus 호환성을 위해서 
// 모든 sensor는 device에 종속적이다. 즉 하나의 Device에만 속해 있어야 한다.
var discoverDeviceAndSensors = function(result){
  debug('[JSONRPC] discovering... ' + targetBands.length + ' bands');
  var deviceAndSensors = [];
  _.forEach(targetBands, function(band){
    var device = {
      deviceAddress : band.addr,
      sensors : []
    };
    device.sensors.push({
      id : [band.addr, 'temperature', '1'].join('-'),
      type : 'temperature',
      name : [band.model, band.addr,'temperature'].join('-'),
    });
    device.sensors.push({
      id : [band.addr, 'batteryGauge', '1'].join('-'),
      type : 'batteryGauge',
      name : [band.model, band.addr,'battery'].join('-'),
    });
    deviceAndSensors.push(device);
  });
  debug('[JSONRPC] deviceAndSensors = ' + util.inspect(deviceAndSensors));
  return result(null, deviceAndSensors);
};

var JSONRPC_PORT = 50800; // thingplus 연동을 위한 port 
var server;

module.exports = {
  initialize: function(tBands){
    _.forEach(tBands, function(band){
      targetBands.push(band);
    });
    server = jsonrpc.createServer(function (client){
      clientConnection = client;
      debug('[JSONRPC] new connection');
      });

    server.expose('sensor', SensorService);
    server.expose('discover', discoverDeviceAndSensors);
    server.on('clientError', function(err, conn){
      debug('[JSONRPC] Connection closed');
      if (clientConnection === conn){
        clientConnection = null;
        _.forEach(notiConfigs, function(config){
          config.enable = false;
        });
      }
    });

    server.listen(JSONRPC_PORT, function(){
      debug('[JSONPRC] listening port %d', JSONRPC_PORT);
    });

  },
  setTemperature : setTemperature,
  setBatteryLevel: setBatteryLevel
};
