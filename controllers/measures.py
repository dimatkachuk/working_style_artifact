import numpy as np

###### IGNORING ELEMENTS OF WSA ################

def ignore_wsa_elements(wsa, ignore_performers=False, ignore_activity=False, ignore_time=False):
    # Check if there is any element to ignore (if not -> return wsa)
    if ignore_performers or ignore_activity or ignore_time:
        output_wsa = []
        # Go through each event to ignore given elements
        for row in wsa.matrix:
            output_row = []
            for cell in row:
                performer = ('NS' if ignore_performers else cell[0])
                activity = ('NS' if ignore_activity else cell[1])
                time = ('NS' if ignore_time else cell[2])
                output_row.append((performer,activity,time))
            output_wsa.append(output_row)
        wsa.matrix = output_wsa
        return wsa
    else:
        return wsa

### MAIN FUCTION (Counts any measure for chosen size)

def is_all_none(matr):
    for row in matr:
        for elem in row:
            if elem[0] != 'Nn' and elem[1] != 0:
                return False
    return True

def get_measure_matrix(wsa, block_size, measure_func_list):
    measure_matrix = []
    row_number = wsa.nrows
    col_number = wsa.ncols
    for i in range(row_number - block_size ):
        measure_row = []
        rows = wsa.matrix[i:i + block_size]
        for j in range(col_number - block_size ):
            matr = []
            for row in rows:
                matr.append(row[j:j + block_size])
            # Check matr for All none
            if is_all_none(matr):
                measure_row.append(-1)
            else:
                value = 0
                for measure_func in measure_func_list:
                    value += measure_func(matr)
                measure_row.append(round(value,2))
        measure_matrix.append(measure_row)
    return measure_matrix


def evaluate_matrix(measure_matrix, measure_max):
    max_value = 0
    value = 0
    value_by_case = []
    max_value_by_case = []
    percent_by_case = []
    for row in measure_matrix:
        max_case_value = len(row)
        prev_value = value
        for elem in row:
            if elem >= 0:
                max_value += measure_max
                value += elem
            else:
                max_case_value -= 1
        value_by_case.append(round(value-prev_value,2))
        max_value_by_case.append(max_case_value)
        percent_by_case.append(round((value-prev_value)/max_case_value,2))
    return (max_value, value, value/max_value, max_value_by_case, value_by_case, percent_by_case)


### MEASURES ######################

# X-axis symmetry
def x_symmetry(m):
    if np.array_equal(m,np.flip(m,0)):
        return 1
    else:
        return 0

#Y-axis symmetry
def y_symmetry(m):
    if np.array_equal(m,np.flip(m,1)):
        return 1
    else:
        return 0

# X=Y diagonal symmetry
def diag_symmetry(m):
    if m[0][0] == m[1][1]:
        return 0.1
    else:
        return 0

# -X=Y diagonal symmetry
def antidiag_symmetry(m):
    if m[0][1] == m[1][0]:
        return 0.1
    else:
        return 0


# Reverse row symmetry
def reverse_row_symmetry(m):
    if m[0] == reversed(m[1]):
        return 0.2
    else:
        return 0

#Y-axis half symmetry
def x_half_symmetry(m):
    c = 0
    for i in range(len(m)):
        c += (1 if m[0][i] == m[-1][i] else 0)
    return c/len(m)

def y_half_symmetry(m):
    c = 0
    for i in range(len(m)):
        c += (1 if m[i][0] == m[i][-1] else 0)
    return c/len(m)

def temperature(m):
    t = -1
    exist = []
    for row in m:
        for elem in row:
            if not elem in exist:
                exist.append(elem)
                t += 1
    return t