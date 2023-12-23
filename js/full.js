//creation of the brain vizualisation with XTK
function createViz() {
    const volume = new X.volume();
    //the brain data 
    volume.file = 'data/HarvardOxford-cort_and_sub-maxprob-thr25-1mm.nii.gz';
    volume.lowerThreshold = 10;
    volume.upperThreshold = 180;
    volume.volumeRendering = true;
    r = new X.renderer3D();
    r.init();
    r.container = 'rcontainer';
    r.add(volume);
    r.camera.position = [-220, 0, 0];
    r.render();
};

