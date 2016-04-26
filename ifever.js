var readline = require('readline'),
debug = require('debug')('iFever'),
util = require('util'),
nconf = require('nconf');
var Monitor = require('./lib/monitor');

nconf.argv().env();
nconf.file({file: './config.json'});

/*
nconf.defaults({
'targetBand': {
  'address': 'fe65c3487edf', 
  'model': 'iFever', 
  'tag': 'Wooks'}
});
*/

var decodeTemperature = function(data){
  debug('data.length '+ data.length);
  var i = 0;
  var length = data.readUInt8(i++);
  debug('length '+ length);
  var temperature = data.readFloatLE(i);
  i += 4;
  return temperature;
};

var onDisconnect = function(){
   debug('disconnected');
   process.nextTick(startMonitoring);
};

var startMonitoring = function(){
  var id = nconf.get('targetBand:address');
  debug('id: ' + id);
  Monitor.discoverById(id, function(device){
    debug('discovered: ' + device);
    device.on('disconnect', onDisconnect);
    device.on('measurementChange', function(data){
      console.log('temperature: ' + data);
      // TODO : send sensor data to Thing+ 
    });
    
    device.connectAndSetUp(function(){
      debug('connectAndSetUp');
      device.readBatteryLevel(function(err, level){
        if (err){
          debug('ERROR ' + err );
          return;
        }
        debug('level : ' + level);
      });
      device.notifyMeasurement(function(){
        console.log('notifyMeasurement: ');
      });
    });
  });
};

startMonitoring();
