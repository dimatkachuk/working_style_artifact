class ActivationsList:
    def __init__(self, kernel_num, nrows, ncols):
        self.kernel_number = kernel_num
        self.activations = []
        self.highlight_matrix = [[0 for i in range(ncols)] for j in range(nrows)]

    def get_activations(self):
        return self.activations

    def get_highlight_matrix(self):
        return self.highlight_matrix

    def get_json(self):
        l = []
        for activation in self.activations:
            l.append(activation.get_json())
        return {'activations': l, 'highlight': self.highlight_matrix}

    def postprocess(self):
        activations_to_left = []
        for activation in self.activations:
            if activation.number >= activation.threshold:
                if activation.isInformative():
                    activations_to_left.append(activation)
        self.activations = activations_to_left

    def add_activation(self, input_activation):
        already_in_activations = False
        if (self.activations):
            for activation in self.activations:
                if activation.isEqual(input_activation):
                    already_in_activations = True
                    activation.number += 1
                    activation.addCoords(input_activation.coords[0])
                    if activation.number == activation.threshold:
                        #Highlight dependent areas
                        for (r,c) in activation.coords:
                            self.highlight(r,c,activation.highlight_area)
                    elif activation.number > activation.threshold:
                        #add highlight to new areas
                        self.highlight(input_activation.coords[0][0],input_activation.coords[0][1],activation.highlight_area)
            if not already_in_activations:
                self.activations.append(input_activation)
                # Check if threshold is 1
                if input_activation.number == input_activation.threshold:
                    # Highlight dependent areas
                    for (r, c) in input_activation.coords:
                        self.highlight(r, c, input_activation.highlight_area)
        else:
            self.activations.append(input_activation)
            # Check if threshold is 1
            if input_activation.number == input_activation.threshold:
                # Highlight dependent areas
                for (r, c) in input_activation.coords:
                    self.highlight(r, c, input_activation.highlight_area)

    def highlight(self, r, c, highlight_area):
        if highlight_area[0][0]:
            self.highlight_matrix[r][c] += 1
        if highlight_area[1][0]:
            self.highlight_matrix[r + 1][c] += 1
        if highlight_area[0][1]:
            self.highlight_matrix[r][c + 1] += 1
        if highlight_area[1][1]:
            self.highlight_matrix[r + 1][c + 1] += 1