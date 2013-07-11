define([
], function(){

d3.scorch = function(config) {
  var __ = {
    data: [],
    rows: [],
    cols: [],
    types: {},
    brushed: false,
    mode: "default",
    rate: 20,
    width: 600,
    height: 300,
    margin: { top: 24, right: 0, bottom: 12, left: 0 },
    color: d3.scale.linear().domain([0,1]).range(['lightyellow','lightblue']),
    composite: "source-over",
    alpha: 0.7
  };

  extend(__, config);
var sc = function(selection) {
  selection = sc.selection = d3.select(selection);
  selection.classed('scorch', true)

  __.width = selection[0][0].clientWidth;
  __.height = selection[0][0].clientHeight;

  // canvas data layers
  ["shadows", "marks", "foreground", "highlight"].forEach(function(layer) {
    canvas[layer] = selection
      .append("canvas")
      .attr("class", layer)[0][0];
    ctx[layer] = canvas[layer].getContext("2d");
  });

  // svg tick and brush layers
  sc.svg = selection
    .append("svg")
      .attr("width", __.width)
      .attr("height", __.height)
    .append("svg:g")
      .attr("transform", "translate(" + __.margin.left + "," + __.margin.top + ")");

  return sc;
};
var events = d3.dispatch.apply(this,["render", "resize", "highlight", "brush"].concat(d3.keys(__))),
    w = function() { return __.width - __.margin.right - __.margin.left; },
    h = function() { return __.height - __.margin.top - __.margin.bottom },
    flags = {
      brushable: false,
      reorderable: false,
      axes: false,
      interactive: false,
      shadows: false,
      debug: false
    },
    xscale = d3.scale.ordinal(),
    yscale = d3.scale.ordinal(),
    dragging = {},
    line = d3.svg.line(),
    axis = d3.svg.axis().orient("left").ticks(5),
    g, // groups for axes, brushes
    ctx = {},
    canvas = {};

var rectWidth = w() / __.cols.length,
  rectHeight = h() / __.data.length;

// side effects for setters
var side_effects = d3.dispatch.apply(this,d3.keys(__))
  .on("composite", function(d) { ctx.foreground.globalCompositeOperation = d.value; })
  .on("alpha", function(d) { ctx.foreground.globalAlpha = d.value; })
  .on("width", function(d) { sc.resize(); })
  .on("height", function(d) { sc.resize(); })
  .on("margin", function(d) { sc.resize(); })
  .on("rate", function(d) { rqueue.rate(d.value); })
  .on("data", function(d) {
    if (flags.shadows) paths(__.data, ctx.shadows);
  })
  .on("rows", function(d) {
    yscale.domain(__.rows);
    if (flags.interactive) sc.render.updateAxes();
  })
  .on("cols", function(d) {
    xscale.domain(__.cols);
    if (flags.interactive) sc.render().updateAxes();
  });

// expose the state of the chart
sc.state = __;
sc.flags = flags;

// create getter/setters
getset(sc, __, events);

// expose events
d3.rebind(sc, events, "on");

// getter/setter with event firing
function getset(obj,state,events)  {
  d3.keys(state).forEach(function(key) {
    obj[key] = function(x) {
      if (!arguments.length) return state[key];
      var old = state[key];
      state[key] = x;
      side_effects[key].call(sc,{"value": x, "previous": old});
      events[key].call(sc,{"value": x, "previous": old});
      return obj;
    };
  });
};

function extend(target, source) {
  for (key in source) {
    target[key] = source[key];
  }
  return target;
};
sc.autoscale = function() {
  // colorScale
  var defaultScales = {
    "number": function(k) {
      return d3.scale.linear()
        .domain(d3.extent(__.data, function(d) { return +d[k]; }));
    },
    "string": function(k) {
      return d3.scale.ordinal()
        .domain(__.data.map(function(p) { return p[k]; }))
    }
  };

  //colorScale = defaultScales[__.types[k]](k).range(__.color.range());

  // xscale
  xscale.domain(__.cols).rangePoints([0, w()], 1);
  // yscale
  yscale.domain(_.pluck(__.data,'id')).rangePoints([h(), 0], 1);

  // canvas sizes
  sc.selection.selectAll("canvas")
      .style("margin-top", __.margin.top + "px")
      .style("margin-left", __.margin.left + "px")
      .attr("width", w()+2)
      .attr("height", h()+2)

  // default styles, needs to be set when canvas width changes
  ctx.foreground.strokeStyle = __.color;
  ctx.foreground.lineWidth = 1.4;
  ctx.foreground.globalCompositeOperation = __.composite;
  ctx.foreground.globalAlpha = __.alpha;
  ctx.highlight.lineWidth = 3;
  ctx.shadows.strokeStyle = "#dadada";

  return this;
};
sc.detectcols = function() {
  sc.types(sc.detectDimensionTypes(__.data));
  sc.cols(d3.keys(sc.types()));
  return this;
};

// a better "typeof" from this post: http://stackoverflow.com/questions/7390426/better-way-to-get-type-of-a-javascript-variable
sc.toType = function(v) {
  return ({}).toString.call(v).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
};

// try to coerce to number before returning type
sc.toTypeCoerceNumbers = function(v) {
  if ((parseFloat(v) == v) && (v != null)) return "number";
  return sc.toType(v);
};

// attempt to determine types of each dimension based on first row of data
sc.detectDimensionTypes = function(data) {
  var types = {}
  d3.keys(data[0])
    .forEach(function(col) {
      types[col] = sc.toTypeCoerceNumbers(data[0][col]);
    });
  return types;
};
sc.render = function() {
  // try to autodetect cols and create scales
  if (!__.cols.length) sc.detectcols();
  if (!(__.cols[0] in yscale)) sc.autoscale();

  sc.render[__.mode]();

  events.render.call(this);
  return this;
};

sc.render.default = function() {
  sc.clear('foreground');
  if (__.brushed) {
    __.brushed.forEach(rect_foreground);
  } else {
    __.data.forEach(row_foreground);
  }
};

var rqueue = d3.renderQueue(row_foreground)
  .rate(50)
  .clear(function() { sc.clear('foreground'); });

sc.render.queue = function() {
  if (__.brushed) {
    rqueue(__.brushed);
  } else {
    rqueue(__.data);
  }
};
sc.shadows = function() {
  flags.shadows = true;
  if (__.data.length > 0) paths(__.data, ctx.shadows);
  return this;
};

// draw single rect
function color_rect(d, col, ctx) {
  ctx.fillStyle = d3.functor(__.color)(d[col]).toString();
  ctx.rect(position(col),yscale(d['id']),rectWidth, rectHeight);
  ctx.fill();
};

function rect_foreground(d, col) {
  return color_rect(d, col, ctx.foreground);
};

function rect_highlight(d, col) {
  return color_rect(d, col, ctx.highlight);
};

function row_foreground(d) {
  var r = function(c) { rect_foreground(d,c); };
  __.cols.forEach(r);
}

function row_highlight(d) {
  var r = function(c) { rect_highlight(d,c); };
  __.cols.forEach(r);
}

sc.clear = function(layer) {
  ctx[layer].clearRect(0,0,w()+2,h()+2);
  return this;
};
sc.createAxes = function() {
  if (g) sc.removeAxes();

  // Add a group element for each dimension.
  g = sc.svg.append("svg:g")
      .attr("class", "y-axis")
      .attr("transform", "translate(0,0)")
      .call(axis.scale(yscale));

  flags.axes= true;
  return this;
};

sc.removeAxes = function() {
  g.remove();
  return this;
};

sc.updateAxes = function() {
  var g_data = sc.svg.select(".y-axis")

  g_data.enter().append("svg:g")
      .attr("class", "y-axis")
      .attr("transform", "translate(0,0)")
      .style("opacity", 0)
      .call(axis.scale(yscale))
    .append("svg:text")
      .attr({
        "text-anchor": "middle",
        "y": 0,
        "transform": "translate(0,-12)",
        "x": 0,
        "class": "label"
      })
      .text(String);

  g_data.exit().remove();

  g = sc.svg.selectAll(".y-axis");

  g.transition().duration(1100)
    .attr("transform", function(p) { return "translate(" + position(p) + ")"; })
    .style("opacity", 1)
  if (flags.shadows) paths(__.data, ctx.shadows);
  return this;
};

sc.brushable = function() {
  if (!g) sc.createAxes();

  // Add and store a brush for each axis.
  g.append("svg:g")
      .attr("class", "brush")
      .call(function() {
        d3.select(this).call(
          yscale.brush = d3.svg.brush()
            .y(yscale)
            .on("brush", sc.brush)
        );
      })
    .selectAll("rect")
      .style("visibility", null)
      .attr("x", -15)
      .attr("width", 30)
  flags.brushable = true;
  return this;
};

// Jason Davies, http://bl.ocks.org/1341281
sc.reorderable = function() {
  if (!g) sc.createAxes();

  g.style("cursor", "move")
    .call(d3.behavior.drag()
      .on("dragstart", function(d) {
        dragging[d] = this.__origin__ = xscale(d);
      })
      .on("drag", function(d) {
        dragging[d] = Math.min(w(), Math.max(0, this.__origin__ += d3.event.dx));
        __.cols.sort(function(a, b) { return position(a) - position(b); });
        xscale.domain(__.cols);
        sc.render();
        g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
      })
      .on("dragend", function(d) {
        delete this.__origin__;
        delete dragging[d];
        d3.select(this).transition().attr("transform", "translate(" + xscale(d) + ")");
        sc.render();
      }));
  flags.reorderable = true;
  return this;
};

// pairs of adjacent cols
sc.adjacent_pairs = function(arr) {
  var ret = [];
  for (var i = 0; i < arr.length-1; i++) {
    ret.push([arr[i],arr[i+1]]);
  };
  return ret;
};
sc.interactive = function() {
  flags.interactive = true;
  return this;
};

// Get data within brushes
sc.brush = function() {
  __.brushed = selected();
  events.brush.call(sc,__.brushed);
  sc.render();
};

// expose a few objects
sc.xscale = xscale;
sc.yscale = yscale;
sc.ctx = ctx;
sc.canvas = canvas;
sc.g = function() { return g; };

// TODO
sc.brushReset = function(dimension) {
  yscale.brush.clear()(
    sc.g()
      .filter(function(p) {
        return dimension == p;
      })
  )
  return this;
};

// rescale for height, width and margins
// TODO currently assumes chart is brushable, and destroys old brushes
sc.resize = function() {
  // selection size
  sc.selection.select("svg")
    .attr("width", __.width)
    .attr("height", __.height)
  sc.svg.attr("transform", "translate(" + __.margin.left + "," + __.margin.top + ")");

  // scales
  sc.autoscale();

  // axes, destroys old brushes. the current brush state should pass through in the future
  if (g) sc.createAxes().brushable();

  events.resize.call(this, {width: __.width, height: __.height, margin: __.margin});
  return this;
};

// highlight an array of data
sc.highlight = function(data) {
  sc.clear("highlight");
  d3.select(canvas.foreground).classed("faded", true);
  data.forEach(rect_highlight);
  events.highlight.call(this,data);
  return this;
};

// clear highlighting
sc.unhighlight = function(data) {
  sc.clear("highlight");
  d3.select(canvas.foreground).classed("faded", false);
  return this;
};

// calculate 2d intersection of line a->b with line c->d
// points are objects with x and y properties
sc.intersection =  function(a, b, c, d) {
  return {
    x: ((a.x * b.y - a.y * b.x) * (c.x - d.x) - (a.x - b.x) * (c.x * d.y - c.y * d.x)) / ((a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x)),
    y: ((a.x * b.y - a.y * b.x) * (c.y - d.y) - (a.y - b.y) * (c.x * d.y - c.y * d.x)) / ((a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x))
  };
};

function is_brushed(p) {
  return !yscale.brush.empty();
};

// data within extents
function selected() {
  var actives = __.cols.filter(is_brushed),
      extents = actives.map(function(p) { return yscale.brush.extent(); });

  // test if within range
  var within = {
    "number": function(d,p,dimension) {
      return extents[dimension][0] <= d[p] && d[p] <= extents[dimension][1]
    },
    "string": function(d,p,dimension) {
      return extents[dimension][0] <= yscale(d[p]) && yscale(d[p]) <= extents[dimension][1]
    }
  };

  return __.data
    .filter(function(d) {
      return actives.every(function(p, dimension) {
        return within[__.types[p]](d,p,dimension);
      });
    });
};

function position(d) {
  var v = dragging[d];
  return v == null ? xscale(d) : v;
}
  sc.toString = function() { return "Matrix size: " + __.data.length + " rows, " + __.cols.length + " columns)"};
  
  sc.version = "0.0.1";

  return sc;
};

d3.renderQueue = (function(func) {
  var _queue = [],                  // data to be rendered
      _rate = 10,                   // number of calls per frame
      _clear = function() {},       // clearing function
      _i = 0;                       // current iteration

  var rq = function(data) {
    if (data) rq.data(data);
    rq.invalidate();
    _clear();
    rq.render();
  };

  rq.render = function() {
    _i = 0;
    var valid = true;
    rq.invalidate = function() { valid = false; };

    function doFrame() {
      if (!valid) return false;
      if (_i > _queue.length) return false;
      var chunk = _queue.slice(_i,_i+_rate);
      _i += _rate;
      chunk.map(func);
      d3.timer(doFrame);
    }

    doFrame();
  };

  rq.data = function(data) {
    rq.invalidate();
    _queue = data.slice(0);
    return rq;
  };

  rq.rate = function(value) {
    if (!arguments.length) return _rate;
    _rate = value;
    return rq;
  };

  rq.remaining = function() {
    return _queue.length - _i;
  };

  // clear the canvas
  rq.clear = function(func) {
    if (!arguments.length) {
      _clear();
      return rq;
    }
    _clear = func;
    return rq;
  };

  rq.invalidate = function() {};

  return rq;
});

});