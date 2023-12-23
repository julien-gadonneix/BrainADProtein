// usefull constants
const ctx = {
    w: 900,
    h: 720,
    hmargin: 20,
    vmargin: 10,
    svgEl: null,
    data : null
}

// callback for selection changes in brain part and stage
function handleRadioChange(svgEl) {
    ctx.svgEl.selectAll("*")
        .transition()
        .duration(500)
        .style("opacity", 0)
        .end()
        .then(() => {
            ctx.svgEl.selectAll("*").remove();
            setTimeout(() => {
                createVizDataset();
            }, 100);
    });
};

// first vizualisation
let createViz = function(){
    console.log("Using D3 v"+d3.version);
    let svgEl = d3.select("#main").append("svg");
    ctx.svgEl = svgEl;
    const checkboxes = document.querySelectorAll('input[name="choice2"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateCheckedValues);
    });
    const radioButtonsPart = document.querySelectorAll('input[name="choice"]');
    radioButtonsPart.forEach(button => {
        button.addEventListener('change', handleRadioChange);
    });
    loadData(svgEl);
};

// create the bar chart
let createVizDataset = function(){
    // collect the selections
    var form = document.getElementById("brainPartForm");
    var selectedPart = form.querySelector('input[name="choice"]:checked').value;
    var checkedCheckboxes =  Array.from(document.querySelectorAll('input[name="choice2"]'))
                .filter(checkbox => checkbox.checked)
                .map(checkbox => parseFloat(checkbox.value));
    var selectedData = ctx.data.filter(item => item["Brain region"] === selectedPart);
    var reselectedData = selectedData.filter(item => valCheckboxes(checkedCheckboxes).includes(item["Braak stage"]));
    
    const countsmen = [];
    const countswomen = [];
    checkedCheckboxes.forEach(stage => {
        countsmen.push(reselectedData.filter(d=>valCheckbox(stage).includes(d["Braak stage"])&&d["Sex"]==="male").length);
        countswomen.push(reselectedData.filter(d=>valCheckbox(stage).includes(d["Braak stage"])&&d["Sex"]==="female").length);
    });

    const max = Math.max(d3.max(countsmen), d3.max(countswomen));

    const width = 400;
    const height = 550;
    const barWidth = width / checkedCheckboxes.length;

    // create the svg element with the appropriate sizes
    ctx.svgEl.attr('width', 3*width)
             .attr('height', 2.5*height)
             .attr('opacity',0);
    
    
    //Creation of the patients/stage graphics
    const subSvg1X = (ctx.svgEl.attr('width') / 4) - ((width+100) / 2);


    const subsvg1 = ctx.svgEl.append('svg')
        .attr('width', width+100)
        .attr('height', height+100)
        .attr('x', subSvg1X)
        .attr('y', 20);  
    
    subsvg1.selectAll('.rect-men')
        .data(countsmen)
        .enter().append('rect')
        .attr('x', (d, i) => 32+i * barWidth + i*10)
        .attr('y', d => height - d * ((height-50)/max) - 31) 
        .attr('width', barWidth/2 - 1)
        .attr('height', 0) 
        .attr('fill', 'steelblue')
        .transition()
        .attr('height', d =>3+ d * ((height-50)/max))
        .duration(1000);

    subsvg1.selectAll('.rect-women')
        .data(countswomen)
        .enter().append('rect')
        .attr('x', (d, i) => 32+i * barWidth + i*10 + barWidth/2)
        .attr('y', d => height - d * ((height-50)/max) - 31) 
        .attr('width', barWidth/2 - 1)
        .attr('height', 0) 
        .attr('fill', 'pink')
        .transition()
        .attr('height', d =>3+ d * ((height-50)/max))
        .duration(1000);

    subsvg1.selectAll('text')
        .data(checkedCheckboxes)
        .enter().append('text')
        .attr('x', (d, i) => 32+i * barWidth + i*10 + barWidth / 2)
        .attr('y', height - 5)
        .attr('text-anchor', 'middle')
        .text(function (d) {if (d === 0) {return 'Control'} else {return 'Stage ' + d}});
             
    subsvg1.selectAll('text.bar-value-men')
        .data(countsmen)
        .enter().append('text')
        .attr('x', (d, i) => 32+i * barWidth + i*10 + barWidth / 4)
        .attr('y', d => height - d * ((height-50)/max) - 35) 
        .attr('text-anchor', 'middle')
        .attr('class', 'bar-value')  
        .text(d => d);

    subsvg1.selectAll('text.bar-value-women')
        .data(countswomen)
        .enter().append('text')
        .attr('x', (d, i) => 32+i * barWidth +i*10 + 3*barWidth / 4)
        .attr('y', d => height - d * ((height-50)/max) - 35) 
        .attr('text-anchor', 'middle')
        .attr('class', 'bar-value')  
        .text(d => d);
    
    subsvg1.selectAll('text.legend')
        .data(checkedCheckboxes)
        .enter().append('text')
        .attr('x', width/2 + 50)
        .attr('y', height + 50)
        .attr('text-anchor', 'middle')
        .text("Number of patients depending on the gender and the stage of Alzheimer");    
    
    subsvg1.append('g')
        .attr('transform', `translate(0, ${height-28})`)
        .call(d3.axisBottom(d3.scaleLinear().domain([0, checkedCheckboxes.length]).range([32, width+32 + checkedCheckboxes.length*10])).tickValues([]));
        
    subsvg1.append('g')
        .attr('transform', `translate(30,0)`)
        .call(d3.axisLeft().scale(d3.scaleLinear().domain([0, max]).range([height-28 , 20])));

    //Creation of the patient/age graphics

    const ages = rangeage(reselectedData);
    const countsmen2 = [];
    const countswomen2 = [];
    ages.forEach(age => {
            countsmen2.push(reselectedData.filter(d=>age<=parseFloat(d["Age"])&&parseFloat(d["Age"])<=age+10&&d["Sex"]==="male").length)
            countswomen2.push(reselectedData.filter(d=>age<=parseFloat(d["Age"])&&parseFloat(d["Age"])<=age+10&&d["Sex"]==="female").length)
        })
    
    const max2 = Math.max(d3.max(countsmen2), d3.max(countswomen2));
    
    const subSvg2X = (ctx.svgEl.attr('width') / 2) + (ctx.svgEl.attr('width') / 4) - ((width+220) / 2);

    const barHeight = (height-50)/(ages.length);
    
    const subsvg2 = ctx.svgEl.append('svg')
        .attr('width', width+200)
        .attr('height', height+100)
        .attr('x', subSvg2X)
        .attr('y', 20);  
    
    subsvg2.append('g')
        .attr('transform', `translate(${(width+110)/2},0)`)
        .call(d3.axisLeft().scale(d3.scaleLinear().domain([0, max2]).range([height-28 , 20])).tickValues([]));
    
    subsvg2.append('g')
        .attr('transform', `translate(${(width+290)/2},0)`)
        .call(d3.axisRight().scale(d3.scaleLinear().domain([0, max2]).range([height-28 , 20])).tickValues([]));
    
    subsvg2.selectAll('.rect-men')
        .data(countsmen2)
        .enter().append('rect')
        .attr('x', (d) => width/2 + 50-d*((width-180)/max2))
        .attr('y', (d,i) => i*(barHeight)+ 25) 
        .attr('width', 0) 
        .attr('height', barHeight-5) 
        .attr('fill', 'steelblue')
        .transition()
        .attr('width', (d) =>3+ d*((width-180)/max2))
        .duration(1000);

    subsvg2.selectAll('.rect-women')
        .data(countswomen2)
        .enter().append('rect')
        .attr('x', (d) => width/2 + 148)
        .attr('y', (d,i) => i*(barHeight)+ 25) 
        .attr('width', 0) 
        .attr('height', barHeight-5) 
        .attr('fill', 'pink')
        .transition()
        .attr('width', (d) => 3+d*((width-180)/max2))
        .duration(1000);
    
    subsvg2.selectAll('text')
        .data(ages)
        .enter().append('text')
        .attr('x', (width+200)/2)
        .attr('y', (d,i) => 25 + i*(barHeight) + barHeight/2)
        .attr('text-anchor', 'middle')
        .text(function (d) {return d + "-" + (d+10) + " years"});

    subsvg2.selectAll('text.bar-value-men')
        .data(countsmen2)
        .enter().append('text')
        .attr('x', (d) => width/2 + 43-d*((width-180)/max2))
        .attr('y', (d,i) => 25 + i*(barHeight) + barHeight/2) 
        .attr('text-anchor', 'middle')
        .attr('class', 'bar-value')  
        .text(d => d);

    subsvg2.selectAll('text.bar-value-women')
        .data(countswomen2)
        .enter().append('text')
        .attr('x', (d) => width/2 + 148 + d*((width-180)/max2)+10)
        .attr('y', (d,i) => 25 + i*(barHeight) + barHeight/2) 
        .attr('text-anchor', 'middle')
        .attr('class', 'bar-value')  
        .text(d => d);
    
    subsvg2.selectAll('text.legend')
        .data(checkedCheckboxes)
        .enter().append('text')
        .attr('x', width/2 + 100)
        .attr('y', height + 50)
        .attr('text-anchor', 'middle')
        .text("Number of patients depending on the gender and the age");
    
    //Creation of the legend

    const subsvg3 = ctx.svgEl.append('svg')
        .attr('width', 3*width)
        .attr('height', 100)
        .attr('x', 0)
        .attr('y', height + 100);
    
    subsvg3.selectAll('.rect_bleu')
        .data(ages)
        .enter().append('rect')
        .attr('x', 500 )
        .attr('y',50)
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', 'steelblue');
    
    subsvg3.selectAll('.rect_rose')
        .data(ages)
        .enter().append('rect')
        .attr('width', 10)
        .attr('height', 10)
        .attr('x', 630)
        .attr('y',50)
        .attr('fill', 'pink');
    
    subsvg3.selectAll('text.legendbleu')
        .data(checkedCheckboxes)
        .enter().append('text')
        .attr('x', 550)
        .attr('y', 60)
        .attr('text-anchor', 'middle')
        .text("Man");
    
    subsvg3.selectAll('text.legendrose')
        .data(checkedCheckboxes)
        .enter().append('text')
        .attr('x', 680)
        .attr('y', 60)
        .attr('text-anchor', 'middle')
        .text("Woman");
    
    //Creation of the stage/age graphics

    const tab_croise = []

    ages.forEach(age => {
        checkedCheckboxes.forEach(stage => {
            tab_croise.push([age,stage]);
        })
    })
    
    const stage_width = (3*width - 332)/(checkedCheckboxes.length)
    const age_height = (height)/(ages.length+1)

    const subsvg4 = ctx.svgEl.append('svg')
        .attr('width', 3*width)
        .attr('height', height+100)
        .attr('x', 0)
        .attr('y', height + 200);
    
    subsvg4.append('g')
        .attr('transform', `translate(0, ${height-30})`)
        .call(d3.axisBottom(d3.scaleLinear().domain([0, checkedCheckboxes.length]).range([132, 3*width - 100])).tickValues([]));
        
    subsvg4.append('g')
        .attr('transform', `translate(130,0)`)
        .call(d3.axisLeft().scale(d3.scaleLinear().domain([0, max]).range([height-30 , 20])).tickValues([]));
    
    subsvg4.selectAll('circle')
        .data(tab_croise)
        .enter().append('circle')
        .attr('cx', (d) => 250 + checkedCheckboxes.indexOf(d[1])*stage_width)
        .attr('cy', (d) => height-100-ages.indexOf(d[0])*age_height) 
        .attr('r', 0) 
        .attr('fill', 'grey')
        .transition()
        .attr('r', (d) => 9*reselectedData.filter(i=>d[0]<=parseFloat(i["Age"])&&parseFloat(i["Age"])<=d[0]+10&&valCheckbox(d[1]).includes(i["Braak stage"])).length)
        .duration(1000);
    
    subsvg4.selectAll('text.ord')
        .data(tab_croise)
        .enter().append('text')
        .attr('x', 70)
        .attr('y', (d) => height-100-ages.indexOf(d[0])*age_height)
        .attr('text-anchor', 'middle')
        .text(function (d) {return d[0] + "-" + (d[0]+10) + " years"});
    
    subsvg4.selectAll('text.abs')
        .data(tab_croise)
        .enter().append('text')
        .attr('x', (d) => 250 + checkedCheckboxes.indexOf(d[1])*stage_width)
        .attr('y', height)
        .attr('text-anchor', 'middle')
        .text(function (d) {if (d[1] === 0) {return 'Control'} else {return 'Stage ' + d[1]}});
    
    subsvg4.selectAll('text.leg')
        .data(tab_croise)
        .enter().append('text')
        .attr('x', (d) => 250 + checkedCheckboxes.indexOf(d[1])*stage_width)
        .attr('y', (d) => height-95-ages.indexOf(d[0])*age_height)
        .attr('text-anchor', 'middle')
        .text((d) => legend(d, reselectedData));
    
    subsvg4.selectAll('text.title')
        .data(tab_croise)
        .enter().append('text')
        .attr('x', 1.5 * width)
        .attr('y', height + 50)
        .attr('text-anchor', 'middle')
        .text("Number of patients depending on the age and the stage of Alzeihmer");
    
    ctx.svgEl.transition()
        .duration(500)
        .attr('opacity',1);
};

