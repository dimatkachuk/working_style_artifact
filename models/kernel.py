from models import kernel_cell as KCell

import copy

class Kernel:
    def __init__(self, topleft, topright, bottomleft, bottomright, threshold, kernel_number, colors, first=False):
        self.size = 2
        self.threshold = threshold
        self.number = kernel_number
        ## Actual structure itself ####
        self.tl = KCell.KernelCell(topleft, 0, 0, colors, first)
        self.tr = KCell.KernelCell(topright, 0, 1, colors, first)
        self.bl = KCell.KernelCell(bottomleft, 1, 0, colors, first)
        self.br = KCell.KernelCell(bottomright, 1, 1, colors, first)
        ###############################

    def print_kernel(self):
        print(self.tl)
        print(self.tr)
        print(self.bl)
        print(self.br)

    def is_activated(self, matr, existing_params):
        params = copy.copy(existing_params[0])
        activity_params = copy.copy(existing_params[1])
        performer_params = copy.copy(existing_params[2])
        activation_matr = [['',''],['','']]
        #Check if at least one cell of matr is non-empty
        row_nums = []
        col_nums = []
        for kernel_cell in [self.tl, self.tr, self.bl, self.br]:
            if kernel_cell.type != 'any':
                row_nums.append(kernel_cell.row)
                col_nums.append(kernel_cell.col)
        checker = False
        for i in range(len(row_nums)):
            if matr[row_nums[i]][col_nums[i]][0] != 'none':
                checker = True
        if not checker:
            return False, 'No activation! All cell of input matrix is empty. Nothing to activate.', [{}, {}, {}]
        # We should go through each cell and check for activation of it
        for kernel_cell in [self.tl, self.tr, self.bl, self.br]:
            matr_value = (matr[kernel_cell.row][kernel_cell.col][0],matr[kernel_cell.row][kernel_cell.col][1])
            if kernel_cell.type == 'any':
                activation_matr[kernel_cell.row][kernel_cell.col] = '*'
            elif kernel_cell.type == 'param':
                if kernel_cell.value in params.keys():
                    if params[kernel_cell.value] == matr_value:
                        activation_matr[kernel_cell.row][kernel_cell.col] = params[kernel_cell.value]
                    else:
                        return False, 'No activation! Parameter %s has value %s instead of given value %s' % \
                               (kernel_cell.value, params[kernel_cell.value], matr_value), [{}, {}, {}]
                else:
                    for key in params.keys():
                        if params[key] == matr_value:
                            return False, 'No activation! Current value %s already applied to parameter %s' % \
                                   (matr_value, key), [{}, {}, {}]
                    params.update({kernel_cell.value: matr_value})
                    activation_matr[kernel_cell.row][kernel_cell.col] = matr_value

            elif kernel_cell.type == 'separate':
                #Extracting event element separately
                activity = matr_value[0]
                performer = matr_value[1]
                #Firstly comparing or extracting from activity
                if kernel_cell.activity_type == 'param':
                    if kernel_cell.activity_value in activity_params.keys():
                        if activity_params[kernel_cell.activity_value] != activity:
                            return False, 'No activation! Activity parameter %s has value %s instead of given value %s' % \
                                   (kernel_cell.activity_value, activity_params[kernel_cell.activity_value], activity), [{}, {}, {}]
                    else:
                        for key in activity_params.keys():
                            if activity_params[key] == activity:
                                return False, 'No activation! Current acitivity %s already applied to parameter %s' % \
                                       (activity, key), [{}, {}, {}]
                        activity_params.update({kernel_cell.activity_value: activity})
                else:
                    if activity not in kernel_cell.activity_value:
                        return False, 'No activation! Activity value %s does not match any of given %s' % \
                               (activity, kernel_cell.activity_value), [{}, {}, {}]
                #Secondly from performer
                if kernel_cell.performer_type == 'param':
                    if kernel_cell.performer_value in performer_params.keys():
                        if performer_params[kernel_cell.performer_value] != performer:
                            return False, 'No activation! Performer parameter %s has value %s instead of given value %s' % \
                                   (kernel_cell.performer_value, performer_params[kernel_cell.performer_value], performer), [{}, {}, {}]
                    else:
                        for key in performer_params.keys():
                            if performer_params[key] == performer:
                                return False, 'No activation! Current acitivity %s already applied to parameter %s' % \
                                       (performer, key), [{}, {}, {}]
                        performer_params.update({kernel_cell.performer_value: performer})
                else:
                    if performer not in kernel_cell.performer_value:
                        return False, 'No activation! Performer value %s does not match any of given %s' % \
                               (performer, kernel_cell.performer_value), [{}, {}, {}]
                #If execution comes here, it means that activation exist and it is:
                activation_matr[kernel_cell.row][kernel_cell.col] = (activity, performer)
        return True, activation_matr, [params, activity_params, performer_params]



if __name__ == "__main__":
    k1 = Kernel('x', '*', '*', '*', 3, 0)
    k2 = Kernel('x', '*', 'x', '*', 3, 1)
    k3 = Kernel('x', 'y', 'y', '*', 3, 2)
    k4 = Kernel('A;2', '*', '*', '*', 3, 3)
    k5 = Kernel('A;1,2', '*', '*', '*', 3, 4)

    k5.print_kernel()
    answer = k5.is_activated([[('A','1'),('B','2')],[('A','2'),('B','1')]])
    print(answer)
