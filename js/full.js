const ctx = {
  dataFile: "data/exoplanet.eu_catalog.20230927.csv",
  sampleSize : '*',
  scaleTypeSP : 'linear',
  MIN_YEAR: 1995,
  DETECTION_METHODS_RVPT: ["Radial Velocity", "Primary Transit"],
  DETECTION_METHODS_ALL4: ["Radial Velocity", "Primary Transit",
                      "Microlensing", "Imaging"],
  DM_COLORS: ['#cab2d6', '#fdbf6f', '#b2df8a', '#fb9a99']
}


let createMassScatterPlot = function(scaleType, sampleSize){
    /* scatterplot: planet mass vs. star mass
       showing year of discovery using color,
       sync'ed with line bar chart below (brushing and linking) */
    let vlSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "data": {
            "url": ctx.dataFile,
        },
        "transform": [
            {"filter": {"field": "mass", "gt": 0}},
            {"filter": {"field": "star_mass", "gt": 0}},
            {"filter": {"field": "detection_type",
                        "oneOf": ctx.DETECTION_METHODS_RVPT}},
        ],
        "vconcat": [{
            "selection": {"exopl": {"type": "interval"}},
            "transform": [{"filter": {"selection": "dettype"}}],
            "mark": "point",
            "height": 700,
            "encoding": {
                "x": {
                    "field": "star_mass",
                    "type": "quantitative",
                    "axis":{"title": "Star Mass (M☉)"},
                    "scale": {"type": scaleType}
                },
                "y": {
                    "field": "mass",
                    "type": "quantitative",
                    "axis":{"title": "Mass (Mjup)"},
                    "scale": {"type": scaleType}
                },
                "stroke": {"value": null},
                "size": {"value": 20},
                "shape": {"type": "nominal", "field": "detection_type",
                          "legend": {"title": "Detection Method"}},
                "fill": {
                    "condition": {
                        "selection": "exopl",
                        "field": "discovered",
                        "type": "temporal",
                        "timeUnit": "year",
                        "scale": {
                            // a trick to force a reasonable gradient extent
                            // (should be in [0,1] - this is a pretty unsafe hack)
                            "scheme": {"name":"blues", "extent": [-1,2]},
                        },
                        "legend": {"title": "Year Discovered"}
                    },
                    "value": "lightgray"
                },
                "tooltip": [
                    {"field": "name", "type": "nominal"},
                    {"field": "discovered", "type": "temporal", "timeUnit": "year"}
                ]
            }
        },
        {
            "mark": "bar",
            "encoding":{
                "x": {
                    "aggregate": "count",
                    "type": "quantitative",
                    "axis": {"title": "Count"}
                },
                "y": {
                    "field": "detection_type",
                    "type": "nominal",
                    "axis": {"title": "Detection Method"}
                },
                "color": {
                    "condition": {
                        "selection": "dettype",
                        "field": "detection_type",
                        "type": "nominal",
                        "scale": {"scheme": "dmcolors"},
                        "legend": null // prevent legend from showing in SP above
                    },
                    "value": "lightgray"
                },
            },
            "selection": {"dettype": {"encodings": ["color"], "type": "multi"}},
            "transform": [{"filter": {"selection": "exopl"}}]
        }]
    };
    if (sampleSize != "*"){
        vlSpec["transform"].push({"sample": parseInt(sampleSize)});
    }
    // see options at https://github.com/vega/vega-embed/blob/master/README.md
    let vlOpts = {width:700, height:700, actions:false};
    vegaEmbed("#massScat", vlSpec, vlOpts);
};

let createMagV2DHisto = function(){
    /* 2D histogram in the bottom-right cell,
       showing V-magnitude distribution (binned)
       for each detection_method */
    vlSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "data": {
            "url": ctx.dataFile,
        },
        "transform": [
            {"filter": {"field": "detection_type", "oneOf": ctx.DETECTION_METHODS_ALL4}}
        ],
        "mark": "rect",
        "encoding": {
            "x": {
                "field": "detection_type",
                "type": "nominal",
                "axis": {"title": "Detection Method"}
            },
            "y": {
                "field": "mag_v",
                "type": "quantitative",
                "bin": {"maxbins": 45},
                "axis": {"title": "Magnitude (V band)"}
            },
            "color": {
                "scale": {
                    "scheme":{"name":"greys"}
                },
                "aggregate": "count",
                "type": "quantitative",
                "legend": {"title": "Count"}
            }
        }
    };
    vlOpts = {width:300, height:300, actions:false};
    vegaEmbed("#vmagHist", vlSpec, vlOpts);
};

let createDetectionMethodLinePlot = function(){
    // line plot: planet discovery count vs. year
    vlSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "data": {
            "url": ctx.dataFile,
        },
        "transform": [
            {"filter": {"field": "detection_type", "oneOf": ctx.DETECTION_METHODS_ALL4}},
            {"sort": [{"field": "discovered"}],
             "window": [{"op": "count", "as": "cumulcount"}],
             "frame": [null, 0]}
        ],
        "layer":[
            {
            "mark": "line",
            "encoding": {
                "x": {
                    "field": "discovered",
                    "timeUnit": "year"
                },
                "y": {
                    "field": "cumulcount",
                    "type": "quantitative"
                },
                "color": {"value": "#CCC"}
            },
        },
        {
            "mark": "line",
            "encoding": {
                "x": {
                    "field": "discovered",
                    "type": "temporal",
                    "timeUnit": "year",
                    "axis":{"title": "Year"}
                },
                "y": {
                    "aggregate": "count",
                    "field": "*",
                    "type": "quantitative",
                    "axis":{"title": "Count"}
                },
                "color": {
                    "field": "detection_type",
                    "type": "nominal",
                    "legend": {"title": "Detection Method"},
                    "scale": {
                        "scheme": "dmcolors",
                    },
                },
            },
        }
    ]
    };
    vlOpts = {width:300, height:300, actions:false};
    vegaEmbed("#discPlot", vlSpec, vlOpts);
};

let createViz = function(){
    vega.scheme("dmcolors", ctx.DM_COLORS);
    createMassScatterPlot(ctx.scaleTypeSP, '*');
    createMagV2DHisto();
    createDetectionMethodLinePlot();
};

let handleKeyEvent = function(e){
    if (e.keyCode === 13){
        // enter
        e.preventDefault();
        setSample();
    }
};

let updateScatterPlot = function(){
    createMassScatterPlot(ctx.scaleTypeSP, ctx.sampleSize);
};

let setScaleSP = function(){
    ctx.scaleTypeSP = document.querySelector('#scaleSelSP').value;
    updateScatterPlot();
};

let setSample = function(){
    let sampleVal = document.querySelector('#sampleTf').value;
    if (sampleVal.trim()===''){
        return;
    }
    ctx.sampleSize = sampleVal;
    updateScatterPlot();
};
