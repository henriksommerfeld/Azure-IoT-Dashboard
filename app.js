var express = require('express.io')
var path = require('path');
var fs = require('fs');
var EventHubClient = require('azure-event-hubs').Client;
var IotHubClient = require('azure-iothub').Client;
var Message = require('azure-iot-common').Message;

app = express().http().io()

var getConnectionString = function(settings) {
    if (settings.OFFICE_MONITORING_CONNSTRING)
    {
        return settings.OFFICE_MONITORING_CONNSTRING;
    }
    else  {
        var configFilePath = path.resolve(__dirname, "config/azure.json");
        var configContent = fs.readFileSync(configFilePath, "utf8");
        var configContentJSON = JSON.parse(configContent);
        return configContentJSON.AzureConnectionString;
    }
};

var eventHubConnectionString = getConnectionString(process.env);
var client = EventHubClient.fromConnectionString(eventHubConnectionString, 'sommerfeld-hub')

// Setup your sessions, just like normal.
app.use(express.cookieParser())
app.use(express.session({secret: 'sommerfeld-hub'}))

// Session is automatically setup on initial request.
app.get('/', function(req, res) {
    req.session.loginDate = new Date().toString()
    res.sendfile(__dirname + '/index.html')
});

app.use(express.static(__dirname + '/static'));

// Instantiate an eventhub client

app.io.route('ready', function(req) {
    // For each partition, register a callback function
    client.getPartitionIds().then(function(ids) {
        ids.forEach(function(id) {
            var minutesAgo = 5;
            var before = (minutesAgo*60*1000);
            client.createReceiver('$Default', id, { startAfterTime: Date.now() - before })
                .then(function(rx) {
                    rx.on('errorReceived', function(err) { console.log(err); });
                    rx.on('message', function(message) {
                        console.log(message.body);
                        var body = message.body;
                        try {
                            app.io.broadcast('data', body);
                        } catch (err) {
                            console.log("Error sending: " + body);
                            console.log(typeof(body));
                        }
                    });
                });
        });
    });
});

var port = process.env.port || 7070;
app.listen(port)
console.log("Listening on port " + port);