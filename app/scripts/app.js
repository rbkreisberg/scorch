/*global define */
define([
	'scorch',
	'data_generate'
], function (sc, f) {
	'use strict';

	var fg = f();
	var heatmap;

	var cols = _.map(_.range(0,50), function() { return fg.generateClinicalNode().label;}),
	rows = _.map(_.range(0,50), fg.generateFeature, fg),
	obj = {},
	data = _.map(rows, function(r) { 
		 obj = _.object(cols,_.map(_.range(0,50),Math.random));
		 obj['id'] = r.label;
		 return obj;
		});

	var colorScale = d3.scale.linear().domain([0,1]).range(['lightyellow','lightblue']);

	var Application = {
		initialize : function() {

			return null;
		},
		renderHeatmap : function() {
			var map = d3.scorch({
				data: data,
				cols : cols,
				rows : rows,
				types : _.object(cols, _.times(50,function(n) { return 'number'; })),
				width: 600,
				height: 450
			});
			heatmap =map('.main_heatmap');
			heatmap.render();
		}
	};
	return Application;
});