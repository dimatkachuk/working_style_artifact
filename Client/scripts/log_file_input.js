const host = 'http://127.0.0.1:5000/';

var file_to_send = '';
var extension_to_send = '';
var max_size = 60;
var caseColumnName = '';
var activityColumnName = '';
var performerColumnName = '';

var colors = [];
var shapes = [];

var wsa = [];
var kernels = [
  {
    threshold: 3,
    tl: 'x',
    tr: '*',
    bl: '*',
    br: '*',
    number: 0,
    name: 'Parametric first cell',
  }
];
var active_kernel = -1;
var activations_list = []
current_highlight = []

var kernel_sequences = [
  {
    name: 'Act1 -> param',
    number: 0,
    threshold: 2,
    kernels: [
      {
        tl: 'x',
        tr: '*',
        bl: '*',
        br: '*',
      },
      {
        tl: 's1;x',
        tr: '*',
        bl: '*',
        br: '*',
      }
    ],
    relations: ['strict'],
  },
];

var editor_warnings = {
  name: false,
  threshold: false,
  right_threshold: true,
  cells: false,
  right_cells: true,
};

$(document).ready(() => {
  $('#submit-button').click(getFile);
  $('#submit-choices-button').click(send_file_json);
  $('#log-file').change(() => {
    $('#chosen-file').html('Your file: ' + $('#log-file').prop('files')[0].name);
  });
});

// Section 1. File upload and preprocessing /////////////////////////////////

function getFile() {
  console.log('File reading started');
  var logFile = $('#log-file').prop('files')[0];
  var extension = logFile.name.split('.')[1];
  extension_to_send = extension;
  if (checkFileExtension(extension)) { // File extension check
    $('#input-file-container').css('display','none');
    $('#column-choice-container').css('display','flex');
    processFile(logFile, extension);
  } else { // If file has wrong extension
    console.log('Unaccepted file extension!');
    $('#chosen-file').html("Unfortunatelly, only files with extension .csv, .xes, and .mxml can be processed. Choose another file.")
  }
}

// Function to check file extension to be csv, xes or mxml
function checkFileExtension(ext) {
  return (ext == 'csv' || ext == 'xes' || ext == 'mxml') ? true : false;
}

//Direct file to different processing function depending on file extention,
// then get columns
function processFile(file, extension) {
  console.log('File processing started');
  if (extension == 'csv') {
    processCSV(file);
  } else if (extension == 'xes') {

  } else {

  }
}

// CSV files processing
function processCSV(file) {
  if (file) {
    var reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = function (evt) {
        file_to_send = evt.target.result;
        var columnString = evt.target.result.split('\n')[0];
        if (columnString) {
          proceedColumns(columnString.split(';'));
        } else {
          $('#file-status').html("Your csv file does not contain column names and can't be processed. Please update it and try again.");
        }
    }
    reader.onerror = function (evt) {
      console.log('Error while reading CSV file on client-side');
      $('#file-status').html("Something went wrong, please try to reload the website");
    }
  }
}

// This function analyze column names to extrude columns
// which contain case numbers, activities and performers
function proceedColumns(columns) {
  // Case column identification
  var caseColumnName = '';
  var activityColumnName = '';
  var performerColumnName = '';
  for (colNum in columns) {
    var lcColumnName = columns[colNum].toLowerCase();
    if (lcColumnName.includes('case')) {
      caseColumnName = columns[colNum];
      console.log('Case column: ', caseColumnName);
    }
    if (lcColumnName.includes('activity')) {
      activityColumnName = columns[colNum];
      console.log('Activity column: ', activityColumnName);
    }
    if (lcColumnName.includes('performer') || lcColumnName.includes('resource')) {
      performerColumnName = columns[colNum];
      console.log('Performer column: ', performerColumnName);
    }
  }
  columnsShow(columns, caseColumnName, activityColumnName, performerColumnName);
}

function columnsShow(columns, caseColumn, activityColumn, performerColumn) {
  importantStr = ''
  importantStr += addOptions(caseColumn, '#case-select', columns, 'case');
  importantStr += addOptions(activityColumn, '#activity-select', columns, 'activities');
  importantStr += addOptions(performerColumn, '#performer-select', columns, 'performers');
  $('#column-choice-p-important').html(importantStr)
}

