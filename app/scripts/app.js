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
		obj;

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

		shift : function( theArray, M ) {
	    var size = theArray.length;
	    theArray.reverse();
	    Array.prototype.splice.apply(theArray, [0, M - 1].concat(theArray.slice(0, M-1).reverse()));
	    Array.prototype.splice.apply(theArray, [M, size - 1].concat(theArray.slice(M).reverse()));
	    return theArray;
		},

		shuffle : function(theArray) {
		return d3.shuffle(theArray);
		}
	};

	function change(label, theArray, type) {
		heatmap.clear('foreground');
		heatmap[label](reorder[type](theArray, 1));
		}

	function setElementHooks() {
		['cols','rows'].forEach( function(label) {
			['shift','shuffle'].forEach( function(type) {
				$('#' + type + '_' + label).on('click', function() {
					change(label, heatmap[label](), type);
				});
			});
		});
		
		$('#dim_size').keypress(function(event) {
                if (event.keyCode == $.ui.keyCode.ENTER) {
                    var val = $(this).val();
                    data= generateData(parseInt(val) || demoDim);
                    Application.renderHeatmap(data);
                    return false;
                }
        });

		$('#load_binary').on('click', function() {
			binary.loadData('data/heatmap.bin',function(error, matrix) {
				var data = {
					data :  _.map(matrix.RowLabels, function(r, i) { 
					 obj = _.object(matrix.ColumnLabels, matrix.FeatureData[i]);
					 obj['id'] = r;
					 return obj;
					}, data),
					cols : matrix.ColumnLabels,
					rows : matrix.RowLabels,
				};
				Application.renderHeatmap(data);
			});
			
		});

		$('form').on('submit', function(evt, ui) {
			return false;
		});
	}

	var Application = {
		initialize : function() {
			setElementHooks();
			return null;
		},
		start : function() {
			var data = generateData();
			this.renderHeatmap(data);
		},
		renderHeatmap : function(data) {
			var map = d3.scorch({
				data: data.data,
				cols : data.cols,
				rows : data.rows,
				types : _.object(data.rows.length, _.times(data.rows.length, function(n) { return 'number'; })),
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