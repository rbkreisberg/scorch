/*global define */
define([
	'jquery',
	'underscore',
	'scorch',
	'data_generate',
	'binary/heatmap'
], function ($, _, sc, f, binary) {
	'use strict';

	var heatmap;

	var demoDim = 50,	
		obj, 
		data;

	function generateData(dim) {
		if (arguments.length < 1) dim = demoDim;

		var fg = f();
		var genomicFeatures =  _.map(_.range(0,dim), fg.generateFeature, fg),
		    clinicalFeatures =  _.map(_.range(0,dim), fg.generateClinicalNode, fg);

		var struct = {
			cols :  _.pluck(clinicalFeatures,'label'),
			rows : _.pluck(genomicFeatures,'label'),
			dim : dim
		};

		struct.data = _.map(genomicFeatures, function(r) { 
				 obj = _.object(this.cols,_.map(_.range(0,dim),Math.random));
				 obj['id'] = r.label;
				 return obj;
				}, struct);

		return struct;
	}

	var colorScale = d3.scale.linear().domain([0,1]).range(['lightyellow','lightblue']);

	var reorder = {

		shift : function( label, M ) {
		var theArray=data[label];
	    var size = theArray.length;
	    theArray.reverse();
	    Array.prototype.splice.apply(theArray, [0, M - 1].concat(theArray.slice(0, M-1).reverse()));
	    Array.prototype.splice.apply(theArray, [M, size - 1].concat(theArray.slice(M).reverse()));
	    return theArray;
		},

		shuffle : function(label) {
		return d3.shuffle(data[label]);
		}
	};

	function change(label, type) {
		heatmap.clear('foreground');
		heatmap[label](reorder[type](label, 50));
		}

	function setElementHooks() {
		['cols','rows'].forEach( function(label) {
			['shift','shuffle'].forEach( function(type) {
				$('#' + type + '_' + label).on('click', function() {
					change(label, type);
				});
			});
		});
		
		$('#dim_size').keypress(function(event) {
                if (event.keyCode == $.ui.keyCode.ENTER) {
                    var val = $(this).val();
                    data= generateData(parseInt(val) || demoDim);
                    Application.renderHeatmap();
                    return false;
                }
        });

		$('#load_binary').on('click', function() {
			binary.loadData('data/heatmap.bin',function(error, data) {console.log(data.FeatureData);});
			
		});

		$('form').on('submit', function(evt, ui) {
			return false;
		});
	}

	var Application = {
		initialize : function() {
			setElementHooks();
			data = generateData();
			return null;
		},
		renderHeatmap : function() {
			var map = d3.scorch({
				data: data.data,
				cols : data.cols,
				rows : data.rows,
				types : _.object(data.cols, _.times(data.dim,function(n) { return 'number'; })),
				width: 600,
				height: 450,
				mode : 'queue',
				rate : 1
			});
			heatmap =map('.main_heatmap');
			heatmap.render();
		}
	};
	return Application;
});