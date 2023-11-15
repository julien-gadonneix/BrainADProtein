const ctx = {
    w: 820,
    h: 720
}

let createViz = function(){
    console.log("Using D3 v"+d3.version);
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    loadData();
};

function loadData(){
    Promise.all([d3.dsv("\t", "data/EC_Proteins.txt"), 
                d3.dsv("\t", "data/FC_Proteins.txt"), 
                d3.dsv("\t", "data/PHC_Proteins.txt"),
                d3.dsv("\t", "data/TC_Proteins.txt"),
                d3.csv("data/PRIDEdataUploadInfo.csv")]).then(function(data){
                    data.slice(0, 4).forEach(brainPart => {
                        brainPart.forEach(patient => {
                            let row = data[4].find(pat => pat["Sample code in PD search results"] == patient[0]);
                            patient.Age = row.Age;
                            patient.Sex = row.Sex;
                            patient["Braak Stage"] = row["Braak Stage"];
                            console.log(patient);
                        });
                    });
                
                }).catch(function(error){console.log(error)});
}

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
