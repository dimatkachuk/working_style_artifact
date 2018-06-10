class KernelSequence:
    def __init__(self, kernels, relations, threshold):
        if len(kernels) == len(relations):
            self.kernels = kernels
            self.relations = relations
            self.threshold = threshold
            self.size = len(kernels)
        else:
            print('Error! Wrong kernel sequence input in constructor.')