function addOptions(name, selector, columns, str) {
  if (name) {
    $(selector).append($('<option>', {
        value: name,
        text: name
    }));
    for (colNum in columns) {
      if (columns[colNum] != name) {
        $(selector).append($('<option>', {
            value: columns[colNum],
            text: columns[colNum]
        }));
      }
    }
  } else {
    return '<p>Please specify ' + str + ' column name!</p>'
  }
  return ''
}

// Section 2. Server communication /////////////////////////////////

function send_file_json() {
  console.log('Sending log file to server');
  caseColumnName = $('#case-select').val();
  activityColumnName = $('#activity-select').val();
  performerColumnName = $('#performer-select').val();
  $.ajax({
    url: host + 'wsa',
    data: JSON.stringify({
      case: caseColumnName,
      activity: activityColumnName,
      performer: performerColumnName,
      extension: extension_to_send,
      file: file_to_send,
    }),
    dataType: 'json',
    method: 'POST',
    success: function (response) {
      $('#uploading-container').css('display','none');
      shapes = response.shapes;
      colors = response.colors;
      wsa = {matrix: response.matrix, nrows: response.nrows, ncols: response.ncols}
      console.log('WSA: ', wsa.matrix);
      console.log('Rows: ', wsa.nrows);
      console.log('Cols: ', wsa.ncols);
      activations_list.push(response.activations);
      var highlights = [];
      for(var i=0; i<wsa.nrows; i++) {
        highlights[i] = [];
        for(var j=0; j<wsa.ncols; j++) {
          highlights[i][j] = 1;
        }
      }
      current_highlight = highlights;
      redraw();
      updateCustomization('kernel');
      for (indx in shapes) {
        shape = '<div class="metadata-shape"><svg width="' + 40 + '" height="' + 40 + '">';
        shape += getFigure(shapes[indx], 'rgb(125,132,145)', 1, 40, 0, 0);
        shape += '</svg><p>' + shapes[indx] + ': ' + indx + '</p></div>'
        $('#metadata-activities').append(shape);
      }
      console.log('Activities', shapes);
      for (indx in colors) {
        color = '<p class="metadata-color" style="color:' + colors[indx] + '">';
        color += indx;
        color += '</p>'
        $('#metadata-performers').append(color);
      }
      console.log('Performers', colors);
    }
  })

}

// Section 2. Interactions with WSA ////////////////

function drawWSA(matrix, nrows, ncols, highlights) {
  width = (ncols)*max_size;
  height = (nrows)*max_size;
  var svg = '<svg width="' + width + '" height="' + height + '">';
  svg += generateCells(matrix, highlights);
  return svg + '</svg>';
}

function generateCells(matrix, highlights) {
  var cells_svg = '';
  x = 0;
  y = 0;
  for (row_indx in matrix) {
    for (cell_indx in matrix[row_indx]) {
      cells_svg += generateCell(matrix[row_indx][cell_indx], x, y, highlights[row_indx][cell_indx]);
      x += max_size;
    }
    y += max_size;
    x = 0;
  }
  return(cells_svg);
}

function generateCell(cell, x, y, highlight) {
  cell_svg = '';
  if (highlight == 0 && cell[0] != 'none') {
    color = 'rgb(176,176,178);';
  } else if (cell[0] == 'none') {
    color = 'rgb(255,255,255);'
  } else {
    color = cell[1];
  }
  cell_svg += getFigure(cell[0], color, cell[2], max_size, x, y);
  return(cell_svg)
}

