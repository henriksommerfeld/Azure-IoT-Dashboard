var io = io.connect();

var round = function(value) {
    return value.toFixed(1);
};

var temperatureChart = c3.generate({
    bindto: '#temp-graph',
    data: {
        x: 'x',
        columns: []
    },
    axis: {
        x: {
            type: 'timeseries',
            tick: {
                format: '%X'
            }
        },
        y: {
            tick: {
                format: function (d) { return round(d); }
            }
        }
    },
    point: {
        r: 4
    }
});

var humidityChart = c3.generate({
    bindto: '#humidity-graph',
    data: {
        x: 'x',
        columns: []
    },
    axis: {
        x: {
            type: 'timeseries',
            tick: {
                format: '%X'
            }
        },
        y: {
            tick: {
                format: function (d) { return round(d) + "%"; }
            }
        }
    },
    point: {
        r: 4
    }
});

var pressureChart = c3.generate({
    bindto: '#pressure-graph',
    data: {
        x: 'x',
        columns: []
    },
    axis: {
        x: {
            type: 'timeseries',
            tick: {
                format: '%X'
            }
        },
        y: {
            tick: {
                format: function (d) { return round(d) + "%"; }
            }
        }
    },
    point: {
        r: 4
    }
});

var LABEL_PREFIXES = /^temperature|^humidity|^pressure/;
var labels = null;
var temperatureColumns = [];
var humidityColumns = [];
var pressureColumns = [];

var appenColumn = function (index, label, value, columns) {
    if (!value || !columns) {
        console.log('value is null ' + label + ' is skipped');
    } else {
        if (columns.length <= index) {
            columns.push([label]);
        }
        if (columns[index]) {
            columns[index].push(value);
            if (columns[index].length > 20) {
                columns[index].splice(1, 1);
            }
        }
    }
};

var appendTemperatureColumn = function (index, label, value) {
    appenColumn(index, label, value, temperatureColumns);
};

var appendHumidityColumn = function (index, label, value) {
    appenColumn(index, label, value, humidityColumns);
};

var appendPressureColumn = function (index, label, value) {
    appenColumn(index, label, value, pressureColumns);
};

var initializeLabels = function (data) {
    labels = [];
    Object.keys(data).forEach(function (key) {
        if (LABEL_PREFIXES.test(key)) {
            labels.push(key);
        }
    });
};

var updateSingleTemperature = function(value) {
    $('#current-temp-value').text(value);    
};

var updateSingleHumidity = function(value) {
    $('#current-humidity-value').text(value);    
};

var updateSinglePressure = function(value) {
    $('#current-pressure-value').text(value);    
};

var showLastUpdate = function(timestamp) {
    if ($('#no-data').is(':visible')) {
        $('#no-data').hide('fast');
        $('.last-updated-container').show('fast');        
    }
    
    $('#last-updated').text(new Date(timestamp));
    var target = $('body');
    target.toggleClass('updated');
    setTimeout(function() { 
        target.toggleClass('updated'); 
    }, 1000); 
};

io.on('data', function (incomingData) {
    // Initialize labels from incoming data
    if (labels === null) {
        initializeLabels(incomingData);
    }
    if (incomingData.timestamp){
        appendTemperatureColumn(0, 'x', new Date(incomingData.timestamp));
        appendHumidityColumn(0, 'x', new Date(incomingData.timestamp));
        appendPressureColumn(0, 'x', new Date(incomingData.timestamp));
        
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

            if (labels[i] === 'pressure') {            
                var latestPressure = round(incomingData[labels[i]]);
                updateSinglePressure(latestPressure);
                appendPressureColumn(i + 1, labels[i], latestPressure);
            }
        }
    } else{
        console.log('Skipping bad timestamp');   
    }
    temperatureChart.load({
        columns: temperatureColumns,
        colors: {'temperature': '#1F77B4'}
    });
    humidityChart.load({
        columns: humidityColumns,
        colors: {'humidity': '#FF7F0E'}
    });
    pressureChart.load({
        columns: pressureColumns,
        colors: {'pressure': '#2CA02C'}
    });
});

// Listen for session event.
io.emit('ready');

$(function(){
    var progress = 0;
    function timeout() {
        setTimeout(function () {
            $('.progress-bar').css('width', progress+'%').attr('aria-valuenow', progress);
            progress++;
            timeout();
        }, 30000 / 100);
    }  
     timeout();      
});
