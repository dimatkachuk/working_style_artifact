from models import activation as activation
from models import activations_list as activation_list

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
            success, answer = kernel.is_activated(matr)
            if success:
                act = activation.Activation(kernel.threshold, answer, i, j)
                kernel_activations_list.add_activation(act)
    print('Before postprocessing:', len(kernel_activations_list.activations))
    kernel_activations_list.postprocess()
    return kernel_activations_list

##### 2. Algorithm for kernel sequence #########
def get_activations_sequence(kernel_sequence, w):
    row_number = w.nrows
    col_number = w.ncols
    wsa = w.matrix