function getFigure(shape, color, size, max_size, x, y) {
  figure = '';
  size = size*0.8;
  center = max_size / 2;
  switch(shape) {
  case 's1': // Square
    x_coord = x + center*(1-size);
    y_coord = y + center*(1-size);
    s_size = 2*(center-(x_coord-x));
    figure += '<rect x="'+x_coord+'" y="'+y_coord+'" width="'+s_size+'" height="'+s_size+'" style="fill:'+color+';" />';
    break;
  case 's2':  // Circle
    cx_coord = x + center;
    cy_coord = y + center;
    r = size * center;
    figure += '<circle cx="'+cx_coord+'" cy="'+cy_coord+'" r="'+r+'" style="fill:'+color+';" />';
    break;
  case 's3': // Square with rounded corners
    x_coord = x + center * (1 - size);
    y_coord = y + center * (1 - size);
    s_size = 2 * (center - (x_coord - x));
    figure += '<rect x="'+x_coord+'" y="'+y_coord+'" width="'+s_size+'" height="'+s_size+'" rx="10" ry="10" style="fill:'+color+';" />';
    break;
  case 's4': // Diamond
    x_coord = x + center * (1 - size) + 3;
    y_coord = y + center * (1 - size) + 3;
    x_rot = x + center;
    y_rot = y + center;
    s_size = 2 * (center - (x_coord - x)) - 3;
    figure += '<rect x="'+x_coord+'" y="'+y_coord+'" width="'+s_size+'" height="'+s_size+'" transform="rotate(45 '+x_rot+' '+y_rot+')" style="fill:'+color+';" />';
    break;
  case 's5': // Square with circle
    x_coord = x + center*(1-size);
    y_coord = y + center*(1-size);
    s_size = 2*(center-(x_coord-x));
    figure += '<rect x="'+x_coord+'" y="'+y_coord+'" width="'+s_size+'" height="'+s_size+'" style="fill:'+color+';" />';
    cx_coord = x + center;
    cy_coord = y + center;
    r = size * center - 10;
    figure += '<circle cx="'+cx_coord+'" cy="'+cy_coord+'" r="'+r+'" style="fill:rgba(255,255,255);" />';
    break;
  case 's6': // Square with square
    x_coord = x + center*(1-size);
    y_coord = y + center*(1-size);
    s_size = 2*(center-(x_coord-x));
    figure += '<rect x="'+x_coord+'" y="'+y_coord+'" width="'+s_size+'" height="'+s_size+'" style="fill:'+color+';" />';
    sm_x_coord = x_coord + 10;
    sm_y_coord = y_coord + 10;
    sm_s_size = s_size - 20;
    figure += '<rect x="'+sm_x_coord+'" y="'+sm_y_coord+'" width="'+sm_s_size+'" height="'+sm_s_size+'" style="fill:rgb(255,255,255);" />';
    break;
  case 's7': // Square with diamond
    x_coord = x + center*(1-size);
    y_coord = y + center*(1-size);
    s_size = 2*(center-(x_coord-x));
    figure += '<rect x="'+x_coord+'" y="'+y_coord+'" width="'+s_size+'" height="'+s_size+'" style="fill:'+color+';" />';
    sm_x_coord = x_coord + 10;
    sm_y_coord = y_coord + 10;
    x_rot = x + center;
    y_rot = y + center;
    sm_s_size = s_size - 20;
    figure += '<rect x="'+sm_x_coord+'" y="'+sm_y_coord+'" width="'+sm_s_size+'" height="'+sm_s_size+'" transform="rotate(45 '+x_rot+' '+y_rot+')" style="fill:rgb(255,255,255);" />';
    break;
    break;
  case 's8': // Circle with square
    x_coord = x + center*(1-size);
    y_coord = y + center*(1-size);
    s_size = 2*(center-(x_coord-x));
    cx_coord = x + center;
    cy_coord = y + center;
    r = size * center;
    figure += '<circle cx="'+cx_coord+'" cy="'+cy_coord+'" r="'+r+'" style="fill:'+color+';" />';
    sm_x_coord = x_coord + 10;
    sm_y_coord = y_coord + 10;
    sm_s_size = s_size - 20;
    figure += '<rect x="'+sm_x_coord+'" y="'+sm_y_coord+'" width="'+sm_s_size+'" height="'+sm_s_size+'" style="fill:rgb(255,255,255);" />';
    break;
  case 's9': // Circle with circle
    cx_coord = x + center;
    cy_coord = y + center;
    r = size * center;
    figure += '<circle cx="'+cx_coord+'" cy="'+cy_coord+'" r="'+r+'" style="fill:'+color+';" />';
    r = size * center - 10;
    figure += '<circle cx="'+cx_coord+'" cy="'+cy_coord+'" r="'+r+'" style="fill:rgba(255,255,255);" />';
    break;
  case 's10': // Circle with diamond
    x_coord = x + center*(1-size);
    y_coord = y + center*(1-size);
    s_size = 2*(center-(x_coord-x));
    cx_coord = x + center;
    cy_coord = y + center;
    r = size * center;
    figure += '<circle cx="'+cx_coord+'" cy="'+cy_coord+'" r="'+r+'" style="fill:'+color+';" />';
    sm_x_coord = x_coord + 10;
    sm_y_coord = y_coord + 10;
    sm_s_size = s_size - 20;
    x_rot = x + center;
    y_rot = y + center;
    figure += '<rect x="'+sm_x_coord+'" y="'+sm_y_coord+'" width="'+sm_s_size+'" height="'+sm_s_size+'" transform="rotate(45 '+x_rot+' '+y_rot+')" style="fill:rgb(255,255,255);" />';
    break;
  case 'none':
    x_coord = x + center*(1-size);
    y_coord = y + center*(1-size);
    s_size = 2*(center-(x_coord-x));
    figure += '<rect x="'+x_coord+'" y="'+y_coord+'" width="'+s_size+'" height="'+s_size+'" style="fill:'+color+';" />';
    break;
  default:
    x_coord = x + center*(1-size)
    y_coord = y + center*(1-size)
    s_size = 2*(center-(x_coord-x))
    figure += '<rect x="'+x_coord+'" y="'+y_coord+'" width="'+s_size+'" height="'+s_size+'" style="fill:'+color+';" />';
    break;
  }
  return figure;
}
/////////////////////////////////////////////////

