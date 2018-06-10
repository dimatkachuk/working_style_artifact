class Activation:
    def __init__(self, threshold, activation_matr, row_coord, col_coord):
        self.threshold = threshold
        self.number = 1
        self.coords = [(row_coord, col_coord)]
        self.matrix = activation_matr
        self.highlight_area = [[1,1],[1,1]]
        for i in [0,1]:
            for j in [0,1]:
                if self.matrix[i][j] == '*' or (self.matrix[i][j][0] and self.matrix[i][j][0] == 'none'):
                    self.highlight_area[i][j] = 0

    def isInformative(self):
        non_informative_counter = 0
        for i in [0,1]:
            for j in [0,1]:
                if self.matrix[i][j] == '*' or (self.matrix[i][j][0] and self.matrix[i][j][0] == 'none'):
                    non_informative_counter += 1
        if non_informative_counter < 4:
            return True
        else:
            return False

    def isEqual(self, other):
        if self.matrix == other.matrix:
            return True
        else:
            return False

    def addCoords(self, coords):
        self.coords.append(coords)

    def get_json(self):
        return {'matrix': self.matrix, 'coords': self.coords, 'area': self.highlight_area, 'number': self.number, 'highlighted': True}