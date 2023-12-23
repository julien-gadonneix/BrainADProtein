// usefull constants
const ctx = {
    w: 1100,
    w2: 1394,
    h: 700,
    svgEl: null,
    svgEl2: null,
    svgEl3: null,
    data: null,
    tooltip: null,
    tooltip2: null,
    tooltip3: null,
    selected: null
}

// callback for selection changes in brain part and stage
function handleRadioChange(event) {
    ctx.selected = null;
    if(ctx.svgEl2 != null){
        ctx.svgEl2.remove();
    }
    if(ctx.tooltip2 != null){
        ctx.tooltip2.remove();
    }
    if(ctx.svgEl3 != null){
        ctx.svgEl3.remove();
    }
    if(ctx.tooltip3 != null){
        ctx.tooltip3.remove();
    }
    ctx.svgEl2 = null;
    ctx.tooltip2 = null;
    ctx.svgEl3 = null;
    ctx.tooltip3 = null;
    ctx.svgEl.selectAll("*")
        .transition()
        .duration(300)
        .style("opacity", 0)
        .end()
        .then(() => {
            ctx.svgEl.selectAll("*").remove();
            setTimeout(() => {
                createVizProtein_change();
            }, 100);
    });
};

// first vizualisation
let createViz = function(){
    console.log("Using D3 v"+d3.version);
    ctx.svgEl = d3.select("#main").append("svg");
    ctx.svgEl.attr("width", ctx.w);
    ctx.svgEl.attr("height", ctx.h);
    const radioButtonsPart = document.querySelectorAll('input[name="choice"]');
    const radioButtonsStage = document.querySelectorAll('input[name="choice2"]');
    radioButtonsPart.forEach(button => {
        button.addEventListener('change', handleRadioChange);
    });
    radioButtonsStage.forEach(button => {
        button.addEventListener('change', handleRadioChange);
    });
    ctx.tooltip = d3.select("#brainPartForm")
                    .append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);
    loadData();
};


// create the bar chart
let createVizProtein_change = function(){
    // collect the selections
    var form = document.getElementById("brainPartForm");
    var selectedPart = form.querySelector('input[name="choice"]:checked');
    var selectedStage = form.querySelector('input[name="choice2"]:checked');
    var stage = "log2 FoldChange in " + selectedStage.value + " B/B stages";
    var pvalue = "t.test p-value in " + selectedStage.value + " B/B stages";
    var selectedData = ctx.data[selectedPart.value];
    selectedData.sort((a, b) => parseFloat(a[stage]) - parseFloat(b[stage]));

    // create the svg element with the appropriate sizes
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const innerWidth = ctx.w - margin.left - margin.right;
    const innerHeight = ctx.h - margin.top - margin.bottom;

    const yDomain = d3.extent(selectedData, d => parseFloat(d[stage]));

    const xScale = d3.scaleBand()
      .domain(selectedData.map(d => d["Protein Accession"])) 
      .range([margin.left, innerWidth + margin.left])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain(yDomain)
      .nice()
      .range([innerHeight + margin.top, margin.top]);

    const yAxis = d3.axisLeft(yScale);

    ctx.svgEl.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .attr("opacity", 0)
        .call(yAxis);

    ctx.svgEl.append("text")
        .attr("id", "yAxisLabel")
        .attr("transform", "rotate(-90)")
        .attr("y", 0)
        .attr("x", -ctx.h/2)
        .attr("dy", "1em")
        .attr("opacity", 0)
        .style("text-anchor", "middle")
        .text("log2 Fold Change");

    ctx.svgEl.select("#yAxisLabel")
        .transition()
        .duration(300)
        .attr("opacity", 1);

    ctx.svgEl.select("g")
        .transition()
        .duration(300)
        .attr("opacity", 1);
        
    // create the bars with their functionalities
    ctx.svgEl.selectAll("rect")
        .data(selectedData)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d["Protein Accession"]))
        .attr("y", d => (parseFloat(d[stage]) >= 0) ? yScale(parseFloat(d[stage])) : yScale(0))
        .attr("width", xScale.bandwidth())
        .attr("fill", d => (parseFloat(d[stage]) < 0 ? "red" : "steelblue"))
        .attr("opacity", 0)
        .on("mouseover", function(event, d) {
            d3.select(this).attr("stroke", "green")
                           .attr("stroke-width", 2);
            ctx.tooltip.transition()
              .duration(200)
              .style("opacity", 1);
            ctx.tooltip.html("<br><br><br>Portein hovered: " + d["Protein Accession"] 
                            + "<br>log2 Fold Change: " + d[stage] 
                            + "<br>p-value: "+ d[pvalue])
                        .style("left", event.pageX + "px")
                        .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            d3.select(this).attr("stroke-width", 0);
            ctx.tooltip.transition()
                .duration(1000)
                .style("opacity", 0);
        })
        .on("click", function(event, d) {
            if(ctx.selected != null){
                ctx.selected.attr("fill", (parseFloat(ctx.selected.datum()[stage]) < 0 ? "red" : "steelblue"));
            }
            d3.select(this).attr("fill", "green");
            ctx.selected = d3.select(this);
            proteinViz(event, d, stage, pvalue, selectedPart.value);
            // CohortViz(event, d, selectedPart.value);
        });

    // animate the bars
    ctx.svgEl.selectAll("rect")
        .transition()
        .duration(500)
        .attr("opacity", 1)
        .transition()
        .ease(d3.easeBounceInOut)
        .delay((d,i) => (i*5))
        .attr("height", d => Math.abs(yScale(parseFloat(d[stage])) - yScale(0)));
};

