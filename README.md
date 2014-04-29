# ScorcH

[![Build Status](http://nube.systemsbiology.net/github.com/rbkreisberg/scorch/status.svg?branch=master)](http://nube.systemsbiology.net/github.com/rbkreisberg/scorch)

*Scorch* is a heatmap for viewing and manipulating clustered data.

It builds on top of the jDataView and jBinary libraries as a means of compressing large datasets in flight.  The data is then rendered into
a canvas with a queueing system that does not interupt normal browser refreshs.

## Build

```bash
npm install -g grunt-cli bower
npm install
bower install

cd python
./write_heatmap.py
cp heatmap.bin ../app/data
```

The second set of commands creates a false heatmap dataset and places it in the directory where the application can request it.

## Run Example

```bash
grunt serve &
```

## Future Development
* Mouseover selection/partitioning
* Server/Client side clustering
* Context/Focus dual panel display
