require.config({

    baseUrl: 'scripts',

    paths: {
        jquery: '../bower_components/jquery/dist/jquery',
        "jQuery-ui": "../bower_components/jquery-ui/ui/jquery-ui",
        bootstrap: '../bower_components/bootstrap/dist/js/bootstrap',
        underscore: '../bower_components/underscore/underscore',
        jdataview: '../bower_components/jdataview/dist/browser/jdataview',
        jbinary : '../bower_components/jbinary/dist/browser/jbinary'
    },
    shim: {
        "jQuery-ui": {
            "deps": ["jquery"],
            "exports": "$"
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
    app.start();
});