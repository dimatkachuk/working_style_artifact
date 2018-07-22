# -*- coding: utf-8 -*-

import json
from flask import Flask, jsonify, request, Response

from models import kernel as kernel
from models import kernel_sequence as kernel_sequence

from controllers import log_to_wsa as log_processing
from controllers import apply_kernel as kernel_processing

def print_matr(matr):
    for row in matr:
        print(row)

HEADERS = {"Content-Type": "application/json"}

# Initialize application
app = Flask(__name__)

# Append headers to API response for access to its methods
@app.after_request
def after_request(response):
  response.headers.add('Access-Control-Allow-Origin', '*')
  response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  return response

# Main POST method to extract wsa from file based on info from front-end
@app.route('/wsa', methods=['POST'])
def generate_wsa():
    print('Started')
    data = request.get_json(force=True)
    # Process log file and generate WSA
    wsa, colors, shapes = log_processing.log_to_wsa(data['file'], data['extension'], data['case'], data['activity'], data['performer'])
    print('Colors', colors)
    print('Shapes', shapes)
    r = {'matrix': wsa.matrix, 'nrows': wsa.nrows, 'ncols': wsa.ncols, 'colors': colors, 'shapes': shapes}
    info_cells_num =  wsa.get_total()
    print('total', info_cells_num)
    r.update({'total': info_cells_num})
    # Apply standard kernel to WSA
    tl = 'x'
    tr = '*'
    bl = '*'
    br = '*'
    parametric = kernel.Kernel(tl, tr, bl, br, 3, 0, [], True)
    act_list = kernel_processing.get_activations(parametric, wsa)
    # list_act = act_list.get_activations()
    # print('activations:')
    # for elem in list_act:
    #     print(elem.matrix, elem.number, elem.highlight_area, elem.coords)
    highlights = act_list.get_highlight_matrix()
    print_matr(highlights)
    total_active_cells = 0
    for row in highlights:
        for elem in row:
            if elem != 0:
                total_active_cells += 1
    r.update({'total_active': total_active_cells})
    r.update({'activations': act_list.get_json()})
    # Apply standard kernel sequence to WSA
    kernel_seq_threshold = 1
    first_kernel = parametric
    tl = 's1;x'
    tr = '*'
    bl = '*'
    br = '*'
    second_kernel = kernel.Kernel(tl, tr, bl, br, kernel_seq_threshold, 1, [])
    relations = ['.', 'strict']
    kernel_seq = kernel_sequence.KernelSequence([parametric, second_kernel], relations, kernel_seq_threshold)
    seq_act_list = kernel_processing.get_activations_sequences(kernel_seq, wsa)
    highlights = seq_act_list.get_highlight_matrix()
    print_matr(highlights)
    total_active_cells = 0
    for row in highlights:
        for elem in row:
            if elem != 0:
                total_active_cells += 1
    r.update({'total_active_seq': total_active_cells})
    r.update({'activation_sequences': seq_act_list.get_json()})
    # print('Seq act', seq_act_list)
    # Dump it all in json and send back
    json_response = json.dumps(r)
    resp = Response(json_response, status=200, mimetype='application/json')
    return resp

# Main Post method for work with kernels
@app.route('/kernel', methods=['POST'])
def apply_kernel():
    print('Kernel started')
    data = request.get_json(force=True)
    # Process log file and generate WSA
    wsa, colors, shapes = log_processing.log_to_wsa(data['file'], data['extension'], data['case'], data['activity'],
                                                    data['performer'])
    print('Processed')
    r = {'matrix': wsa.matrix, 'nrows': wsa.nrows, 'ncols': wsa.ncols, 'colors': colors, 'shapes': shapes}
    print('Cells:', data['cells'])
    # Apply kernel to WSA
    tl = data['cells'][0]
    tr = data['cells'][1]
    bl = data['cells'][2]
    br = data['cells'][3]
    k = kernel.Kernel(tl, tr, bl, br, data['threshold'], data['number'], colors)
    k.print_kernel()
    print('WSA', wsa)
    print('Shapes', shapes)
    print('Colors', colors)
    act_list = kernel_processing.get_activations(k, wsa)
    list_act = act_list.get_activations()
    print('activations:')
    for elem in list_act:
        print(elem.matrix, elem.number, elem.highlight_area, elem.coords)
    highlights = act_list.get_highlight_matrix()
    print_matr(highlights)
    total_active_cells = 0
    for row in highlights:
        for elem in row:
            if elem != 0:
                total_active_cells += 1
    r.update({'total_active': total_active_cells})
    r.update({'activations': act_list.get_json()})
    # Dump it all in json and send back
    json_response = json.dumps(r)
    resp = Response(json_response, status=200, mimetype='application/json')
    return resp


# Main Post method for work with kernel sequences
@app.route('/kernel_sequence', methods=['POST'])
def apply_kernel_sequence():
    print('Kernel started')
    data = request.get_json(force=True)
    # Process log file and generate WSA
    wsa, colors, shapes = log_processing.log_to_wsa(data['file'], data['extension'], data['case'], data['activity'],
                                                    data['performer'])
    print('Processed')
    r = {'matrix': wsa.matrix, 'nrows': wsa.nrows, 'ncols': wsa.ncols, 'colors': colors, 'shapes': shapes}
    print('Kernels:', data['kernels'])
    kernels_cells = data['kernels']
    kernels = []
    for kernel_cells in kernels_cells:
        tl = kernel_cells[0]
        tr = kernel_cells[1]
        bl = kernel_cells[2]
        br = kernel_cells[3]
        kernels.append(kernel.Kernel(tl, tr, bl, br, data['threshold'], data['number'], colors))
    kernel_seq = kernel_sequence.KernelSequence(kernels, data['relations'], data['threshold'])
    seq_act_list = kernel_processing.get_activations_sequences(kernel_seq, wsa)
    highlights = seq_act_list.get_highlight_matrix()
    print_matr(highlights)
    total_active_cells = 0
    for row in highlights:
        for elem in row:
            if elem != 0:
                total_active_cells += 1
    r.update({'total_active_seq': total_active_cells})
    r.update({'activation_sequences': seq_act_list.get_json()})
    # Dump it all in json and send back
    json_response = json.dumps(r)
    resp = Response(json_response, status=200, mimetype='application/json')
    return resp

if __name__ == '__main__':
    app.run(debug=True)