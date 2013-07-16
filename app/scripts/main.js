require.config({

    baseUrl: 'scripts',

    paths: {
        jquery: '../bower_components/jquery/jquery',
        "jQuery-ui": "../bower_components/jquery-ui/ui/jquery-ui",
        bootstrap: 'vendor/bootstrap',
        modernizr: '../bower_components/modernizr',
        queue: '../bower_components/queue-async/queue',
        underscore: '../bower_components/underscore/underscore',
        jDataView: '../bower_components/jDataView/src/jDataView',
        jBinary : '../bower_components/jBinary/src/jBinary'
    },
    shim: {
        underscore: {
            'exports' : '_'
        },
        "jQuery-ui": {
            "deps": ["jquery"],
            "exports": "$"
        },
        queue: {
            'exports': 'queue'
        },
        bootstrap: {
            deps: ['jquery', 'jQuery-ui'],
            exports: 'bootstrap'
        }
    }
});

require(['app', 'underscore', 'jquery', 'jQuery-ui', 'bootstrap'], function(app, _, $) {
    'use strict';
    app.initialize();
    app.renderHeatmap();
});