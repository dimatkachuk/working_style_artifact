import random
from models import wsa as wsa

def log_to_wsa(file_as_str, extension, case, activity, performer, timestamp='Time'):
    print('Processing log file...')
    if extension == 'csv':
        print('Extension: CSV')
        dict, unique_elements = read_csv(file_as_str, case, activity, performer, timestamp)
    elif extension == 'xes':
        pass
    else:
        pass
    # for case in dict.keys():
    #     print(dict[case])
    print('dict', dict)
    colors = get_colors(unique_elements['performers'])
    shapes = get_shapes(unique_elements['activities'])
    convert_timestamps(dict)
    w = wsa.generate_wsa(dict, shapes, colors)
    return w, colors, shapes


# def convert_xes(file):
#     rows = file.split('\n')
#     file = []
#     case_indx = 0
#     event_indx = 0
#     for row in rows:
#         if '<event>' in row:
#             file.append([str(case_indx), '', '', ''])
#         if ''
#


def read_csv(file, case_col, activity_col, performer_col, timestamp_col):
    output = {}
    unique_elems = {
        'activities': [],
        'performers': []
    }
    rows = file.split('\n')

    # 1. Deriving columns indexes
    col_names = rows[0].split(';')
    case_indx, activity_indx, performer_indx, timestamp_indx = -1,-1,-1,-1
    for indx in range(len(col_names)):
        if col_names[indx] == case_col:
            case_indx = indx
        elif col_names[indx] == activity_col:
            activity_indx = indx
        elif col_names[indx] == performer_col:
            performer_indx = indx
        elif col_names[indx] == timestamp_col:
            timestamp_indx = indx
    # 2. Retrieving data
    for row in rows[1:]:
        info = row.split(';')
        c = info[case_indx]
        a = info[activity_indx]
        p = info[performer_indx]
        if timestamp_indx != -1:
            t = info[timestamp_indx]
        else:
            t = 1
        if a not in unique_elems['activities']:
            unique_elems['activities'].append(a)
        if p not in unique_elems['performers']:
            unique_elems['performers'].append(p)
        if c in output.keys():
            output[c].append(get_object(a,p,int(t)))
        else:
            output.update({c:[get_object(a,p,int(t))]})
        # if state == 'starts':
        #     if a not in unique_elems['activities']:
        #         unique_elems['activities'].append(a)
        #     if p not in unique_elems['performers']:
        #         unique_elems['performers'].append(p)
        #     if c in output.keys():
        #         output[c].append(get_object(a,p,int(t.strip()),False))
        #     else:
        #         output.update({c:[get_object(a,p,int(t.strip()),False)]})
        # else:
        #     for elem in output[c]:
        #         if elem['completed'] == False and elem['activity'] == a and elem['performer'] == p:
        #             elem['timestamp'] = int(t.strip()) - elem['timestamp']
        #             elem['completed'] = True
    return output, unique_elems

def get_object( activity, performer, timestamp):
    return {'activity': activity, 'performer': performer, 'timestamp': timestamp}


def get_rgb():
    r = random.randint(0, 255)
    g = random.randint(0, 255)
    b = random.randint(0, 255)
    return (r,g,b)

def get_colors(performers, init_colors=[(243,91,4),(247,184,1),(28,150,91),(0,170,226),(201,145,120),(118,120,237),(8,96,95),(86,128,191),(92,93,103)]):
    colors = {}
    for elem in range(len(performers)):
        r,g,b = init_colors[elem] # get_rgb()
        colors.update({performers[elem]:'rgb(%s,%s,%s)' % (r,g,b)})
    return colors

def get_shapes(activities, init_shapes=['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12', 's13', 's14', 's15']):
    shapes = {}
    for elem in range(len(activities)):
        shapes.update({activities[elem]:init_shapes[elem]})
    return shapes

def convert_timestamps(cases):
    for case in cases.keys():
        max_time = 0
        for task in cases[case]:
            max_time = task['timestamp'] if task['timestamp'] > max_time else max_time
        for task in cases[case]:
            task['timestamp'] = round(task['timestamp']/max_time,2)

def get_wsa_from_log(file):
    dict, unique_elements = read_csv(file)
    # for case in dict.keys():
    #     print(dict[case])
    # print(unique_elements)
    colors = get_colors(unique_elements['performers'])
    shapes = get_shapes(unique_elements['activities'])
    convert_timestamps(dict)
    w = wsa.generate_wsa(dict, shapes, colors)
    # svg_wsa = svg.generate_svg_code(w,50)
    # print(svg_wsa)

if __name__ == "__main__":
    get_wsa_from_log('test_logs/log-ws.csv')