let legend = function(d, reselectedData){
    if (reselectedData.filter(i=>d[0]<=parseFloat(i["Age"])&&parseFloat(i["Age"])<=d[0]+10&&valCheckbox(d[1]).includes(i["Braak stage"])).length>0){
        return reselectedData.filter(i=>d[0]<=parseFloat(i["Age"])&&parseFloat(i["Age"])<=d[0]+10&&valCheckbox(d[1]).includes(i["Braak stage"])).length
    };
};

let valCheckboxes = function(checkedCheckboxes){
    let res = [];
    checkedCheckboxes.forEach(checkbox => {
        if (checkbox===0){res.push("C");};
        if (checkbox===1){res.push("I"); res.push("I-II");};
        if (checkbox===2){res.push("II"); res.push("II-III"); res.push("I-II");};
        if (checkbox===3){res.push("III"); res.push("II-III"); res.push("III-IV");};
        if (checkbox===4){res.push("IV"); res.push("IV-V"); res.push("III-IV");};
        if (checkbox===5){res.push("V"); res.push("V-VI"); res.push("IV-V");};
        if (checkbox===6){res.push("VI"); res.push("V-VI");};
    }
    )
    return res;
}

let valCheckbox = function(checkbox){
    let res = [];
        if (checkbox===0){res.push("C");};
        if (checkbox===1){res.push("I"); res.push("I-II");};
        if (checkbox===2){res.push("II"); res.push("II-III"); res.push("I-II");};
        if (checkbox===3){res.push("III"); res.push("II-III"); res.push("III-IV");};
        if (checkbox===4){res.push("IV"); res.push("IV-V"); res.push("III-IV");};
        if (checkbox===5){res.push("V"); res.push("V-VI"); res.push("IV-V");};
        if (checkbox===6){res.push("VI"); res.push("V-VI");};
    return res;
}

let rangeage = function(reselectedData){
    const res = new Set([]);
    reselectedData.forEach(patient => {
        res.add(parseFloat(patient["Age"]) - (parseFloat(patient["Age"]%10)));
    })
    return Array.from(res).sort();
};

function updateCheckedValues() {
    ctx.svgEl.selectAll("*")
        .transition()
        .duration(500)
        .style("opacity", 0)
        .end()
        .then(() => {
            ctx.svgEl.selectAll("*").remove();
            setTimeout(() => {
                createVizDataset();
            }, 100);})
    /*console.log(ctx.checkedCheckboxes)*/
;}
 
function loadData(svgEl){
    Promise.all([d3.csv("data/ProteinsPatientsTC.csv"),
                d3.csv("data/ProteinsPatientsFC.csv"),
                d3.csv("data/ProteinsPatientsEC.csv"),
                d3.csv("data/ProteinsPatientsPHC.csv"),
                d3.csv("data/PRIDEdataUploadInfo.csv")]).then(function(datas){
                ctx.data = datas[4];
                createVizDataset();                
                }).catch(function(error){console.log(error)});
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
