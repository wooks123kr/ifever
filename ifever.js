var readline = require('readline'),
debug = require('debug')('iFever'),
util = require('util'),
nconf = require('nconf');
var Monitor = require('./lib/monitor');
var thingplus = require('./thingplus');

nconf.argv().env();
nconf.file({file: './config.json', format: require('hjson')});

/*
nconf.defaults({
'targetBand': {
  'addr': 'fe65c3487edf', 
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

var batteryMonitor = function(){
  var self = this;
  this.readBatteryLevel(function(err, level){
    debug('battery level: ' + level);
    thingplus.setBatteryLevel(self.id, level);
  });
};

var onDisconnect = function(){
   debug('disconnected');
   process.nextTick(startMonitoring);
   clearInterval(batteryMonitor);
};


var startMonitoring = function(){
  var band = nconf.get('targetBand');
  debug('band: ' + band);
  thingplus.initialize([band]);
  Monitor.discoverById(band.addr, function(device){
    debug('discovered: ' + device);
    device.on('disconnect', onDisconnect);
    device.on('measurementChange', function(data){
      console.log(new Date() + ': ' + data);
      // TODO : send sensor data to Thing+ 
      var temperature = {
        'value' : data,
        'ctime' : new Date(),
        'where' : 0, // 어디에서 측정했는지, 겨드랑이, 입속, 항문, 귀속 
      };
      thingplus.setTemperature(band.addr, temperature);   
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

      setInterval(batteryMonitor.bind(device), 5000);
    });
  });
};

startMonitoring();
