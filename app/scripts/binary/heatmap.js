define([
	'jBinary', 'jDataView'
], function(jBinary, jDataView) {

Heatmap = {
	'jBinary.littleEndian': true,
	'jBinary.mimeType': 'application/octet-stream',

	Dimensions: {
		cols: 'uint32',
		rows: 'uint32'
	},

	FeatureRow: jBinary.Template({

		setParams: function (header) {
			var itemType;

			switch (header.dataType) {
				case 0:  //float32
					itemType = 'float32';
					break;
				case 1:  //uint32
					itemType = 'uint32';
					break;
				case 2: //null terminated string
					itemType = 'string0'
					break;
			
				default:
					throw new TypeError('Sorry, but ' + header.dataType + ' type arrays are not supported.');
			}

			this.baseType = ['array', itemType, header.size.cols];
			this.dataOffset = header.dataOffset;
		},

		read: function () {
			var values = this.baseRead();	
			return values;
		}
	}),

	Matrix: {
		// full file Dimensions
		fileSize: 'uint32',
		// reserved
		reserved: 'uint32',
		// offset of matrix data
		dataOffset: 'uint32',
		// image dimensions
		size: 'Dimensions',
		// color depth (bits per pixel)
		dataType: 'uint16',
		// Dimensions of bitmap data
		dataSize: 'uint32',
		FeatureData: jBinary.Type({
			read: function (header) {

				return this.binary.seek(header.dataOffset, function () {
					var width = header.size.cols, height = header.size.rows;
					var data = new Array(height);
					var writeMethod;
					switch (header.dataType) {
						case 0:  //float32
							writeMethod = 'writeFloat32';
							break;
						case 1:  //uint32
							writeMethod = 'writeUInt32';
							break;
						case 2: //null terminated string
							writeMethod = 'writeString';
							break;
						}
					var FeatureRow = this.getType(['FeatureRow', header]);
					for (var y = 0; y < height-1; y++) {
						var values = this.read(FeatureRow);
						data[y] = values;
					}
					return data;
				});
			}
		})
	}
};

return {
	loadData : function(url, callback) {
		jBinary.load(url, Heatmap, function (error, binary) {
		  if (error) {
		    return console.log(error);
		  }

		  // here TAR format is auto-detected and used by `binary`
		  var data = binary.read('Matrix');
		  callback(error, data);
		});
	}
};

});