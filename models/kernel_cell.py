class KernelCell:
    def __init__(self, value, row, col, colors, first):
        self.value = value
        self.row = row
        self.col = col
        if value == '*':
            self.type = 'any'
            self.value = '*'
        elif value == 'x' or value == 'y' \
                    or value == 'z' or value == 'w':
            self.type = 'param'
            self.value = value
        else:
            self.type = 'separate'
            activities, performers = value.split(';')
            if activities == 'x' or activities == 'y' \
                    or activities == 'z' or activities == 'w':
                self.activity_type = 'param'
                self.activity_value = activities
            else:
                self.activity_type = 'strict'
                self.activity_value = activities.split('/')
            if performers == 'x' or performers == 'y' \
                    or performers == 'z' or performers == 'w':
                self.performer_type = 'param'
                self.performer_value = performers
            else:
                self.performer_type = 'strict'
                self.performer_value = performers.split('/')
                if not first:
                    p_list = []
                    for performer in self.performer_value:
                        p_list.append(colors[performer])
                    self.performer_value = p_list


    def __str__(self):
        if self.type == 'separate':
            return '(activity: %s, %s; performer: %s, %s)' % (self.activity_type, self.activity_value, self.performer_type, self.performer_value)
        else:
            return '(type: %s; value: %s)' % (self.type, self.value)
