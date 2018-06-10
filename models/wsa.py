class WSA:
    def __init__(self, matrix, nrows, ncols):
        self.matrix = matrix
        self.nrows = nrows
        self.ncols = ncols

    def __str__(self):
        str = ''
        for row in self.matrix:
            for elem in row:
                str += elem.__str__() + ' '
            str += '\n'
        return str

    def get_total(self):
        total = 0
        for row in self.matrix:
            for cell in row:
                if cell[0] != 'none':
                    total += 1
        return total

def generate_wsa(cases, shapes, colors):
    height, width = get_wsa_size(cases)
    cells = []
    for case in cases.keys():
        cells.append(get_wsa_row(cases[case], shapes, colors, width))
    cells.append(get_buffer_row(width))
    return WSA(cells, height+1, width+1)


def get_wsa_size(cases):
    height = len(cases.keys())
    width = 0
    for case in cases.keys():
        width = len(cases[case]) if len(cases[case]) > width else width
    return (height,width)


def get_wsa_row(case, shapes, colors, max_width):
    row = []
    # Add each task to WSA row (case)
    for task in case:
        cell = (shapes[task['activity']], colors[task['performer']], task['timestamp'])
        row.append(cell)
    # If number of tasks less than maximum width of WSA, add empty cells
    for iter in range(max_width-len(case)):
        row.append(('none','rgb(255,255,255)',1.0))
    # Add one more cell in each row as buffer one
    row.append(('none', 'rgb(255,255,255)', 1.0))
    return row

def get_buffer_row(max_width):
    row = []
    for iter in range(max_width+1):
        row.append(('none', 'rgb(255,255,255)', 1.0))
    return row