// Section *. customization

function updateCustomization(what) {
  console.log('Controls:', $('#controls button'));
  fbutton = $('#controls button')[0];
  sbutton = $('#controls button')[1];
  if (what == 'kernel') {
    $(sbutton).removeClass('active');
    $(fbutton).addClass('active');
    $('#activations').empty();
    $('#kernel-slider').empty();
    for (k_indx in kernels) {
      $('#kernel-slider').append(getKernel(kernels[k_indx]));
    }
    $('#kernel-slider').append('<div id="kernel-editor-button" clickable onclick="openEditor()">+</div>')
  } else if (what == 'kernel-sequence') {
    $(fbutton).removeClass('active');
    $(sbutton).addClass('active');
    $('#activations').empty();
    $('#kernel-slider').empty();
    for (k_indx in kernel_sequences) {
      $('#kernel-slider').append(getKernelSequence(kernel_sequences[k_indx]));
    }
    $('#kernel-slider').append('<div id="kernel-editor-button" clickable onclick="openSequenceEditor()">+</div>')
  }
}

function openEditor() {
  if (active_kernel != -1) {
    current_k_id = '#kernel-' + active_kernel;
    $(current_k_id).removeClass('active');
  }
  editor = '<div id="kernel-editor">';
  editor += '<p>Kernel editor</p>';
  // Kernel name and threshold
  editor += 'Kernel name: <input id="editor-kernel-name"></input>';
  editor += 'Kernel threshold: <input id="editor-kernel-threshold"></input>';
  // Kernel itself
  editor += '<div id="editor-kernel-container">';
  editor += '<div id="editor-kernel">';
  editor += '<input class="editor-kernel-cell">';
  editor += '<input class="editor-kernel-cell">';
  editor += '<input class="editor-kernel-cell">';
  editor += '<input class="editor-kernel-cell">';
  editor += '</div></div>';
  //Instructions and warnings
  editor += '<p>Instructions</p>';
  editor += '<div id="editor-instructions-container">';
  editor += '1. Specify name and threshold (>=1) <br>';
  editor += '2. Fullfil kernel cells. Note each cell can be of three types (use specification in brackets): <br>';
  editor += '&nbsp; 2.1 Cell can represent any event (use *). Note such cell would not be highlighted! <br>';
  editor += '&nbsp; 2.2 Cell can be parametric (use one of x,y,z or w) <br>';
  editor += '&nbsp; 2.3 Cell can specify activities and performers separately. You can specify numerous activities or performers or use parameter. For activities please use shortcut written in metadata. (s1/s2;x) <br>';
  editor += '3. Make sure there is no warnings in section below and then submit kernel <br>';
  editor += '</div>';
  editor += '<p>Warnings</p>';
  editor += '<div id="editor-warnings-container">';
  editor += '</div>';
  editor += '<div id="editor-submit-container"><button id="editor-submit">Submit</button></div>'
  editor += '</div>';
  $('#activations').empty().append(editor);
  checkWarnings();
  $('#editor-kernel-name').bind('paste keyup', checkName);
  $('#editor-kernel-threshold').bind('paste keyup', checkThreshold);
  $('.editor-kernel-cell').bind('paste keyup', checkCells);
  $('#editor-submit').click(submitKernel);
}

