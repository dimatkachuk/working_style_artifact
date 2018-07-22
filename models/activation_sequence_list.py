class ActivationSequencesList:
    def __init__(self, nrows, ncols):
        self.activation_sequences = []
        self.highlight_matrix = [[0 for i in range(ncols)] for j in range(nrows)]

    def get_highlight_matrix(self):
        return self.highlight_matrix

    def get_json(self):
        acts = []
        for act_sequence in self.activation_sequences:
            acts.append(act_sequence.get_json())
        return {'activation_sequences': acts, 'highlight': self.highlight_matrix}

    def postprocess(self):
        act_seq_to_left = []
        for act_sequence in self.activation_sequences:
            if act_sequence.number >= act_sequence.threshold:
                act_seq_to_left.append(act_sequence)
        self.activation_sequences = act_seq_to_left

    def add_activation_sequence(self, input_activation_sequence):
        already_in_activation = False
        if self.activation_sequences:
            for activation_sequence in self.activation_sequences:
                if activation_sequence.isEqual(input_activation_sequence):
                    already_in_activation = True
                    activation_sequence.number += 1
                    for indx in range(len(activation_sequence.activations)):
                        activation_sequence.activations[indx].addCoords(input_activation_sequence.activations[indx].coords[0])
                    if activation_sequence.number == activation_sequence.threshold:
                        #Highlight dependent areas
                        for activation in activation_sequence.activations:
                            for (r, c) in activation.coords:
                                self.highlight(r, c, activation.highlight_area)
                    elif activation_sequence.number > activation_sequence.threshold:
                        #add highlight to new areas
                        for input_activation in input_activation_sequence.activations:
                            self.highlight(input_activation.coords[0][0],input_activation.coords[0][1], input_activation.highlight_area)
            if not already_in_activation:
                self.activation_sequences.append(input_activation_sequence)
                if input_activation_sequence.number == input_activation_sequence.threshold:
                    for activation in input_activation_sequence.activations:
                        for (r, c) in activation.coords:
                            self.highlight(r, c, activation.highlight_area)
        else:
            self.activation_sequences.append(input_activation_sequence)
            if input_activation_sequence.number == input_activation_sequence.threshold:
                for activation in input_activation_sequence.activations:
                    for (r, c) in activation.coords:
                        self.highlight(r, c, activation.highlight_area)

    def highlight(self, r, c, highlight_area):
        if highlight_area[0][0]:
            self.highlight_matrix[r][c] += 1
        if highlight_area[1][0]:
            self.highlight_matrix[r + 1][c] += 1
        if highlight_area[0][1]:
            self.highlight_matrix[r][c + 1] += 1
        if highlight_area[1][1]:
            self.highlight_matrix[r + 1][c + 1] += 1