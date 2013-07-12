/*global define */
define([
	'jquery',
	'scorch',
	'data_generate'
], function ($, sc, f) {
	'use strict';

	var fg = f();
	var heatmap;

	var dim = 1000,
	obj;

	var genomicFeatures =  _.map(_.range(0,dim), fg.generateFeature, fg),
	    clinicalFeatures =  _.map(_.range(0,dim), fg.generateClinicalNode, fg);

	var struct = {
		cols :  _.pluck(clinicalFeatures,'label'),
		rows : _.pluck(genomicFeatures,'label')
	};

	struct.data = _.map(genomicFeatures, function(r) { 
			 obj = _.object(this.cols,_.map(_.range(0,dim),Math.random));
			 obj['id'] = r.label;
			 return obj;
			}, struct);

	var colorScale = d3.scale.linear().domain([0,1]).range(['lightyellow','lightblue']);

	var reorder = {

		shift : function( label, M ) {
		var theArray=struct[label];
	    var size = theArray.length;
	    theArray.reverse();
	    Array.prototype.splice.apply(theArray, [0, M - 1].concat(theArray.slice(0, M-1).reverse()));
	    Array.prototype.splice.apply(theArray, [M, size - 1].concat(theArray.slice(M).reverse()));
	    return theArray;
		},

		shuffle : function(label) {
		return d3.shuffle(struct[label]);
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
	}

	var Application = {
		initialize : function() {
			setElementHooks();
			return null;
		},
		renderHeatmap : function() {
			var map = d3.scorch({
				data: struct.data,
				cols : struct.cols,
				rows : struct.rows,
				types : _.object(struct.cols, _.times(dim,function(n) { return 'number'; })),
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