function checkWarnings() {
  $('#editor-warnings-container').empty();
  $('#editor-submit').prop('disabled', false);
  for (warning in editor_warnings) {
    if (!editor_warnings[warning]) {
      if (warning == 'name') {
        $('#editor-warnings-container').append('<div class="warning">Please specify name.</div>');
        $('#editor-submit').prop('disabled', true);
      }
      if (warning == 'threshold') {
        $('#editor-warnings-container').append('<div class="warning">Please specify threshold.</div>');
        $('#editor-submit').prop('disabled',true);
      }
      if (warning == 'right_threshold') {
        $('#editor-warnings-container').append('<div class="warning">Check threshold.</div>');
        $('#editor-submit').prop('disabled',true);
      }
      if (warning == 'cells') {
        $('#editor-warnings-container').append('<div class="warning">Please specify cells.</div>');
        $('#editor-submit').prop('disabled', true);
      }
      if (warning == 'right_cells') {
        $('#editor-warnings-container').append('<div class="warning">Check correctness of cells.</div>');
        $('#editor-submit').prop('disabled',true);
      }
    }
  }
}

function checkName() {
  if ($('#editor-kernel-name').val() != '') {
    editor_warnings.name = true;
  } else {
    editor_warnings.name = false;
  }
  checkWarnings();
}

function checkThreshold() {
  threshold = $('#editor-kernel-threshold').val();
  if (threshold != '') {
    threshold = parseInt(threshold, 10);
    if (threshold && threshold >= 1) {
      editor_warnings.threshold = true;
      editor_warnings.right_threshold = true;
    } else {
      editor_warnings.threshold = true;
      editor_warnings.right_threshold = false;
    }
  } else {
    editor_warnings.threshold = false;
    editor_warnings.right_threshold = true;
  }
  checkWarnings();
}

function checkCells() {
  cells = $('.editor-kernel-cell');
  var confirmation_of_rightness = true;
  var confirmation_of_fullness = true;
  for (var i = 0; i < cells.length; i++) {
    cell = cells[i].value;
    if (cell != '') {
      if (!checkCell(cell)) {
        editor_warnings.right_cells = false;
        confirmation_of_rightness = false;
      }
    } else {
      confirmation_of_fullness = false;
      editor_warnings.cells = false;
    }
  }
  if (confirmation_of_rightness) {
    editor_warnings.right_cells = true;
  }
  if (confirmation_of_fullness) {
    editor_warnings.cells = true;
  }
  checkWarnings();
}

