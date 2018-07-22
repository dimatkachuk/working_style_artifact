class ActivationSequence:
    def __init__(self, activations):
        self.activations = activations
        self.number = 1
        self.threshold = self.activations[0].threshold

    def get_json(self):
        acts = []
        for activation in self.activations:
            acts.append(activation.get_json())
        return {'activations': acts, 'number': self.number, 'threshold': self.threshold, 'highlighted': True}

    def isEqual(self, other):
        for num in range(len(self.activations)):
            if not self.activations[num].isEqual(other.activations[num]):
                return False
        return True