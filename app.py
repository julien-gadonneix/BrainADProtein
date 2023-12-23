from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import nibabel as nib
import nibabel as nib
from nilearn import plotting

app = Flask(__name__)
CORS(app) 

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/run_python_script', methods=['POST'])

#optention of the data in the json and run the python function
def run_python_script():
    data = request.get_json()
    tableau = data["key1"]
    input_file_path = 'data/HarvardOxford-cort_and_sub-maxprob-thr25-1mm.nii.gz'
    img = nib.load(input_file_path)
    brain_data = img.get_fdata()

    dimx = len(brain_data) 
    dimy = len(brain_data[0])
    dimz = len(brain_data[0][0])

    value_FC = tableau[2]
    value_EC = tableau[1]
    value_TC = tableau[1]
    value_PHC = tableau[3]
    #for the color of the other part of the brain
    value_reste = min(value_TC, value_EC, value_FC, value_PHC) / 2

    #brain part of the studies
    list_FC = [101.0, 128.0, 125.0, 103.0, 129.0]
    list_TC = [112.0, 113.0, 110.0, 116.0, 115.0, 111.0, 109.0, 123.0, 108.0, 144.0, 114.0, 142.0]
    list_EC = [9]            
    list_PHC = [10]

    #colorization if the brain with the value of the data for the selected stage of Alzheimer's disease
    for i in range(dimx):
        for j in range(dimy):
            for k in range(dimz):
                if brain_data[i,j,k] > 0:
                    if brain_data[i,j,k] in list_PHC:
                        brain_data[i,j,k] = value_PHC
                    elif brain_data[i,j,k] in list_EC:
                        brain_data[i,j,k] = value_EC
                    elif brain_data[i,j,k] in list_TC:
                        brain_data[i,j,k] = value_TC
                    elif brain_data[i,j,k] in list_FC:
                        brain_data[i,j,k] = value_FC
                    else:
                        brain_data[i,j,k] = value_reste

    modified_img = nib.Nifti1Image(brain_data, img.affine, img.header)

    view = plotting.view_img(modified_img, threshold=None, cmap='coolwarm', symmetric_cmap=False, colorbar=True)
    #open in a HTML 
    view.open_in_browser()

    return jsonify(tableau)

if __name__ == '__main__':
    app.run(debug=True)
