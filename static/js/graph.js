var io = io.connect();

var temperatureChart = c3.generate({
    bindto: '#temp-graph',
    data: {
        x: 'x',
        columns: [
        ]
    },
    axis: {
        x: {
            type: 'timeseries',
            tick: {
                format: '%X'
            }
        }
    }
});

var humidityChart = c3.generate({
    bindto: '#humidity-graph',
    data: {
        x: 'x',
        columns: [
        ]
    },
    axis: {
        x: {
            type: 'timeseries',
            tick: {
                format: '%X'
            }
        }
    }
});

var LABEL_PREFIXES = /^temperature|^humidity|^press/;
var labels = null;
var temperatureColumns = [];
var humidityColumns = [];

var appendTemperatureColumn = function (index, label, value) {
    if(!value){
        console.log('value is null ' + label + ' is skipped');
    } else{
        if (temperatureColumns.length <= index) {
            temperatureColumns.push([label]);
        }
        temperatureColumns[index].push(value);
        if (temperatureColumns[index].length > 20) {
            temperatureColumns[index].splice(1, 1);
        }
    }
};

var appendHumidityColumn = function (index, label, value) {
    if(!value){
        console.log('value is null ' + label + ' is skipped');
    } else{
        if (humidityColumns.length <= index) {
            humidityColumns.push([label]);
        }
        humidityColumns[index].push(value);
        if (humidityColumns[index].length > 20) {
            humidityColumns[index].splice(1, 1);
        }
    }
};

var initializeLabels = function (data) {
    labels = [];
    Object.keys(data).forEach(function (key) {
        if (LABEL_PREFIXES.test(key)) {
            labels.push(key);
        }
    });
};

var round = function(value) {
    return value.toFixed(2);
};

var updateSingleTemperature = function(value) {
    $('#current-temp-value').text(value);    
};

var updateSingleHumidity = function(value) {
    $('#current-humidity-value').text(value);    
};

var showLastUpdate = function(timestamp) {
    $('#last-updated').text(new Date(timestamp));
};


io.on('data', function (incomingData) {
    // Initialize labels from incoming data
    if (labels === null) {
        initializeLabels(incomingData);
    }
    if(incomingData.timestamp){
        appendTemperatureColumn(0, 'x', new Date(incomingData.timestamp));
        appendHumidityColumn(0, 'x', new Date(incomingData.timestamp));
        for (var i = 0; i < labels.length; i++) {
            showLastUpdate(incomingData.timestamp);

            if (labels[i] === 'temperature') {            
                var latestTemperature = round(incomingData[labels[i]]);
                updateSingleTemperature(latestTemperature);                
                appendTemperatureColumn(i + 1, labels[i], latestTemperature);
            }

            if (labels[i] === 'humidity') {            
                var latestHumidity = round(incomingData[labels[i]]);
                updateSingleHumidity(latestHumidity);                
                appendHumidityColumn(i + 1, labels[i], latestHumidity);
            }
        }
    } else{
        console.log('Skipping bad timestamp');   
    }
    temperatureChart.load({
        columns: temperatureColumns
    });
    humidityChart.load({
        columns: humidityColumns
    });
});

// Listen for session event.
io.emit('ready');
