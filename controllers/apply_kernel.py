from models import activation as activation
from models import activations_list as activation_list

from models import activation_sequence as activation_sequence
from models import activation_sequence_list as activation_sequences_list

def print_matr(matr):
    for row in matr:
        print(row)

######### MAIN ALGORITHM #####################

##### 1. Algorithm for single kernel #########

def get_activations(kernel, w):
    row_number = w.nrows
    col_number = w.ncols
    wsa = w.matrix
    kernel_activations_list = activation_list.ActivationsList(kernel.number, row_number, col_number)
    for i in range(row_number - kernel.size + 1):
        rows = wsa[i:i + kernel.size]
        for j in range(col_number - kernel.size + 1):
            matr = []
            for row in rows:
                matr.append(row[j:j + kernel.size])
            success, answer, void = kernel.is_activated(matr, [{}, {}, {}])
            if success:
                act = activation.Activation(kernel.threshold, answer, i, j)
                kernel_activations_list.add_activation(act)
    kernel_activations_list.postprocess()
    return kernel_activations_list

##############################################

##### 2. Algorithm for sequences of kernels ##

finished_pattern = []

def get_activations_sequences(kernel_sequence, w):
    global finished_pattern
    row_number = w.nrows
    col_number = w.ncols
    wsa = w.matrix
    kernel_activation_sequences_list = activation_sequences_list.ActivationSequencesList(row_number, col_number)
    k_size = kernel_sequence.kernels[0].size
    for i in range(row_number - k_size + 1):
        row = wsa[i:i + k_size]
        print('///////////////////////////////////////')
        check_rec(row, 0, len(row[0]) - 1, kernel_sequence.kernels, kernel_sequence.relations,
                  len(kernel_sequence.kernels) - 1, [{},{},{}])
        print('///////////////////////////////////////')
        for act_sequence in finished_pattern:
            activations = []
            for act in act_sequence:
                activations.append(activation.Activation(kernel_sequence.threshold, act[0], i, act[1]))
            kernel_activation_sequences_list.add_activation_sequence(activation_sequence.ActivationSequence(activations))
            # print('Matrix')
            # print_matr(kernel_activation_sequences_list.highlight_matrix)
        finished_pattern = []
    kernel_activation_sequences_list.postprocess()
    return kernel_activation_sequences_list



def check_rec(sequence, start_indx, end_indx, kernels, relations, k_indx, params, rec_step=0, pattern=[]):
    current_pattern = pattern
    if sequence:
        indx = end_indx
        while indx > start_indx and indx > 0:
            # print('kernel:')
            # kernels[k_indx].print_kernel()
            success, answer, returned_params = kernels[k_indx].is_activated([sequence[0][indx-1:indx+1],sequence[1][indx-1:indx+1]], params)
            if success:
                # params = returned_params
                current_pattern = [(answer,indx-1)] + current_pattern
                if relations[k_indx] == 'strict':
                    rec_step += 1
                    prev_pattern = current_pattern
                    returned_pattern = check_rec(sequence, indx-2, indx-1, kernels, relations, k_indx - 1, returned_params, rec_step, current_pattern)
                    rec_step -= 1
                    if returned_pattern == prev_pattern:
                        current_pattern = pattern
                    if current_pattern == prev_pattern and rec_step == 0:
                        current_pattern = []
                    # if rec_pattern:
                    #     pattern += rec_pattern
                    #     indx -= 1
                    #     print('strict succeded. Pattern:', pattern)
                    # else:
                    #     print('strict failed')
                    #     pattern = []
                elif relations[k_indx] == 'non-strict':
                    rec_step += 1
                    prev_pattern = current_pattern
                    check_rec(sequence, 0, indx - 1, kernels, relations, k_indx - 1, returned_params, rec_step, current_pattern)
                    rec_step -= 1
                    if current_pattern == prev_pattern and rec_step == 0:
                        current_pattern = []
                    if current_pattern == prev_pattern:
                        current_pattern = pattern
                else:
                    finished_pattern.append(current_pattern)
                    current_pattern = pattern
            indx -= 1
            # if pattern:
            #     finished_pattern.append(pattern)
        return current_pattern
    else:
        print('recursion finished')