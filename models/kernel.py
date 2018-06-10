from models import kernel_cell as KCell
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

    def is_activated(self, matr):
        params = {}
        activity_params = {}
        performer_params = {}
        activation_matr = [['',''],['','']]
        #Check if at least one cell of matr is non-empty
        if matr[0][0][0] == 'none' and matr[1][0][0] == 'none' and matr[0][1][0] == 'none' and matr[1][1][0] == 'none':
            return False, 'No activation! All cell of input matrix is empty. Nothing to activate.'
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
                               (kernel_cell.value, params[kernel_cell.value], matr_value)
                else:
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
                                   (kernel_cell.activity_value, activity_params[kernel_cell.activity_value], activity)
                    else:
                        activity_params.update({kernel_cell.activity_value: activity})
                else:
                    if activity not in kernel_cell.activity_value:
                        return False, 'No activation! Activity value %s does not match any of given %s' % \
                               (activity, kernel_cell.activity_value)
                #Secondly from performer
                if kernel_cell.performer_type == 'param':
                    if kernel_cell.performer_value in performer_params.keys():
                        if performer_params[kernel_cell.performer_value] != performer:
                            return False, 'No activation! Performer parameter %s has value %s instead of given value %s' % \
                                   (kernel_cell.performer_value, performer_params[kernel_cell.performer_value], performer)
                    else:
                        performer_params.update({kernel_cell.performer_value: performer})
                else:
                    if performer not in kernel_cell.performer_value:
                        return False, 'No activation! Performer value %s does not match any of given %s' % \
                               (performer, kernel_cell.performer_value)
                #If execution comes here, it means that activation exist and it is:
                activation_matr[kernel_cell.row][kernel_cell.col] = (activity, performer)
        return True, activation_matr



if __name__ == "__main__":
    k1 = Kernel('x_param', '*', '*', '*', 3, 0)
    k2 = Kernel('x_param', '*', 'x_param', '*', 3, 1)
    k3 = Kernel('x_param', 'y_param', 'y_param', '*', 3, 2)
    k4 = Kernel('A;2', '*', '*', '*', 3, 3)
    k5 = Kernel('A;1,2', '*', '*', '*', 3, 4)

    k5.print_kernel()
    answer = k5.is_activated([[('A','1'),('B','2')],[('A','2'),('B','1')]])
    answer = k5.is_activated([[('none', '1'), ('none', '2')], [('none', '2'), ('none', '1')]])
    print(answer)