// create the counters for the cohort repartition figures
function createCounter(g, fig){
    return g.append("text")
            .attr("transform", `translate(0,${(fig+1)*ctx.h/2-40})`)
            .style('text-anchor', 'middle')
            .style('fill', '#aaa')
            .text("0");
};

// place the patients on the density plot
function proteinTranslator(gMag, width){
    var xj = -width/2 + Math.random()*width;
    return `translate(${xj},${ctx.yScale(gMag)})`;
};

// circle generator
let circleGen = d3.symbol().type(d3.symbolCircle)
				          .size(12);

// create the density function
function kernelDensityEstimator(kernel, X) {
    return function(V) {
        return X.map(function(x) {
            return [x, d3.mean(V, function(v) { return kernel(x - v); })];
        });
    };
};

function kernelEpanechnikov(k) {
    return function(v) {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
};

// create the density plot
function densityPlot(data, pG, fig){
    let pAScale = d3.scaleLinear()
                    .domain(ctx.yScale.domain())
                    .range(ctx.yScale.range());
    let n = data.length,
            density = kernelDensityEstimator(kernelEpanechnikov(7), pAScale.ticks(50))(data);
    let maxDensity = d3.max(density, (d) => (d[1]));
    let densityScale = d3.scaleLinear()
                            .domain([0, maxDensity])
                            .range([0, (30 - fig*10)*0.8]);
    // remove entries where y=0 to avoid unnecessarily-long tails
    let i = density.length - 1;
    let lastNonZeroBucket = -1;
    while (i>=0){
        // walk array backward, find last entry >0 at index n, keep n+1
        if (density[i][1] > 0){
            lastNonZeroBucket = i;
            break;
        }
        i--;
    }
    if (lastNonZeroBucket != -1){
        density = density.splice(0, lastNonZeroBucket+3);
    }
    // insert a point at 0,0 so that the path fill does not cross the curve
    density.unshift([0,0]);
    // now draw the density curve
    pG.append("path")
        .datum(density)
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("d", d3.line()
                    .curve(d3.curveBasis)
                    .y(function(d) { return pAScale(d[0]); })
                    .x(function(d) { return densityScale(d[1]); }));
    // same thing, mirrored
    pG.append("path")
        .datum(density)
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("d", d3.line()
                    .curve(d3.curveBasis)
                    .y(function(d) { return pAScale(d[0]); })
                    .x(function(d) { return -densityScale(d[1]); }));
};

// display the patients on top of the density plot
function displayRawData(data, patientsG, counter, fig){
    patientsG.append("g").selectAll("path")
                        .data(data)
                        .enter()
                        .append("path")
                        .attr("d", circleGen)
                        .attr("transform", (d) => (proteinTranslator(ctx.pAMax + 200, 30/2)))
                        .attr("fill", "#f41")
                        .attr("opacity", 0.75)
                        .transition()
                        .duration(1000)
                        .ease(d3.easeExpInOut)
                        .delay((d,i) => (500*fig + i*1))
                        .attr("transform", (d) => (proteinTranslator(d, 30/2)))
                        .on("end", function(d,i){counter.text(i+1);});
};

// compute summary statistics for the boxplot
function getSummaryStatistics(data){
    return d3.rollup(data, function(d){
        let q1 = d3.quantile(d.sort(d3.ascending), .25);
        let median = d3.quantile(d.sort(d3.ascending), .5);
        let q3 = d3.quantile(d.sort(d3.ascending), .75);
        let iqr = q3 - q1;
        let min = d3.min(data);
        let max = d3.max(data);
        return({q1: q1, median: median, q3:q3, iqr: iqr, min: min, max: max})
    });
};

// create the boxplot
function boxPlot(data, pG, fig){
    // compute summary stats
    let sumStats = getSummaryStatistics(data);
    // console.log(sumStats);
    // actually draw the boxplot
    pG.append("rect")
      .datum(sumStats)
      .attr("x", -(30 - fig*10)/2)
      .classed("boxplot", true)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("opacity", 0.5)
      .attr("width", 30 - fig*10)
      .attr("y", (d) => (ctx.yScale(d.q3)))
      .attr("height", (d) => (ctx.yScale(d.q1)-ctx.yScale(d.q3)));
    // median
    pG.append("line")
      .datum(sumStats)
      .attr("stroke", "black")
      .attr("opacity", 0.8)
      .attr("x1", -(30 - fig*10)/2)
      .attr("x2", (30 - fig*10)/2)
      .attr("y1", (d) => (ctx.yScale(d.median)))
      .attr("y2", (d) => (ctx.yScale(d.median)));
    // upper whisker
    pG.append("line")
      .datum(sumStats)
      .attr("stroke", "black")
      .attr("opacity", 0.5)
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", (d) => (ctx.yScale(d.q3)))
      .attr("y2", (d) => (ctx.yScale(d.max)));
    pG.append("line")
      .datum(sumStats)
      .attr("stroke", "black")
      .attr("opacity", 0.5)
      .attr("x1", -10)
      .attr("x2", 10)
      .attr("y1", (d) => (ctx.yScale(d.max)))
      .attr("y2", (d) => (ctx.yScale(d.max)));
    // lower whisker
    pG.append("line")
      .datum(sumStats)
      .attr("stroke", "black")
      .attr("opacity", 0.5)
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", (d) => (ctx.yScale(d.q1)))
      .attr("y2", (d) => (ctx.yScale(d.min)));
    pG.append("line")
      .datum(sumStats)
      .attr("stroke", "black")
      .attr("opacity", 0.5)
      .attr("x1", -10)
      .attr("x2", 10)
      .attr("y1", (d) => (ctx.yScale(d.min)))
      .attr("y2", (d) => (ctx.yScale(d.min)));
    pG.selectAll("line")
      .classed("boxplot", true);
};

// plot the patients distribution for a stage
function plotPatientDistribution(stage, values, centerX, fig, count, index){
    let patientsG = d3.select("#svgEl3").append("g")
                            .attr("id", stage + index.toString())
                            .attr("transform", `translate(${centerX + count*ctx.w2/3},0)`);
    // label
    patientsG.append("text")
            .attr("transform", `translate(0,${(fig+1)*ctx.h/2 - 20})`)
            .style("text-anchor", "middle")
            .text(stage);
    // counter (set cardinality)
    let counter = createCounter(patientsG, fig);
    // density plot
    densityPlot(values, patientsG, fig);
    // show raw data points with jitter on top of density plot and boxplot
    displayRawData(values, patientsG, counter, fig);
    // show boxplot
    boxPlot(values, patientsG, fig);
};

// create the visualisation of the cohort repartition
function CohortViz(event, d, idx){
    if(ctx.svgEl3 != null){
        ctx.svgEl3.remove();
    }
    if(ctx.tooltip3 != null){
        ctx.tooltip3.remove();
    }

    let datum = ctx.data[parseFloat(idx)+4]

    // group the data per stage
    var groupedData = datum.slice(1, datum.length).reduce((acc, obj) => {
        if (!acc[obj["Braak Stage"]]) {
            acc[obj["Braak Stage"]] = { total: [] };
        };
        if(obj[d["Protein Accession"]] != ""){
            acc[obj["Braak Stage"]].total.push(parseFloat(obj[d["Protein Accession"]])/1000000);
            acc[obj["Braak Stage"]].count++;
        };
        return acc;
    }, {});
      
    var plots = [];
    for (let key in groupedData) {
        let plot = {};
        plot["key"] = key;
        plot["value"] = groupedData[key].total;
        if(plot["value"].length != 0){
            plots.push(plot);
        };
    }
      
    const order = ["C", "I", "I-II", "II", "II-III", "III", "III-IV", "IV", "IV-V", "V", "V-VI", "VI"];
    const part = ["Entorhinal Cortex", "Temporal Cortex", "Frontal Cortex", "Parahippocampal Cortex"];

    // sort the data per stage
    plots.sort((a, b) => {
        const indexA = order.indexOf(a.key);
        const indexB = order.indexOf(b.key);
        return indexA - indexB;
    });

    ctx.tooltip3 = d3.select("#main").append("div")
                                    .attr("style", "text-align:center")
                                    .attr("class", "tooltip");
    ctx.tooltip3.html("<br><br><br>About the cohort repartition for " + datum[0][d["Protein Accession"]]
                     + "<br>The plots are currently quite sparse but the dataset is meant to increase<br><br>")
                .style("left", event.pageX + "px")
                .style("top", (event.pageY - 28) + "px")
                .style("font-family", "Roboto, sans-serif") 
                .style("font-size", "16px") ;

    const mergedPlots = plots.reduce((acc, obj) => acc.concat(obj.value), []);

    ctx.svgEl3 = d3.select("#main").append("svg");
    ctx.svgEl3.attr("width", ctx.w2);
    ctx.svgEl3.attr("height", ctx.h);
    ctx.svgEl3.attr("id", "svgEl3");

    ctx.pAMax = d3.max(mergedPlots);
    ctx.yScale = d3.scaleLinear().domain([0, ctx.pAMax])
                                 .range([ctx.h/2 - 60, 60]);
    // y-axis
    d3.select("#svgEl3").append("g")
      .attr("transform", `translate(50,0)`)
      .call(d3.axisLeft(ctx.yScale).ticks(10))
      .selectAll("text")
      .style("text-anchor", "end");
    // y-axis label
    d3.select("#svgEl3")
      .append("text")
      .attr("y", 0)
      .attr("x", 0)
      .attr("transform", `rotate(-90) translate(-${ctx.h/4},12)`)
      .classed("axisLb", true)
      .style("text-anchor", "middle")
      .text("Protein abundance (a.u.)");

    ctx.svgEl3.append("text")
            .attr("id", "Title")
            .attr("x", ctx.w2/2)
            .attr("y", 10)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text(part[parseFloat(idx)]);
      
    let fig = 0;

    const element2 = document.getElementById('svgEl3');
    element2.scrollIntoView({ behavior: 'smooth'});

    var allPatientsG = d3.select("#svgEl3").append("g")
                        .attr("id", "ap")
                        .attr("transform", `translate(150,0)`);
    // set cardinality
    let counter = createCounter(allPatientsG, fig);

    // plot the data of all patients
    allPatientsG.append("g").selectAll("path")
                            .data(mergedPlots)
                            .enter()
                            .append("path")
                            .attr("d", circleGen)
                            .attr("transform", (d) => (proteinTranslator(ctx.pAMax + 200, 30)))
                            .attr("fill", "black")
                            .attr("opacity", 0.5)
                            .transition()
                            .duration(1000)
                            .ease(d3.easeExpInOut)
                            .delay((d,i) => (i*.2))
                            .attr("transform", (d) => (proteinTranslator(d, 30)))
                            .on("end", function(d,i){counter.text(i+1);});

    // label
    allPatientsG.append("text")
                .attr("transform", `translate(0,${ctx.h/2 - 20})`)
                .style("text-anchor", "middle")
                .text("Total");

    densityPlot(mergedPlots, allPatientsG, fig);
    boxPlot(mergedPlots, allPatientsG, fig);
    
    // plot the data of each stage
    let xoffset = 150;
    plots.forEach((plot) => {
        let key = plot.key;
        // console.log(key);
        let value = plot.value;
        // console.log(value);
        xoffset += ctx.w2/plots.length - 50;
        plotPatientDistribution(key, value, xoffset, fig, fig, -1);
    });

    // do the same for the other brain parts
    var count = 0;
    ctx.data.slice(4, 8).forEach((brainPartData, index) => {
        if(index != parseFloat(idx)){
            // group the data per stage
            var groupedData = brainPartData.slice(1, brainPartData.length).reduce((acc, obj) => {
                if (!acc[obj["Braak Stage"]]) {
                    acc[obj["Braak Stage"]] = { total: [] };
                };
                if(obj[d["Protein Accession"]] != ""){
                    acc[obj["Braak Stage"]].total.push(parseFloat(obj[d["Protein Accession"]])/1000000);
                    acc[obj["Braak Stage"]].count++;
                }
                return acc;
            }, {});
              
            var plots = [];
            for (let key in groupedData) {
                let plot = {};
                plot["key"] = key;
                plot["value"] = groupedData[key].total;
                if(plot["value"].length != 0){
                    plots.push(plot);
                };
            }

            // sort the data per stage
            plots.sort((a, b) => {
                const indexA = order.indexOf(a.key);
                const indexB = order.indexOf(b.key);
                return indexA - indexB;
            });
        
            const mergedPlots = plots.reduce((acc, obj) => acc.concat(obj.value), []);
        
            ctx.pAMax = d3.max(mergedPlots);
            ctx.yScale = d3.scaleLinear().domain([0, ctx.pAMax])
                                         .range([ctx.h - 60, ctx.h/2 + 60]);
            // y-axis
            d3.select("#svgEl3").append("g")
              .attr("transform", `translate(${50 + count*ctx.w2/3},0)`)
              .call(d3.axisLeft(ctx.yScale).ticks(10))
              .selectAll("text")
              .style("text-anchor", "end");
            // y-axis label
            d3.select("#svgEl3")
              .append("text")
              .attr("y", 0)
              .attr("x", 0)
              .attr("transform", `rotate(-90) translate(-${3*ctx.h/4},${12 + count*ctx.w2/3})`)
              .classed("axisLb", true)
              .style("text-anchor", "middle")
              .text("Protein abundance (a.u.)");

            ctx.svgEl3.append("text")
            .attr("id", "Title" + index.toString())
            .attr("x", (2*count+1)*ctx.w2/6)
            .attr("y", ctx.h/2 + 20)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text(part[parseFloat(index)]);

            let fig = 1;
        
            var allPatientsG = d3.select("#svgEl3").append("g")
                                .attr("id", "ap" + index.toString())
                                .attr("transform", `translate(${65 + count*ctx.w2/3},0)`);
            // set cardinality
            let counter = createCounter(allPatientsG, fig);
        
            // plot the data of all patients
            allPatientsG.append("g").selectAll("path")
                                    .data(mergedPlots)
                                    .enter()
                                    .append("path")
                                    .attr("d", circleGen)
                                    .attr("transform", (d) => (proteinTranslator(ctx.pAMax + 200, 20)))
                                    .attr("fill", "black")
                                    .attr("opacity", 0.5)
                                    .transition()
                                    .duration(1000)
                                    .ease(d3.easeExpInOut)
                                    .delay((d,i) => (500 + i*.2))
                                    .attr("transform", (d) => (proteinTranslator(d, 20)))
                                    .on("end", function(d,i){counter.text(i+1);});
        
            // label
            allPatientsG.append("text")
                        .attr("transform", `translate(0,${ctx.h - 20})`)
                        .style("text-anchor", "middle")
                        .text("Total");

            densityPlot(mergedPlots, allPatientsG, fig);
            boxPlot(mergedPlots, allPatientsG, fig);
            
            // plot the data of each stage
            let xoffset = 68;
            plots.forEach((plot) => {
                let key = plot.key;
                // console.log(key);
                let value = plot.value;
                // console.log(value);
                xoffset += ctx.w2/((plots.length+1)*3)-10;
                plotPatientDistribution(key, value, xoffset, fig, count, index);
            });
            count++;
        };
    });
};

function proteinViz(event, d, stage, pvalue, idx){
    if(ctx.svgEl2 != null){
        ctx.svgEl2.remove();
    }
    if(ctx.tooltip2 != null){
        ctx.tooltip2.remove();
    }

    let datum = ctx.data[parseFloat(idx)+4]

    // group the data per stage
    var groupedData = datum.slice(1, datum.length).reduce((acc, obj) => {
        if (!acc[obj["Braak Stage"]]) {
            acc[obj["Braak Stage"]] = { total: 0, count: 0 };
        }
        if(obj[d["Protein Accession"]] == ""){
            acc[obj["Braak Stage"]].total += 0;
        }
        else{
            acc[obj["Braak Stage"]].total += parseFloat(obj[d["Protein Accession"]]);
        }
        acc[obj["Braak Stage"]].count++;
        return acc;
    }, {});
      
    // collect the means
    var means = [];
    for (let key in groupedData) {
        let mean = {};
        mean["key"] = key;
        mean["value"] = groupedData[key].total / (groupedData[key].count*1000000);
        if(mean["value"] != 0){
            means.push(mean);
        };
    }
      
    const order = ["C", "I", "I-II", "II", "II-III", "III", "III-IV", "IV", "IV-V", "V", "V-VI", "VI"];
    const part = ["Entorhinal Cortex", "Temporal Cortex", "Frontal Cortex", "Parahippocampal Cortex"];

    // sort the data per stage
    means.sort((a, b) => {
        const indexA = order.indexOf(a.key);
        const indexB = order.indexOf(b.key);
        return indexA - indexB;
    });

    ctx.tooltip2 = d3.select("#main").append("div")
                                    .style("width", "100%")
                                    .style("display", "flex")
                                    .style("align-items", "center")
                                    .style("flex-direction", "row")
                                    .attr("class", "tooltip")
                                    .style("margin-bottom", "15px");

    // Add a description of the protein and a button for the cohort information                                
    ctx.tooltip2.html(`
        <div style="text-align: center; padding: 10px; margin-left:800px">
            <p><strong>Protein selected:</strong> ${d["Protein Accession"]}</p>
            <p><strong>log2 Fold Change:</strong> ${d[stage]}</p>
            <p><strong>p-value:</strong> ${d[pvalue]}</p>
            <p><strong>Full protein name:</strong> ${datum[0][d["Protein Accession"]]}</p>
            <button id='myButton'>About the cohort</button>
        </div>`).style("font-family", "Roboto, sans-serif") 
        .style("font-size", "16px");

    var menuOptions = ["C", "II", "IV", "VI"];

    // Append a div for the option to see the brain repartition of the protein (menu and button)
    var controlsDiv = ctx.tooltip2.append("div")
        .style("width", "20%")
        .style("margin-left", "auto")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("align-items", "flex-end")
        .style("background-color", "rgba(92, 175, 248, 0.1)") 
        .style("padding", "10px") 
        .style("border-radius", "5px")
        .style("box-shadow", "0px 0px 5px rgba(0, 0, 0, 0.1)");

    // Add text above the controls
    controlsDiv.append("div")
        .text("Select a stage of the dease and submit to observe the presence of the protein in different parts of the brain for the selected stage of the disease.")
        .style("margin-bottom", "5px")
        .style("font-family", "Roboto, sans-serif") 
        .style("font-size", "16px") 
        .style("color", "#333");

    // Add the menu to choose the stage
    var dropdown = controlsDiv.append("select")
        .attr("id", "myDropdown")
        .style("width", "150px")
        .style("margin-bottom", "10px")
        .style("font-family", "Roboto, sans-serif") 
        .style("font-size", "16px")
        .style("background-color", "rgba(92, 175, 248, 0.8)")
        .style("color", "white"); 

    // Add options to the menu
    dropdown.selectAll("option")
        .data(menuOptions)
        .enter().append("option")
        .text(function (d) { return d; })
        .style("font-family", "Roboto, sans-serif")
        .style("font-size", "16px");
    
    // Hover effect for the menu
    dropdown.on("mouseover", function () {
        dropdown.style("background-color", "rgba(92, 175, 248, 0.6)");
    }).on("mouseout", function () {
        dropdown.style("background-color", "rgba(92, 175, 248, 0.8)");
    });

    // Append a button to the div in order to see the brain 
    var button = controlsDiv.append("button")
        .text("Submit")
        .on("click", function () {
            // Get the selected stage
            let option = dropdown.property("value");
            let tableau = [];
            ctx.data.slice(4, 8).forEach((brainPartData, index) => {
                    // Capture the data for the selected stage about the protein repartition
                    var groupedData = brainPartData.slice(1, brainPartData.length).reduce((acc, obj) => {
                        if (!acc[obj["Braak Stage"]]) {
                            acc[obj["Braak Stage"]] = { total: 0, count: 0 };
                        }
                        if(obj[d["Protein Accession"]] == ""){
                            acc[obj["Braak Stage"]].total += 0;
                        }
                        else{
                            acc[obj["Braak Stage"]].total += parseFloat(obj[d["Protein Accession"]]);
                        }
                        acc[obj["Braak Stage"]].count++;
                        return acc;
                    }, {});
                    var means = [];
                    for (let key in groupedData) {
                        let mean = {};
                        mean["key"] = key;
                        mean["value"] = groupedData[key].total / (groupedData[key].count*1000000);
                        if(mean["value"] != 0){
                            means.push(mean);
                        };
                    }

                    means.sort((a, b) => {
                        const indexA = order.indexOf(a.key);
                        const indexB = order.indexOf(b.key);
                        return indexA - indexB;
                    });

                for (let i = 0; i < means.length; i++) {
                    if (means[i]["key"] === option) {tableau.push(means[i]["value"])}
                }
            });
            // Call the function with the selected protein repartition to see the brain
            runPythonScript(tableau);
            button.style("background-color", "rgba(92, 175, 248, 0.4)");
            setTimeout(function () {
                button.style("background-color", "rgba(92, 175, 248, 0.8)");
            }, 300);
        })
        button.style("background-color", "rgba(92, 175, 248, 0.8)")
            .style("color", "white")
            .style("padding", "10px 20px")
            .style("border", "none")
            .style("border-radius", "5px")
            .style("cursor", "pointer")
            .style("width", "150px")
            .style("margin-bottom", "10px");

        // Hover effect
        button.on("mouseover", function () {
            button.style("background-color", "rgba(92, 175, 248, 0.6)");
        }).on("mouseout", function () {
            button.style("background-color", "rgba(92, 175, 248, 0.8)");
        });
    
        d3.select('#myButton')
            .style("background-color", "rgba(92, 175, 248, 0.8)")
            .style("color", "white")
            .style("padding", "10px 20px")
            .style("border", "none")
            .style("border-radius", "5px")
            .style("cursor", "pointer")
            .style("width", "150px")
            .style("margin-bottom", "10px")
            .style("margin-left", "auto")
        
        d3.select('#myButton').on("mouseover", function () {
            d3.select('#myButton').style("background-color", "rgba(92, 175, 248, 0.6)");
        }).on("mouseout", function () {
            d3.select('#myButton').style("background-color", "rgba(92, 175, 248, 0.8)");
        });
    
    // the button for the cohort information
    document.getElementById('myButton').addEventListener('click', function() {
        CohortViz(event, d, idx);
    });

    // create the svg element with the appropriate sizes
    ctx.svgEl2 = d3.select("#main").append("svg");
    ctx.svgEl2.attr("width", ctx.w2);
    ctx.svgEl2.attr("height", ctx.h);
    ctx.svgEl2.attr("id", "svgEl2");

    var margin = { top: 30, right: 20, bottom: 40, left: 50 };
    var innerWidth = ctx.w2 - margin.left - margin.right;
    var innerHeight = ctx.h/2 - margin.top - margin.bottom;

    var xScale = d3.scaleBand()
                    .domain(order) 
                    .range([margin.left, innerWidth + margin.left])
                    .paddingInner(1.0);

    var yScale = d3.scaleLinear()
                    .domain(d3.extent(means, d => d.value))
                    .nice()
                    .range([innerHeight + margin.top, margin.top]);

    var xAxis = d3.axisBottom(xScale);
    var yAxis = d3.axisLeft(yScale);

    ctx.svgEl2.append("text")
            .attr("id", "yAxisLabel")
            .attr("transform", "rotate(-90)")
            .attr("y", 0)
            .attr("x", -ctx.h/4)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Protein abundance (a.u.)");

    ctx.svgEl2.append("text")
            .attr("id", "xAxisLabel")
            .attr("y", ctx.h/2 - margin.bottom + 20)
            .attr("x", ctx.w2/2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Braak Stage");
    
    ctx.svgEl2.append("text")
            .attr("id", "Title")
            .attr("x", ctx.w2/2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text(part[parseFloat(idx)]);

    ctx.svgEl2.append("g")
        .attr("transform", `translate(0,${ctx.h/2 - margin.bottom})`)
        .call(xAxis);

    ctx.svgEl2.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(yAxis);

    const element = document.getElementById('svgEl2');
    element.scrollIntoView({ behavior: 'smooth'});
    
    // draw the curve
    var line = d3.line()
                    .x(d1 => xScale(d1.key))
                    .y(innerHeight + margin.top);

    ctx.svgEl2.append("path")
            .attr("id", "line")
            .datum(means)
            .attr("fill", "none")
            .attr("stroke", "green")
            .attr("stroke-width", 2)
            .attr("d", line);

    ctx.svgEl2.select("#line")
            .transition()
            .duration(1000)
            .attr("d", d3.line()
                        .x(d1 => xScale(d1.key))
                        .y(d1 => yScale(d1.value)));

    // do the same for the other brain parts
    var count = 0;
    ctx.data.slice(4, 8).forEach((brainPartData, index) => {
        if(index != parseFloat(idx)){
            // group the data per stage
            var groupedData = brainPartData.slice(1, brainPartData.length).reduce((acc, obj) => {
                if (!acc[obj["Braak Stage"]]) {
                    acc[obj["Braak Stage"]] = { total: 0, count: 0 };
                }
                if(obj[d["Protein Accession"]] == ""){
                    acc[obj["Braak Stage"]].total += 0;
                }
                else{
                    acc[obj["Braak Stage"]].total += parseFloat(obj[d["Protein Accession"]]);
                }
                acc[obj["Braak Stage"]].count++;
                return acc;
            }, {});
            
            // collect the means
            var means = [];
            for (let key in groupedData) {
                let mean = {};
                mean["key"] = key;
                mean["value"] = groupedData[key].total / (groupedData[key].count*1000000);
                if(mean["value"] != 0){
                    means.push(mean);
                };
            }
            
            // sort the data per stage
            means.sort((a, b) => {
                const indexA = order.indexOf(a.key);
                const indexB = order.indexOf(b.key);
                return indexA - indexB;
            });
            
            // define the proper dimensions
            var margin = { top: 30, right: 20, bottom: 40, left: 50 };
            var innerWidth = ctx.w2/3 - margin.left - margin.right;
            var innerHeight = ctx.h/2 - margin.top - margin.bottom;

            var xScale = d3.scaleBand()
                            .domain(order) 
                            .range([margin.left + count*ctx.w2/3, count*ctx.w2/3 + innerWidth + margin.left])
                            .paddingInner(1.0);

            var yScale = d3.scaleLinear()
                            .domain(d3.extent(means, d => d.value))
                            .nice()
                            .range([ctx.h/2 + innerHeight + margin.top, ctx.h/2 + margin.top]);

            var xAxis = d3.axisBottom(xScale);
            var yAxis = d3.axisLeft(yScale);

            ctx.svgEl2.append("text")
                    .attr("id", "yAxisLabel" + index.toString())
                    .attr("transform", "rotate(-90)")
                    .attr("y", count*ctx.w2/3)
                    .attr("x", -3*ctx.h/4)
                    .attr("dy", "1em")
                    .style("text-anchor", "middle")
                    .text("Protein abundance (a.u.)");

            ctx.svgEl2.append("text")
                    .attr("id", "xAxisLabel" + index.toString())
                    .attr("y", ctx.h - margin.bottom + 20)
                    .attr("x", (2*count+1)*ctx.w2/6)
                    .attr("dy", "1em")
                    .style("text-anchor", "middle")
                    .text("Braak Stage");

            ctx.svgEl2.append("text")
                    .attr("id", "xAxisLabel" + index.toString())
                    .attr("y", ctx.h/2)
                    .attr("x", (2*count+1)*ctx.w2/6)
                    .attr("dy", "1em")
                    .style("text-anchor", "middle")
                    .text(part[index]);

            ctx.svgEl2.append("g")
                .attr("transform", `translate(0,${ctx.h - margin.bottom})`)
                .call(xAxis);

            ctx.svgEl2.append("g")
                .attr("transform", `translate(${margin.left + count*ctx.w2/3},0)`)
                .call(yAxis);
            
            // draw the curve
            var line = d3.line()
                            .x(d1 => xScale(d1.key))
                            .y(ctx.h/2 + innerHeight + margin.top);

            ctx.svgEl2.append("path")
                    .attr("id", "line" + index.toString())
                    .datum(means)
                    .attr("fill", "none")
                    .attr("stroke", "green")
                    .attr("stroke-width", 2)
                    .attr("d", line);

            ctx.svgEl2.select("#line" + index.toString())
                    .transition()
                    .duration(1000)
                    .delay(500)
                    .attr("d", d3.line()
                                .x(d1 => xScale(d1.key))
                                .y(d1 => yScale(d1.value)));
            count++;
        };
    });
};
 
// load the data
function loadData(){
    Promise.all([d3.csv("data/EC_DEP.csv"),
                d3.csv("data/TC_DEP.csv"),
                d3.csv("data/PHC_DEP.csv"),
                d3.csv("data/FC_DEP.csv"),
                d3.csv("data/ProteinsPatientsTC.csv"),
                d3.csv("data/ProteinsPatientsFC.csv"),
                d3.csv("data/ProteinsPatientsEC.csv"),
                d3.csv("data/ProteinsPatientsPHC.csv"),
                d3.csv("data/PRIDEdataUploadInfo.csv")]).then(function(data){
                    data.slice(4, 8).forEach(brainPart => {
                        brainPart.forEach((patient, index) => {
                            if(index != 0){
                                // collect information on the patients
                                let row = data[8].find(pat => pat["Sample code in PD search results"] == patient[""]);
                                patient.Age = row.Age;
                                patient.Sex = row.Sex;
                                patient["Braak Stage"] = row["Braak stage"];
                            };
                        });
                    });
                    ctx.data = data;
                    createVizProtein_change();
                }).catch(function(error){console.log(error)});
}

function runPythonScript(tableau) {
    //run a python script with the data in a json 
    var xhr = new XMLHttpRequest();
    var data = {
        key1: tableau
    };
    
    alert("Wait for an HTML page to open, and you will be able to observe the presence of the protein in different parts of the brain for the selected stage of the disease.");

    xhr.open('POST', 'http://127.0.0.1:5000/run_python_script', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.send(JSON.stringify(data));
}