function checkCell(cell_str) {
  if (cell_str == '*' || cell_str == 'x' || cell_str == 'y' || cell_str == 'z' || cell_str == 'w') {
    return true;
  } else {
    if (cell_str.indexOf(';') != -1) {
      cell_list_split = cell_str.split(';');
      if (cell_list_split.length == 2) {
        activities = cell_list_split[0];
        performers = cell_list_split[1];
        if (checkActivities(activities) && checkPerformers(performers)) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
}

function checkActivities(activities) {
  if (activities == 'x' || activities == 'y' || activities == 'z' || activities == 'w') {
    return true;
  } else {
    existing_activities = Object.values(shapes);
    if (activities.indexOf('/') != -1) {
      activities_list = activities.split('/');
      for (act_indx in activities_list) {
        activity = activities_list[act_indx];
        if (!existing_activities.includes(activity)) {
          return false;
        }
      }
      return true;
    } else {
      if (!existing_activities.includes(activities)) {
        return false;
      } else {
        return true;
      }
    }
  }
}

function checkPerformers(performers) {
  if (performers == 'x' || performers == 'y' || performers == 'z' || performers == 'w') {
    return true;
  } else {
    existing_performers = Object.keys(colors);
    if (performers.indexOf('/') != -1) {
      performers_list = performers.split('/');
      for (perf_indx in performers_list) {
        performer = performers_list[perf_indx];
        if (!existing_performers.includes(performer)) {
          return false;
        }
      }
      return true;
    } else {
      if (!existing_performers.includes(performers)) {
        return false;
      } else {
        return true;
      }
    }
  }
}

function submitKernel() {
  console.log('Submission started');
  name = $('#editor-kernel-name').val();
  threshold = $('#editor-kernel-threshold').val();
  cells_container = $('.editor-kernel-cell');
  var cells = [];
  for (var i = 0; i < cells_container.length; i++) {
    cells.push(cells_container[i].value);
  }
  $.ajax({
    url: host + 'kernel',
    data: JSON.stringify({
      case: caseColumnName,
      activity: activityColumnName,
      performer: performerColumnName,
      extension: extension_to_send,
      file: file_to_send,
      threshold: parseInt(threshold),
      cells: cells,
      number: kernels.length,
    }),
    dataType: 'json',
    method: 'POST',
    success: function (response) {
      console.log('Kernel submitted');
      kernels.push({threshold: parseInt(threshold), tl: cells[0], tr: cells[1], bl: cells[2], br: cells[3], number: kernels.length, name: name});
      activations_list.push(response.activations);
      console.log('New activation list', activations_list);
      console.log('New Kernels list', kernels);
      updateCustomization('kernel');
      changeKernel(kernels.length - 1);
      editor_warnings = {
        name: false,
        threshold: false,
        right_threshold: true,
        cells: false,
        right_cells: true,
      };
    }
  })
}

function trunc(str) {
  return (str.length > 10 && str) ? str.substr(0,10) + '...' : str
}

function getKernel(kernel) {
  console.log(kernel);
  k = '<div class="kernel-container" clickable id="kernel-' + kernel.number + '" onclick="changeKernel(' + kernel.number + ')">';
  k += '<div class="kernel-info">';
  k += '<p>' + trunc(kernel.name) + '</p>';
  k += '<p>TH: ' + kernel.threshold + '</p>';
  total = (wsa.nrows-1) * (wsa.ncols-1);
  k += '<p>TD: </p>';
  k += '</div>';
  k += '<div class="kernel">';
  k += getKernelCell(kernel.tl);
  k += getKernelCell(kernel.tr);
  k += getKernelCell(kernel.bl);
  k += getKernelCell(kernel.br);
  return k + '</div></div>'
}

function getKernelSequence(kernel_sequence) {
  k = '<div class="kernel-sequence-container" clickable id="kernel-' + kernel_sequence.number + '" onclick="changeKernelSequence(' + kernel_sequence.number + ')">';
  k += '<div class="kernel-info">';
  k += '<p>' + trunc(kernel_sequence.name) + '</p>';
  k += '<p>TH: ' + kernel_sequence.threshold + '</p>';
  k += '<p>TD: </p>';
  k += '<p>RD: </p>';
  k += '</div>';
  k += '<div class="kernel-sequence">';
  k_seq_length = kernel_sequence.kernels.length;
  seq_kernels = kernel_sequence.kernels;
  seq_relations = kernel_sequence.relations;
  for (var i=0; i < k_seq_length; i++) {
    k += '<div class="kernel">';
    k += getKernelCell(seq_kernels[i].tl);
    k += getKernelCell(seq_kernels[i].tr);
    k += getKernelCell(seq_kernels[i].bl);
    k += getKernelCell(seq_kernels[i].br);
    k += '</div>';
    if (i != k_seq_length - 1) {
      k+= '<div class="relation">'
        if (seq_relations[i] == 'strict') {
          k += '&#10233;'
        } else {
          k += '&#10230;'
        }
      k += '</div>'
    }
  }
  return k + '</div></div>'
}

function getActivation(activation, activation_number, kernel_number) {
  k = '<div class="activation-container" id="activation-' + kernel_number +'-' + activation_number + '">';
  k += '<div class="activation">';
  k += getActivationMatrix(activation.matrix);
  k += '</div>';
  k += '<div class="activation-info">';
  k += '<p>TD: </p>';
  k += '<p>RD: </p>';
  k += '</div>';
  k += '<div class="activation-visibility">'
  if (activation.highlighted) {
    k += '<i class="fas fa-eye fa-2x" onclick="toggleActivation(' + activation_number + ')"></i>'
  } else {
    k += '<i class="fas fa-eye-slash fa-2x" onclick="toggleActivation(' + activation_number + ')"></i>'
}
  return k + '</div></div>'
}

function toggleActivation(act_indx) {
  activation = activations_list[active_kernel].activations[act_indx];
  console.log('Gighlight', current_highlight);
  console.log('This activation', activation);
  console.log(this.className);
  coords = activation.coords;
  area = activation.area;
  for (coord_indx in coords) {
    row = coords[coord_indx][0]
    col = coords[coord_indx][1]
    if (activation.highlighted) {
      console.log('HIghlighted');
      current_highlight[row][col] -= area[0][0];
      current_highlight[row][col+1] -= area[0][1];
      current_highlight[row+1][col] -= area[1][0];
      current_highlight[row+1][col+1] -= area[1][1];
    } else {
      console.log('Not yet HIghlighted');
      current_highlight[row][col] += area[0][0];
      current_highlight[row][col+1] += area[0][1];
      current_highlight[row+1][col] += area[1][0];
      current_highlight[row+1][col+1] += area[1][1];
    }
  }
  redraw();
  act_id = '#activation-' + active_kernel + '-' + act_indx;
  if (activation.highlighted) {
    activation.highlighted = false;
    $(act_id).find('.fa-eye').removeClass('fa-eye').addClass('fa-eye-slash');
  } else {
    $(act_id).find('.fa-eye-slash').removeClass('fa-eye-slash').addClass('fa-eye');
    activation.highlighted = true;
  }
}

function getActivationMatrix(matrix) {
  matr = '';
  for (row_indx in matrix) {
    for (col_indx in matrix[row_indx]) {
      cell = matrix[row_indx][col_indx];
      c = '<div class="activation-cell">'
      if (cell == '*') {
        c += 'any'
      } else if (cell == 'x_param' || cell == 'y_param' || cell == 'z_param' || cell == 'w_param') {
        c += cell.charAt(0);
      } else {
        c += '<svg width="' + 40 + '" height="' + 40 + '">';
        c += getFigure(cell[0], cell[1], 1, 40, 0, 0);
        c += '</svg>'
      }
      c += '</div>'
      matr += c;
    }
  }
  return matr
}

function getKernelCell(cell) {
  // c = ''
  // if (cell == 'x' || cell == 'y' || cell == 'z' || cell == 'w') {
  //   c += cell;
  // } else if (cell == '*') {
  //   c += 'any'
  // } else {
  //   res = cell.split(';');
  //   activity = res[0];
  //   console.log('Kernel to print activity', activity);
  //   performer = res[1];
  //   console.log('Kernel to print performer', performer);
  //   if (activity == 'x' || activity == 'y' || activity == 'z' || activity == 'w') {
  //     a = activity;
  //   } else {
  //     if (activity.indexOf('/') !== -1) {
  //         all_activities = activity.split('/');
  //         for (act_indx in all_activities) {
  //           c += all_activities[act_indx] + ' ';
  //         }
  //     } else {
  //       c += activity
  //     }
  //   }
  //   if (performer == 'x' || performer == 'y' || performer == 'z' || performer == 'w') {
  //     p = performer;
  //   } else {
  //     if (performer.indexOf('/') !== -1) {
  //         all_performers = performer.split('/');
  //         for (perf_indx in all_performers) {
  //           c += all_pertformers[perf_indx] + ' ';
  //         }
  //     } else {
  //       c += performer
  //     }
  //   }
  // }
  return '<div class="kernel-cell">' + cell + '</div>'
}

function changeKernel(kernel_num) {
  console.log(kernel_num);
  console.log(active_kernel);
  previous_k_id = '#kernel-' + active_kernel;
  $(previous_k_id).removeClass('active');
  k_id = '#kernel-' + kernel_num;
  $(k_id).addClass('active');
  active_kernel = kernel_num;
  activations = activations_list[active_kernel].activations;
  highlight = activations_list[active_kernel].highlight;
  $('#activations').empty();
  for (act_indx in activations) {
    activation = activations[act_indx];
    $('#activations').append(getActivation(activation, act_indx, kernel_num));
  }
  current_highlight = highlight;
  redraw();
  $('#show-initial-wsa').show();
}

function changeKernelSequence(kernel_seq_num) {

}

function restoreWSA() {
  $('.kernel-container.active').removeClass('active');
  $('#activations').empty();
  var highlights = [];
  for(var i=0; i<wsa.nrows; i++) {
    highlights[i] = [];
    for(var j=0; j<wsa.ncols; j++) {
      highlights[i][j] = 1;
    }
  }
  current_highlight = highlights;
  redraw();
}

function redraw() {
  var svg = drawWSA(wsa.matrix, wsa.nrows, wsa.ncols, current_highlight);
  $('#artifact-container').empty().append(svg);
}
