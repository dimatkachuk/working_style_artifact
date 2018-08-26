const host = 'http://127.0.0.1:5000/';

var act_figure_size = 35;

var file_to_send = '';
var extension_to_send = '';
var max_size = 50;
var caseColumnName = '';
var activityColumnName = '';
var performerColumnName = '';

var colors = [];
var shapes = [];

var measures = [];

var new_measure = {
        'name': '',
        'constituents': [true, false, false, false],
        'ignored': [false, false, false],
        'sizes': [true,true],
        'values': [],
        'total': 0,
        'max_total': 0
    }

var wsa = [];
var total = 0;
var total_active = 0;
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
var activations_list = [];
var activations_sorting = 'no-sorting';
var activations_before_sorting = [];
var editor_relation_num = 2;
var unseen_all = false;
current_highlight = [];
initial_kernel_highlight = [];

var kernel_sequences = [
  {
    name: 'Act1 -> param',
    number: 0,
    threshold: 1,
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
    relations: ['.','strict'],
  },
];
var active_kernel_sequence = -1;
var activation_sequences_list = [];
var activation_sequences_sorting = 'no-sorting';
var activation_sequences_before_sorting = [];
var unseen_all_sequences = false;



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

function clone (existingArray) {
   var newObj = (existingArray instanceof Array) ? [] : {};
   for (i in existingArray) {
      if (i == 'clone') continue;
      if (existingArray[i] && typeof existingArray[i] == "object") {
         newObj[i] = clone(existingArray[i]);
      } else {
         newObj[i] = existingArray[i]
      }
   }
   return newObj;
}

// Section 1. File upload and preprocessing /////////////////////////////////

function getFile() {
  var logFile = $('#log-file').prop('files')[0];
  var extension = logFile.name.split('.')[1];
  extension_to_send = extension;
  if (checkFileExtension(extension)) { // File extension check
    $('#input-file-container').css('display','none');
    $('#column-choice-container').css('display','flex');
    processFile(logFile, extension);
  } else { // If file has wrong extension
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
    }
    if (lcColumnName.includes('activity')) {
      activityColumnName = columns[colNum];
    }
    if (lcColumnName.includes('performer') || lcColumnName.includes('resource')) {
      performerColumnName = columns[colNum];
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

function changeSize(n) {
  if (n === 0) {
    $('#size-button-0').addClass('active');
    $('#size-button-1').removeClass('active');
    $('#size-button-2').removeClass('active');
    max_size = 50;
    redraw();
  } else if (n === 1) {
    $('#size-button-0').removeClass('active');
    $('#size-button-1').addClass('active');
    $('#size-button-2').removeClass('active');
    max_size = 60;
    redraw();
  } else {
    $('#size-button-0').removeClass('active');
    $('#size-button-1').removeClass('active');
    $('#size-button-2').addClass('active');
    max_size = 80;
    redraw();
  }
}

// Section 2. Server communication /////////////////////////////////

function send_file_json() {
  buttons = '<button id="size-button-0" class="size-button active" onclick="changeSize(0)">1x</button>';
  buttons += '<button id="size-button-1" class="size-button" onclick="changeSize(1)">2x</button>';
  buttons += '<button id="size-button-2" class="size-button" onclick="changeSize(2)">4x</button>';
  $('#resize-container').append(buttons);
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
      measures.push(response.measure);
      console.log('measures', measures);
      total = response.total;
      kernels[0].total_active = response.total_active;
      kernel_sequences[0].total_active = response.total_active_seq;
      activations_list.push(response.activations);
      for (act_indx in activations_list) {
        activations = activations_list[act_indx].activations;
        for (act_indx in activations) {
          activation = activations[act_indx];
          highlight_size = 0;
          for (row_indx in activation.area) {
            for (col_indx in activation.area[row_indx]) {
              highlight_size += activation.area[row_indx][col_indx];
            }
          }
          activation.td = activation.number*highlight_size / total;
          activation.rd = activation.number*highlight_size / kernels[0].total_active
        }
      }
      activation_sequences_list.push(response.activation_sequences);
      highlight_size = 0;
      for (act_seq_indx in activation_sequences_list) {
        activation_sequence = activation_sequences_list[act_seq_indx];
        for (act_indx in activation_sequence.activations) {
          activation = activation_sequence.activations[act_indx];
          relation_indx = parseInt(act_indx) + 1;
          if (act_indx !== (kernel_sequences[kernel_sequence_number].kernels.length-1) && kernel_sequences[kernel_sequence_number].relations[relation_indx] === 'strict') {
            for (row_indx in activation.area) {
              highlight_size += activation.area[row_indx][0];
            }
          } else {
            for (row_indx in activation.area) {
              for (col_indx in activation.area[row_indx]) {
                highlight_size += activation.area[row_indx][col_indx];
              }
            }
          }
        }
        activation_sequence.td = activation_sequence.number*highlight_size / total;
        activation_sequence.rd = activation_sequence.number*highlight_size / kernel_sequences[0].total_active
      }
      var highlights = [];
      for(var i=0; i<wsa.nrows; i++) {
        highlights[i] = [];
        for(var j=0; j<wsa.ncols; j++) {
          highlights[i][j] = 2;
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
      for (indx in colors) {
        color = '<p class="metadata-color" style="color:' + colors[indx] + '">';
        color += indx;
        color += '</p>'
        $('#metadata-performers').append(color);
      }

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
  if (highlight === 0 && cell[0] != 'none') {
    color = 'rgb(176,176,178)';
  } else if (cell[0] === 'none') {
    color = 'rgb(255,255,255)'
  } else if (highlight === 1) {
    color = 'rgb(125,132,145)';
  } else {
    color = cell[1];
  }
  cell_svg += getFigure(cell[0], color, cell[2], max_size, x, y);
  if (highlight > 2) {
    cell_svg += getRedPoint(x,y);
  }
  return(cell_svg)
}

function getRedPoint(x,y) {
  x_coord = x + 7;
  y_coord = y + 7;
  return '<circle cx="' + x_coord +'" cy="' + y_coord +'" r="5" style="fill:#AF2344"/>';
}

function getFigure(shape, color, size, max_size, x, y) {
  figure = '';
  size = size*0.8;
  center = max_size / 2;
  switch(shape) {
  case 's1': // Square
    x_coord = x + center*(1-size);
    y_coord = y + center*(1-size);
    s_w_size = 2*(center-(x_coord-x));
    s_h_size = 2*(center-(x_coord-x));
    figure += '<rect x="'+x_coord+'" y="'+y_coord+'" width="'+s_w_size+'" height="'+s_h_size+'" style="fill:'+color+';" />';
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
    figure += '<rect x="'+ (x_coord + 10) +'" y="'+y_coord+'" width="'+ '6px' +'" height="'+s_size+'" style="fill:'+color+';" />';
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
  fbutton = $('#controls button')[0];
  sbutton = $('#controls button')[1];
  tbutton = $('#controls button')[2];
  if (what == 'kernel') {
    $(sbutton).removeClass('active');
    $(tbutton).removeClass('active');
    $(fbutton).addClass('active');
    $('#activations').empty();
    $('#kernel-slider').empty();
    $('#kernel-slider').removeClass('line');
    for (k_indx in kernels) {
      $('#kernel-slider').append(getKernel(kernels[k_indx]));
    }
    $('#kernel-slider').append('<div id="kernel-editor-button" clickable onclick="openEditor(false)">+</div>')
  } else if (what == 'kernel-sequence') {
    $(fbutton).removeClass('active');
    $(tbutton).removeClass('active');
    $(sbutton).addClass('active');
    $('#activations').empty();
    $('#kernel-slider').empty();
    $('#kernel-slider').removeClass('line');
    for (k_indx in kernel_sequences) {
      $('#kernel-slider').append(getKernelSequence(kernel_sequences[k_indx]));
    }
    $('#kernel-slider').append('<div id="kernel-editor-button" clickable onclick="openSequenceEditor()">+</div>')
  } else if (what === 'measures') {
    $(fbutton).removeClass('active');
    $(tbutton).addClass('active');
    $(sbutton).removeClass('active');
    $('#activations').empty();
    $('#kernel-slider').empty();
    $('#kernel-slider').addClass('line');
    $('#activations').append(getUserMeasures());
    $('#activations').append(getMeasureEditor());
  }
}

function submitMeasure() {
  new_measure.name = $('#measure-editor-name').val();
  $.ajax({
    url: host + 'measure',
    data: JSON.stringify({
      case: caseColumnName,
      activity: activityColumnName,
      performer: performerColumnName,
      extension: extension_to_send,
      file: file_to_send,
      measure: new_measure
    }),
    dataType: 'json',
    method: 'POST',
    success: function (response) {
      measures.push(response.measure);
      updateCustomization('measures');
      new_measure = {
              'name': '',
              'constituents': [true, false, false, false],
              'ignored': [false, false, false],
              'sizes': [true,true],
              'values': [],
              'total': 0,
              'max_total': 0
          }
    }
  })
}

function getMeasureEditor() {
  editor = '<div class="measure-editor-container">';
    editor += '<p class="editor-name">Measure Editor</p>';
    editor += 'Measure name: <input id="measure-editor-name"/>';
    editor += '<div class="editor-buttons-container">';
      editor += '<p class="editor-disclaimer">Ignore</p>';
      editor += '<button class="editor-button" id="editor-ignore-0" onclick=ignoreMeasure(0)>Performers</button>';
      editor += '<button class="editor-button" id="editor-ignore-1" onclick=ignoreMeasure(1)>Activities</button>';
      editor += '<button class="editor-button" id="editor-ignore-2" onclick=ignoreMeasure(2)>Time</button>';
    editor += '</div>';
    editor += '<div class="editor-buttons-container">';
      editor += '<p class="editor-disclaimer">Include measures</p>';
      editor += '<button class="editor-button active" id="editor-measure-0" onclick=toggleMeasure(0)>x-axis</button>';
      editor += '<button class="editor-button" id="editor-measure-1" onclick=toggleMeasure(1)>y-axis</button>';
      editor += '<button class="editor-button" id="editor-measure-2" onclick=toggleMeasure(2)>diagonal</button>';
      editor += '<button class="editor-button" id="editor-measure-3" onclick=toggleMeasure(3)>anti-diagonal</button>';
    editor += '</div>';
    editor += '<div class="editor-buttons-container">';
      editor += '<p class="editor-disclaimer">Sizes</p>';
      editor += '<button class="editor-button active" id="editor-size-0" onclick=toggleSize(0)>2x2</button>';
      editor += '<button class="editor-button active" id="editor-size-1" onclick=toggleSize(1)>3x3</button>';
    editor += '</div>';
    editor += '<div class="submit-button-container">';
    editor += '<button class="submit-button" onclick="submitMeasure()">Add measure</button>';
    editor += '</div>';
  editor += '</div>';
  return editor;
}

function ignoreMeasure(n) {
  new_measure.ignored[n] = !new_measure.ignored[n];
  if (new_measure.ignored[n]) {
    $('#editor-ignore-' + n).addClass('active');
  } else {
    $('#editor-ignore-' + n).removeClass('active');
  }
}

function toggleMeasure(n) {
  new_measure.constituents[n] = !new_measure.constituents[n];
  if (new_measure.constituents[n]) {
    $('#editor-measure-' + n).addClass('active');
  } else {
    $('#editor-measure-' + n).removeClass('active');
  }
}

function toggleSize(n) {
  new_measure.sizes[n] = !new_measure.sizes[n];
  if (new_measure.sizes[n]) {
    $('#editor-size-' + n).addClass('active');
  } else {
    $('#editor-size-' + n).removeClass('active');
  }
}

function getUserMeasures() {
  names = ['x-axis half-symmetry', 'y-axis half-symmetry', 'diagonal symmetry', 'anti-diagonal symmetry'];
  ignore = ['performer ignored', 'activity ignored', 'time ignored'];
  m = '';
  for (m_indx in measures) {
    measure = measures[m_indx];
    console.log(measure);
    m += '<div class="measure-container">';
      m += '<div class="measure-info-column">';
      m += '<p class="measure-name">'+ measure.name +'</p>';
      for (c_indx in measure.constituents) {
        present = measure.constituents[c_indx];
        if (present) {
          m += '<p class="measure-constituent">' + names[c_indx] + '</p>';
        }
      }
      for (c_indx in measure.ignored) {
        present = measure.ignored[c_indx];
        if (present) {
          m += '<p class="measure-ignore">' + ignore[c_indx] + '</p>';
        }
      }
      m += '</div>';
      m += '<div class="measure-value-column">';
      for (s_indx in measure.sizes) {
        size = parseInt(s_indx) + 2;
        exists = measure.sizes[s_indx];
        values = measure.values[s_indx];
        if (exists) {
          m += '<div class="measure-value-container">';
          m += '<p class="measure-value-name">' + size + 'x' + size + '</p>';
          m += '<p class="measure-value"><span>' + values[1].toFixed(2) + '</span> / ' + values[0].toFixed(2) + '</p>';
          m += '</div>';
        }
      }
      m += '<div class="measure-value-container">';
      m += '<p class="measure-value-name">' + 'Total' + '</p>';
      m += '<p class="measure-value"><span>' + measure.total.toFixed(2) + '</span> / ' + measure.max_total.toFixed(2) + '</p>';
      m += '</div>';
      m += '</div>';
    m += '</div>';
  }
  return m;
}

function openEditor(withKernel) {
  if (!withKernel && active_kernel != -1) {
    current_k_id = '#kernel-' + active_kernel;
    $(current_k_id).removeClass('active');
  }
  editor = '<div id="kernel-editor">';
  editor += '<p>Kernel editor</p>';
  // Kernel name and threshold
  editor += 'Kernel name: <input id="editor-kernel-name" ';
  if (withKernel) {
    editor += 'value="' + kernels[active_kernel].name + '"';
  }
  editor += '>';
  editor += 'Kernel threshold: <input id="editor-kernel-threshold" ';
  if (withKernel) {
    editor += 'value="' + kernels[active_kernel].threshold + '"';
  }
  editor += '>';
  // Kernel itself
  editor += '<div id="editor-kernel-container">';
  editor += '<div id="editor-kernel">';
  editor += '<input class="editor-kernel-cell" ';
  if (withKernel) {
    editor += 'value="' + kernels[active_kernel].tl + '"';
  }
  editor += '>';
  editor += '<input class="editor-kernel-cell" ';
  if (withKernel) {
    editor += 'value="' + kernels[active_kernel].tr + '"';
  }
  editor += '>';
  editor += '<input class="editor-kernel-cell" ';
  if (withKernel) {
    editor += 'value="' + kernels[active_kernel].bl + '"';
  }
  editor += '>';
  editor += '<input class="editor-kernel-cell" ';
  if (withKernel) {
    editor += 'value="' + kernels[active_kernel].br + '"';
  }
  editor += '>';
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
  editor += '<div id="editor-submit-container"><button id="editor-submit">'
  if (withKernel) {
    editor += 'Update';
  } else {
    editor += 'Submit';
  }
  editor += '</button>';
  editor += '<button id ="editor-close">Close</button>'
  editor += '</div>';
  editor += '</div>';
  $('#big-editor').css('display', 'flex');
  $('#editor-container').empty().append(editor);
  if (withKernel) {
    checkName();
    checkThreshold();
    checkCells();
  }
  checkWarnings();
  $('#editor-kernel-name').bind('paste keyup', checkName);
  $('#editor-kernel-threshold').bind('paste keyup', checkThreshold);
  $('.editor-kernel-cell').bind('paste keyup', checkCells);
  if (withKernel) {
    $('#editor-submit').click(updateKernel);
  } else {
    $('#editor-submit').click(submitKernel);
  }
  $('#editor-close').click(closeEditor);
}

function openSequenceEditor(withKernelSequence) {
  if (!withKernelSequence && active_kernel_sequence != -1) {
    current_k_s_id = '#kernel-sequence-' + active_kernel_sequence;
    $(current_k_s_id).removeClass('active');
  }
  editor = '<div id="kernel-sequence-editor">';
  editor += '<p>Kernel Sequence editor</p>';
  // Kernel name and threshold
  editor += 'Kernel sequence name: <input id="editor-kernel-sequence-name" ';
  if (withKernelSequence) {
    editor += 'value="' + kernel_sequences[active_kernel_sequence].name + '"';
  }
  editor += '>';
  editor += 'Kernel sequence threshold: <input id="editor-kernel-sequence-threshold" ';
  if (withKernelSequence) {
    editor += 'value="' + kernel_sequences[active_kernel_sequence].threshold + '"';
  }
  editor += '>';
  // Kernel itself
  editor += '<div id="editor-kernel-sequence-container">';
  if (withKernelSequence) {
    kernel_sequence = kernel_sequences[active_kernel_sequence];
    editor += '<div id="editor-kernel-sequence">';
    for (indx in kernel_sequence.relations) {
      console.log(kernel_sequence.relations[indx]);
      console.log(indx);
      if (kernel_sequence.relations[indx] === 'strict') {
        editor += '<div class="editor-relation">';
        editor += '<button class="editor-relation-button active" id="relation-button-strict-' + indx + '" value="strict" onclick="changeRelationToStrict(' + indx + ')">&#10233;</button>';
        editor += '<button class="editor-relation-button" id="relation-button-nonstrict-' + indx + '" value="non-strict" onclick="changeRelationToNonStrict(' + indx + ')">&#10230;</button>';
        editor += '</div>';
      } else if (kernel_sequence.relations[indx] === 'non-strict') {
        editor += '<div class="editor-relation">';
        editor += '<button class="editor-relation-button" id="relation-button-strict-' + indx + '" value="strict" onclick="changeRelationToStrict(' + indx + ')">&#10233;</button>';
        editor += '<button class="editor-relation-button active" id="relation-button-nonstrict-' + indx + '" value="non-strict" onclick="changeRelationToNonStrict(' + indx + ')">&#10230;</button>';
        editor += '</div>';
      }
      kernel = kernel_sequence.kernels[indx];
      editor += '<div class="editor-kernel">';
        editor += '<input class="editor-kernel-cell" ';
        editor += 'value="' + kernel.tl + '"';
        editor += '>';
        editor += '<input class="editor-kernel-cell" ';
        editor += 'value="' + kernel.tr + '"';
        editor += '>';
        editor += '<input class="editor-kernel-cell" ';
        editor += 'value="' + kernel.bl + '"';
        editor += '>';
        editor += '<input class="editor-kernel-cell" ';
        editor += 'value="' + kernel.br + '"';
        editor += '>';
      editor += '</div>';
    }
    editor += '</div>';
  } else {
    editor += '<div id="editor-kernel-sequence">';
      // First kernel
      editor += '<div class="editor-kernel">';
        editor += '<input class="editor-kernel-cell" ';
        // if (withKernel) {
        //   editor += 'value="' + kernels[active_kernel].tl + '"';
        // }
        editor += '>';
        editor += '<input class="editor-kernel-cell" ';
        // if (withKernel) {
        //   editor += 'value="' + kernels[active_kernel].tr + '"';
        // }
        editor += '>';
        editor += '<input class="editor-kernel-cell" ';
        // if (withKernel) {
        //   editor += 'value="' + kernels[active_kernel].bl + '"';
        // }
        editor += '>';
        editor += '<input class="editor-kernel-cell" ';
        // if (withKernel) {
        //   editor += 'value="' + kernels[active_kernel].br + '"';
        // }
        editor += '>';
      editor += '</div>';
    // Relation
      editor += '<div class="editor-relation">';
      editor += '<button class="editor-relation-button active" id="relation-button-strict-1" value="strict" onclick="changeRelationToStrict(1)">&#10233;</button>';
      editor += '<button class="editor-relation-button" id="relation-button-nonstrict-1" value="non-strict" onclick="changeRelationToNonStrict(1)">&#10230;</button>';
      editor += '</div>';

      // Second kernel
      editor += '<div class="editor-kernel">';
        editor += '<input class="editor-kernel-cell" ';
        // if (withKernel) {
        //   editor += 'value="' + kernels[active_kernel].tl + '"';
        // }
        editor += '>';
        editor += '<input class="editor-kernel-cell" ';
        // if (withKernel) {
        //   editor += 'value="' + kernels[active_kernel].tr + '"';
        // }
        editor += '>';
        editor += '<input class="editor-kernel-cell" ';
        // if (withKernel) {
        //   editor += 'value="' + kernels[active_kernel].bl + '"';
        // }
        editor += '>';
        editor += '<input class="editor-kernel-cell" ';
        // if (withKernel) {
        //   editor += 'value="' + kernels[active_kernel].br + '"';
        // }
        editor += '>';
        editor += '</div>';
    editor += '</div>';
  }
  editor += '<button id="add-kernel-sequence-button" onclick="addKernelToSequence(';
  editor += editor_relation_num;
  editor += ')">+</button>';
  editor += '</div>';
  //Instructions and warnings
  editor += '<p>Instructions</p>';
  // editor += '<div id="editor-instructions-container">';
  // editor += '1. Specify name and threshold (>=1) <br>';
  // editor += '2. Fullfil kernel cells. Note each cell can be of three types (use specification in brackets): <br>';
  // editor += '&nbsp; 2.1 Cell can represent any event (use *). Note such cell would not be highlighted! <br>';
  // editor += '&nbsp; 2.2 Cell can be parametric (use one of x,y,z or w) <br>';
  // editor += '&nbsp; 2.3 Cell can specify activities and performers separately. You can specify numerous activities or performers or use parameter. For activities please use shortcut written in metadata. (s1/s2;x) <br>';
  // editor += '3. Make sure there is no warnings in section below and then submit kernel <br>';
  // editor += '</div>';
  editor += '<p>Warnings</p>';
  editor += '<div id="editor-warnings-container">';
  editor += '</div>';
  editor += '<div id="editor-submit-container"><button id="editor-submit">'
  if (withKernelSequence) {
    editor += 'Update';
  } else {
    editor += 'Submit';
  }
  editor += '</button>';
  editor += '<button id="editor-close">Close</button>';
  editor += '</div>';
  editor += '</div>';
  $('#big-editor').css('display', 'flex');
  $('#editor-container').empty().append(editor);
  // if (withKernel) {
  //   checkName();
  //   checkThreshold();
  //   checkCells();
  // }
  // checkWarnings();
  // $('#editor-kernel-name').bind('paste keyup', checkName);
  // $('#editor-kernel-threshold').bind('paste keyup', checkThreshold);
  // $('.editor-kernel-cell').bind('paste keyup', checkCells);
  if (withKernelSequence) {
    $('#editor-submit').click(updateKernelSequence);
  } else {
    $('#editor-submit').click(submitKernelSequence);
  }
  $('#editor-close').click(closeEditor);
}

function addKernelToSequence(relation_num) {
  console.log('Relation number', relation_num);
  editor = '<div class="editor-relation">';
  editor += '<button class="editor-relation-button active" id="relation-button-strict-';
  editor += relation_num;
  editor += '" value="strict" onclick="changeRelationToStrict(';
  editor += relation_num;
  editor += ')">&#10233;</button>';
  editor += '<button class="editor-relation-button" id="relation-button-nonstrict-';
  editor += relation_num;
  editor += '" value="non-strict" onclick="changeRelationToNonStrict(';
  editor += relation_num;
  editor += ')">&#10230;</button>';
  editor += '</div>';
  editor += '<div class="editor-kernel">';
  editor += '<input class="editor-kernel-cell" ';
  // if (withKernel) {
  //   editor += 'value="' + kernels[active_kernel].tl + '"';
  // }
  editor += '>';
  editor += '<input class="editor-kernel-cell" ';
  // if (withKernel) {
  //   editor += 'value="' + kernels[active_kernel].tr + '"';
  // }
  editor += '>';
  editor += '<input class="editor-kernel-cell" ';
  // if (withKernel) {
  //   editor += 'value="' + kernels[active_kernel].bl + '"';
  // }
  editor += '>';
  editor += '<input class="editor-kernel-cell" ';
  // if (withKernel) {
  //   editor += 'value="' + kernels[active_kernel].br + '"';
  // }
  editor += '>';
  editor += '</div>';
  editor_relation_num += 1;
  $('#editor-kernel-sequence').append(editor);
}

function changeRelationToStrict(number) {
  $('#relation-button-strict-' + number).addClass('active');
  $('#relation-button-nonstrict-' + number).removeClass('active');
}

function changeRelationToNonStrict(number) {
  $('#relation-button-nonstrict-' + number).addClass('active');
  $('#relation-button-strict-' + number).removeClass('active');
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
  $('#big-editor').css('display', 'none');
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
      kernels.push({threshold: parseInt(threshold), tl: cells[0], tr: cells[1], bl: cells[2], br: cells[3], number: kernels.length, name: name});
      kernels[kernels.length - 1].total_active = response.total_active;
      activations_list.push(response.activations);
      for (act_indx in activations_list) {
        activations = activations_list[act_indx].activations;
        for (act_indx in activations) {
          activation = activations[act_indx];
          highlight_size = 0;
          for (row_indx in activation.area) {
            for (col_indx in activation.area[row_indx]) {
              highlight_size += activation.area[row_indx][col_indx];
            }
          }
          activation.td = activation.number*highlight_size / total;
          activation.rd = activation.number*highlight_size / kernels[kernels.length-1].total_active
        }
      }
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

function submitKernelSequence() {
  $('#big-editor').css('display', 'none');
  name = $('#editor-kernel-sequence-name').val();
  threshold = $('#editor-kernel-sequence-threshold').val();
  cells_container = $('.editor-kernel-cell');
  kernels_number = cells_container.length / 4;
  new_kernels = [];
  for (var i = 0; i < kernels_number; i++) {
    new_kernels.push([]);
    new_kernels[i].push(cells_container[i*4].value);
    new_kernels[i].push(cells_container[i*4 + 1].value);
    new_kernels[i].push(cells_container[i*4 + 2].value);
    new_kernels[i].push(cells_container[i*4 + 3].value);
  }
  relations_container = $('.editor-relation-button.active');
  relations = ['.'];
  for (var i = 0; i <  relations_container.length; i++) {
    relations.push(relations_container[i].value);
  }
  $.ajax({
    url: host + 'kernel_sequence',
    data: JSON.stringify({
      case: caseColumnName,
      activity: activityColumnName,
      performer: performerColumnName,
      extension: extension_to_send,
      file: file_to_send,
      threshold: parseInt(threshold),
      kernels: new_kernels,
      relations: relations,
      number: new_kernels.length,
    }),
    dataType: 'json',
    method: 'POST',
    success: function (response) {
      kernels_to_put = [];
      for (var i = 0; i < kernels_number; i++) {
        kernel = {
          tl: new_kernels[i][0],
          tr: new_kernels[i][1],
          bl: new_kernels[i][2],
          br: new_kernels[i][3],
        }
        kernels_to_put.push(kernel);
      }
      kernel_sequences.push({threshold: parseInt(threshold), kernels: kernels_to_put, relations: relations, number: kernel_sequences.length, name: name});
      kernel_sequences[kernel_sequences.length - 1].total_active = response.total_active_seq;
      activation_sequences_list.push(response.activation_sequences);

      for (act_seq_indx in activation_sequences_list) {
        console.log('act list', activations_list[act_indx]);
        // activations = activations_list[act_indx].activations;
        // for (act_indx in activations) {
        //   activation = activations[act_indx];
        //   highlight_size = 0;
        //   for (row_indx in activation.area) {
        //     for (col_indx in activation.area[row_indx]) {
        //       highlight_size += activation.area[row_indx][col_indx];
        //     }
        //   }
        //   activation.td = activation.number*highlight_size / total;
        //   activation.rd = activation.number*highlight_size / kernels[kernels.length-1].total_active
        // }
      }

      updateCustomization('kernel-sequence');
      changeKernelSequence(kernel_sequences.length - 1);
      // editor_warnings = {
      //   name: false,
      //   threshold: false,
      //   right_threshold: true,
      //   cells: false,
      //   right_cells: true,
      // };
    }
  })
}


function updateKernelSequence() {
  $('#big-editor').css('display', 'none');
  name = $('#editor-kernel-sequence-name').val();
  threshold = $('#editor-kernel-sequence-threshold').val();
  cells_container = $('.editor-kernel-cell');
  kernels_number = cells_container.length / 4;
  new_kernels = [];
  for (var i = 0; i < kernels_number; i++) {
    new_kernels.push([]);
    new_kernels[i].push(cells_container[i*4].value);
    new_kernels[i].push(cells_container[i*4 + 1].value);
    new_kernels[i].push(cells_container[i*4 + 2].value);
    new_kernels[i].push(cells_container[i*4 + 3].value);
  }
  relations_container = $('.editor-relation-button.active');
  relations = ['.'];
  for (var i = 0; i <  relations_container.length; i++) {
    relations.push(relations_container[i].value);
  }
  $.ajax({
    url: host + 'kernel_sequence',
    data: JSON.stringify({
      case: caseColumnName,
      activity: activityColumnName,
      performer: performerColumnName,
      extension: extension_to_send,
      file: file_to_send,
      threshold: parseInt(threshold),
      kernels: new_kernels,
      relations: relations,
      number: kernels.length,
    }),
    dataType: 'json',
    method: 'POST',
    success: function (response) {
      kernels_to_put = [];
      for (var i = 0; i < kernels_number; i++) {
        kernel = {
          tl: new_kernels[i][0],
          tr: new_kernels[i][1],
          bl: new_kernels[i][2],
          br: new_kernels[i][3],
        }
        kernels_to_put.push(kernel);
      }
      kernel_sequences[active_kernel_sequence] = {threshold: parseInt(threshold), kernels: kernels_to_put, relations: relations, number: active_kernel_sequence, name: name};
      kernel_sequences[active_kernel_sequence].total_active = response.total_active_seq;
      activation_sequences_list[active_kernel_sequence] = response.activation_sequences;
      this_act_sequences = activation_sequences_list[active_kernel_sequence].activation_sequences;
      kernel_sequence = kernel_sequences[active_kernel_sequence];
      for (act_seq_indx in this_act_sequences) {
        activation_sequence = this_act_sequences[act_seq_indx];
        highlight_size = 0;
        for (act_indx in activation_sequence.activations) {
          activation = activation_sequence.activations[act_indx];
          relation_indx = parseInt(act_indx) + 1;
          if (act_indx !== (kernel_sequences[active_kernel_sequence].kernels.length-1) && kernel_sequences[active_kernel_sequence].relations[relation_indx] === 'strict') {
            for (row_indx in activation.area) {
              highlight_size += activation.area[row_indx][0];
            }
          } else {
            for (row_indx in activation.area) {
              for (col_indx in activation.area[row_indx]) {
                highlight_size += activation.area[row_indx][col_indx];
              }
            }
          }
        }
        activation_sequence.td = (activation_sequence.number*highlight_size / total).toFixed(3);
        activation_sequence.rd = (activation_sequence.number*highlight_size / kernel_sequence.total_active).toFixed(3);
      }
      updateCustomization('kernel-sequence');
      changeKernelSequence(active_kernel_sequence);
      // editor_warnings = {
      //   name: false,
      //   threshold: false,
      //   right_threshold: true,
      //   cells: false,
      //   right_cells: true,
      // };
    }
  })
}

function closeEditor() {
  $('#big-editor').css('display', 'none');
}

function updateKernel() {
  $('#big-editor').css('display', 'none');
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
      number: kernels[active_kernel].number,
    }),
    dataType: 'json',
    method: 'POST',
    success: function (response) {
      kernels[active_kernel] = {threshold: parseInt(threshold), tl: cells[0], tr: cells[1], bl: cells[2], br: cells[3], number: kernels[active_kernel].number, name: name};
      kernels[active_kernel].total_active = response.total_active;
      activations_list[active_kernel] = response.activations;
      for (act_indx in activations_list) {
        activations = activations_list[act_indx].activations;
        for (act_indx in activations) {
          activation = activations[act_indx];
          highlight_size = 0;
          for (row_indx in activation.area) {
            for (col_indx in activation.area[row_indx]) {
              highlight_size += activation.area[row_indx][col_indx];
            }
          }
          activation.td = activation.number*highlight_size / total;
          activation.rd = activation.number*highlight_size / kernels[active_kernel].total_active
        }
      }
      updateCustomization('kernel');
      changeKernel(active_kernel);
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
  k = '<div class="kernel-container" clickable id="kernel-' + kernel.number + '" onclick="changeKernel(' + kernel.number + ')">';
  k += '<div class="kernel-info">';
  k += '<p>' + trunc(kernel.name) + '</p>';
  k += '<p>TH: ' + kernel.threshold + '</p>';
  k += '<p>TD: ' + (kernel.total_active / total).toFixed(3) + '</p>';
  k += '</div>';
  k += '<div class="kernel">';
  k += getKernelCell(kernel.tl);
  k += getKernelCell(kernel.tr);
  k += getKernelCell(kernel.bl);
  k += getKernelCell(kernel.br);
  return k + '</div></div>'
}

function getKernelSequence(kernel_sequence) {
  k = '<div class="kernel-sequence-container" clickable id="kernel-sequence-' + kernel_sequence.number + '" onclick="changeKernelSequence(' + kernel_sequence.number + ')">';
  k += '<div class="kernel-sequence-info">';
  k += '<p>' + trunc(kernel_sequence.name) + '</p>';
  k += '<p>TH: ' + kernel_sequence.threshold + '</p>';
  k += '<p>TD: ' + (kernel_sequence.total_active / total).toFixed(3) + '</p>';
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
      k+= '<div class="relation">';
        if (seq_relations[i+1] === 'strict') {
          k += '&#10233;'
        } else {
          k += '&#10230;'
        }
      k += '</div>'
    }
  }
  return k + '</div></div>'
}

function changeKernel(kernel_num) {
  previous_k_id = '#kernel-' + active_kernel;
  $(previous_k_id).removeClass('active');
  k_id = '#kernel-' + kernel_num;
  $(k_id).addClass('active');
  active_kernel = kernel_num;
  activations = activations_list[active_kernel].activations;
  activations_before_sorting = clone(activations);
  highlight = activations_list[active_kernel].highlight;
  getActivations(kernel_num);
  current_highlight = clone(highlight);
  for (row_indx in current_highlight) {
    for (col_indx in current_highlight[row_indx]) {
      if (current_highlight[row_indx][col_indx] > 0) {
        current_highlight[row_indx][col_indx] += 1;
      }
    }
  }
  initial_kernel_highlight = clone(current_highlight);
  redraw();
  $('#show-initial-wsa').show();
}

function changeKernelSequence(kernel_seq_num) {
  previous_k_s_id = '#kernel-sequence-' + active_kernel_sequence;
  $(previous_k_s_id).removeClass('active');
  k_s_id = '#kernel-sequence-' + kernel_seq_num;
  $(k_s_id).addClass('active');
  active_kernel_sequence = kernel_seq_num;
  activation_sequences = activation_sequences_list[active_kernel_sequence].activation_sequences;
  activation_sequences_before_sorting = clone(activation_sequences);
  console.log('Before sorting',activation_sequences_before_sorting);
  highlight = activation_sequences_list[active_kernel_sequence].highlight;
  getActivationSequences(kernel_seq_num);
  current_highlight = clone(highlight);
  for (row_indx in current_highlight) {
    for (col_indx in current_highlight[row_indx]) {
      if (current_highlight[row_indx][col_indx] > 0) {
        current_highlight[row_indx][col_indx] += 1;
      }
    }
  }
  initial_kernel_highlight = clone(current_highlight);
  redraw();
  $('#show-initial-wsa').show();
}

function sortActivationsByPerformer() {
  console.log('kernel', kernels[active_kernel]);
  this_kernel = kernels[active_kernel];
  row_to_sort_by = 0;
  element_to_sort_by = 0;
  if (this_kernel.tl === '*') {
    element_to_sort_by += 1;
    if (this_kernel.tr === '*') {
      row_to_sort_by += 1;
      element_to_sort_by = 0;
      if (this_kernel.bl === '*') {
        element_to_sort_by += 1;
      }
    }
  }
  console.log(row_to_sort_by, element_to_sort_by);
  let sorting_list = [];
  colors_list = Object.values(colors);
  for (let i = 0; i < Object.values(colors).length; i++) {
    sorting_list.push([]);
  }
  // Add one more list to include border elements
  sorting_list.push([]);
  for (act_indx in activations) {
    activation = activations[act_indx];
    console.log(activation);
    color = activation.matrix[row_to_sort_by][element_to_sort_by][1];
    console.log(color);
    index_to_put = colors_list.indexOf(color);
    if (index_to_put === -1) {
      sorting_list[sorting_list.length - 1].push(activation);
    } else {
      sorting_list[index_to_put].push(activation);
    }
  }
  return [].concat.apply([], sorting_list);
}

function sortActivationSequencesByPerformer() {
  // TODO: Check if need sorting by second, third or fourth element
  activation_to_sort_by = 0;
  row_to_sort_by = 0;
  element_to_sort_by = 0;
  let sorting_list = [];
  colors_list = Object.values(colors);
  for (let i = 0; i < Object.values(colors).length; i++) {
    sorting_list.push([]);
  }
  activation_sequences = activation_sequences_list[active_kernel_sequence].activation_sequences;
  for (act_seq_indx in activation_sequences) {
    activation_sequence = activation_sequences[act_seq_indx];
    activation = activation_sequence.activations[activation_to_sort_by];
    color = activation.matrix[row_to_sort_by][element_to_sort_by][1];
    index_to_put = colors_list.indexOf(color);
    sorting_list[index_to_put].push(activation_sequence);
  }
  return [].concat.apply([], sorting_list);
}

function sortActivationsByActivity() {
  console.log('kernel', kernels[active_kernel]);
  this_kernel = kernels[active_kernel];
  row_to_sort_by = 0;
  element_to_sort_by = 0;
  if (this_kernel.tl === '*') {
    element_to_sort_by += 1;
    if (this_kernel.tr === '*') {
      row_to_sort_by += 1;
      element_to_sort_by = 0;
      if (this_kernel.bl === '*') {
        element_to_sort_by += 1;
      }
    }
  }
  console.log(row_to_sort_by, element_to_sort_by);
  let sorting_list = [];
  for (let i = 0; i < Object.keys(shapes).length; i++) {
    sorting_list.push([]);
  }
  // Add one more list to include border elements
  sorting_list.push([]);
  for (act_indx in activations) {
    activation = activations[act_indx];
    index_to_put = parseInt((activation.matrix[row_to_sort_by][element_to_sort_by][0].slice(1,2))) - 1;
    if (index_to_put === -1) {
      sorting_list[sorting_list.length - 1].push(activation);
    } else {
      sorting_list[index_to_put].push(activation);
    }
  }
  return [].concat.apply([], sorting_list);
}

function sortActivationSequencesByActivity() {
  // TODO: Check if need sorting by second, third or fourth element
  activation_to_sort_by = 0;
  row_to_sort_by = 0;
  element_to_sort_by = 0;
  let sorting_list = [];
  for (let i = 0; i < Object.keys(shapes).length; i++) {
    sorting_list.push([]);
  }
  activation_sequences = activation_sequences_list[active_kernel_sequence].activation_sequences;
  for (act_seq_indx in activation_sequences) {
    activation_sequence = activation_sequences[act_seq_indx];
    activation = activation_sequence.activations[activation_to_sort_by];
    index_to_put = parseInt((activation.matrix[row_to_sort_by][element_to_sort_by][0].slice(1,2))) - 1;
    sorting_list[index_to_put].push(activation_sequence);
  }
  return [].concat.apply([], sorting_list);
}

function sortActivationsByDensity(what) {
  var len = activations_list[active_kernel].activations.length;
  new_list = clone(activations_list[active_kernel].activations);
  for (var i = len-1; i>=0; i--){
    for(var j = 1; j<=i; j++){
      if(new_list[j-1][what] < new_list[j][what]){
          var temp = new_list[j-1];
          new_list[j-1] = new_list[j];
          new_list[j] = temp;
       }
    }
  }
  return new_list;
}

function sortActivationSequencesByDensity(what) {
  var len = activation_sequences_list[active_kernel_sequence].activation_sequences.length;
  new_list = clone(activation_sequences_list[active_kernel_sequence].activation_sequences);
  console.log(activation_sequences_list[active_kernel_sequence].activation_sequences);
  for (var i = len-1; i>=0; i--){
    for(var j = 1; j<=i; j++){
      if(new_list[j-1][what] < new_list[j][what]){
          var temp = new_list[j-1];
          new_list[j-1] = new_list[j];
          new_list[j] = temp;
       }
    }
  }
  return new_list;
}

function getActivations(kernel_num) {
  $('#activations').empty();
  $('#activations').append(getActiovationsPanel(kernel_num));
  var acts;
  if (activations_sorting === 'performer') {
    acts = sortActivationsByPerformer();
  } else if (activations_sorting === 'activity') {
    acts = sortActivationsByActivity();
  } else if (activations_sorting === 'td') {
    acts = sortActivationsByDensity('td');
  } else if (activations_sorting === 'rd') {
    acts = sortActivationsByDensity('rd');
  } else {
    acts = activations_before_sorting;
  }
  activations_list[active_kernel].activations = acts;
  $('#activations').append('<div id="activations-list"></div>');
  for (act_indx in acts) {
    activation = acts[act_indx];
    $('#activations-list').append(getActivation(activation, act_indx, kernel_num));
  }
}

function getActivationSequences(kernel_seq_num) {
  $('#activations').empty();
  $('#activations').append(getActiovationSequencePanel(kernel_seq_num));
  var act_sequences;
  if (activation_sequences_sorting === 'performer') {
    act_sequences = sortActivationSequencesByPerformer();
  } else if (activation_sequences_sorting === 'activity') {
    act_sequences = sortActivationSequencesByActivity();
  } else if (activation_sequences_sorting === 'td') {
    act_sequences = sortActivationSequencesByDensity('td');
  } else {
    act_sequences = activation_sequences_before_sorting;
  }
  activation_sequences_list[active_kernel_sequence].activation_sequences = act_sequences;
  $('#activations').append('<div id="activation-sequences-list"></div>');
  for (act_seq_indx in act_sequences) {
    act_sequence = act_sequences[act_seq_indx];
    $('#activation-sequences-list').append(getActivationSequence(act_sequence, act_seq_indx, kernel_seq_num));
  }
}

function getActiovationsPanel(kernel_num) {
  p = '<div class="kernel-panel">';
  p += '<label id="kernel-panel-label"><span>Kernel: </span>' + kernels[kernel_num].name + '</label>';
  p += '<button onclick="openEditor(true)" id="update-kernel-button">Update kernel</button>';
  p += '</div>';
  p += '<p id="kernel-panel-title">Kernel Activations</p>'
  p += '<div class="activations-panel">';
  // Add select input for sorting
  p += '<label class="sorting-label">Sort by:</label>';

  p += '<button class="sorting-button';
  if (activations_sorting ==='no-sorting') {
    p += ' active';
  }
  p += '" id="sorting-button-no-sorting" onclick="changeSorting(0)">No sorting</button>';

  p += '<button class="sorting-button';
  if (activations_sorting ==='performer') {
    p += ' active';
  }
  p += '" id="sorting-button-performer" onclick="changeSorting(1)">Performer</button>';

  p += '<button class="sorting-button';
  if (activations_sorting ==='activity') {
    p += ' active';
  }
  p += '" id="sorting-button-activity" onclick="changeSorting(2)">Activity</button>';

  p += '<button class="sorting-button';
  if (activations_sorting ==='td') {
    p += ' active';
  }
  p += '" id="sorting-button-td" onclick="changeSorting(3)">TD</button>';

  p += '<button class="sorting-button';
  if (activations_sorting ==='rd') {
    p += ' active';
  }
  p += '" id="sorting-button-rd" onclick="changeSorting(4)">RD</button>';
  // Add Unseen all button
  p += '<button onclick="UnseenAll()" id="unseen-all-button">';
  p += '<i class="fas fa-eye-slash fa-2x"></i>';
  p+= '</button>';
  p += '</div>'
  return p;
}

function changeSorting(num) {
  if (num === 0) {
    sorting = 'no-sorting';
  } else if (num === 1) {
    sorting = 'performer';
  } else if (num === 2) {
    sorting = 'activity';
  } else if (num === 3) {
    sorting = 'td';
  } else if (num === 4) {
    sorting = 'rd';
  }
  activations_sorting = sorting;
  getActivations(active_kernel);
}

function getActiovationSequencePanel(kernel_seq_num) {
  p = '<div class="kernel-panel">';
  p += '<label id="kernel-panel-label"><span>Kernel sequence: </span>' + kernel_sequences[kernel_seq_num].name + '</label>';
  p += '<button onclick="openSequenceEditor(true)" id="update-kernel-button">Update kernel</button>';
  p += '</div>';
  p += '<p id="kernel-panel-title">Kernel Sequence Activations</p>'
  p += '<div class="activations-panel">';
  // Add select input for sorting
  p += '<label class="sorting-label">Sort by:</label>';

  p += '<button class="sorting-button';
  if (activation_sequences_sorting ==='no-sorting') {
    p += ' active';
  }
  p += '" id="sorting-button-no-sorting" onclick="changeSequenceSorting(0)">No sorting</button>';

  p += '<button class="sorting-button';
  if (activation_sequences_sorting ==='performer') {
    p += ' active';
  }
  p += '" id="sorting-button-performer" onclick="changeSequenceSorting(1)">Performer</button>';

  p += '<button class="sorting-button';
  if (activation_sequences_sorting ==='activity') {
    p += ' active';
  }
  p += '" id="sorting-button-activity" onclick="changeSequenceSorting(2)">Activity</button>';

  p += '<button class="sorting-button';
  if (activation_sequences_sorting ==='td') {
    p += ' active';
  }
  p += '" id="sorting-button-td" onclick="changeSequenceSorting(3)">TD</button>';

  p += '<button class="sorting-button';
  if (activation_sequences_sorting ==='rd') {
    p += ' active';
  }
  p += '" id="sorting-button-rd" onclick="changeSequenceSorting(4)">RD</button>';
  // Add Unseen all button
  p += '<button onclick="UnseenAllSequences()" id="unseen-all-button">';
  p += '<i class="fas fa-eye-slash fa-2x"></i>';
  p+= '</button>';
  p += '</div>'
  return p;
}

function changeSequenceSorting(num) {
  if (num === 0) {
    sorting = 'no-sorting';
  } else if (num === 1) {
    sorting = 'performer';
  } else if (num === 2) {
    sorting = 'activity';
  } else if (num === 3) {
    sorting = 'td';
  } else if (num === 4) {
    sorting = 'rd';
  }
  activation_sequences_sorting = sorting;
  getActivationSequences(active_kernel_sequence);
}

function getActivation(activation, activation_number, kernel_number) {
  k = '<div class="activation-container" id="activation-' + kernel_number +'-' + activation_number + '">';
  k += '<div class="activation">';
  k += getActivationMatrix(activation.matrix);
  k += '</div>';
  k += '<div class="activation-info">';
  highlight_size = 0;
  for (row_indx in activation.area) {
    for (col_indx in activation.area[row_indx]) {
      highlight_size += activation.area[row_indx][col_indx];
    }
  }
  k += '<p><span>TD:</span> ' + (activation.td).toFixed(3) + '</p>';
  k += '<p><span>RD:</span> ' + (activation.rd).toFixed(3) + '</p>';
  k += '</div>';
  k += '<div class="activation-visibility">'
  if (activation.highlighted) {
    k += '<i class="fas fa-eye fa-lg" onclick="toggleActivation(' + activation_number + ')"></i>'
  } else {
    k += '<i class="fas fa-eye-slash fa-lg" onclick="toggleActivation(' + activation_number + ')"></i>'
  }
  return k + '</div></div>'
}

function getActivationSequence(activation_sequence, activation_sequence_number, kernel_sequence_number) {
  k = '<div class="activation-sequence-container" id="activation-sequence-';
  k += kernel_sequence_number + '-' + activation_sequence_number + '">';
  k += '<div class="activation-sequence">';
  kernel_sequence = kernel_sequences[kernel_sequence_number];
  for (act_indx in activation_sequence.activations) {
    relation = kernel_sequence.relations[act_indx];
    if (relation === 'strict') {
      k += '<div class="relation">&#10233;</div>'
    } else if (relation === 'non-strict') {
      k += '<div class="relation">&#10230;</div>'
    }
    activation = activation_sequence.activations[act_indx];
    k += '<div class="activation">';
    k += getActivationMatrix(activation.matrix);
    k += '</div>';
  }
  k += '</div>';
  k += '<div class="activation-sequence-info">';
  k += '<p><span>TD:</span> ' + activation_sequence.td + '</p>';
  k += '<p><span>RD:</span> ' + activation_sequence.rd + '</p>';
  k += '</div>';
  k += '<div class="activation-visibility">'
  if (activation_sequence.highlighted) {
    k += '<i class="fas fa-eye fa-lg" onclick="toggleActivationSequence(' + activation_sequence_number + ')"></i>'
  } else {
    k += '<i class="fas fa-eye-slash fa-lg" onclick="toggleActivationSequence(' + activation_sequence_number + ')"></i>'
  }
  return k + '</div></div>'
}

function UnseenAll() {
  activations = activations_list[active_kernel].activations;
  for (act_indx in activations) {
    activation = activations[act_indx];
    coords = activation.coords;
    area = activation.area;
    act_id = '#activation-' + active_kernel + '-' + act_indx;
    if (unseen_all) {
      activation.highlighted = true;
      $(act_id).find('.fa-eye-slash').removeClass('fa-eye-slash').addClass('fa-eye');
    } else {
      activation.highlighted = false;
      $(act_id).find('.fa-eye').removeClass('fa-eye').addClass('fa-eye-slash');
    }
  }
  activations_list[active_kernel].activations = activations;
  if (unseen_all) {
    unseen_all = false;
    current_highlight = clone(initial_kernel_highlight);
    $('#unseen-all-button').find('.fa-eye').removeClass('fa-eye').addClass('fa-eye-slash');
  } else {
    unseen_all = true;
    for (row_indx in current_highlight) {
      for (col_indx in highlight[row_indx]) {
        if (current_highlight[row_indx][col_indx] > 0) {
          current_highlight[row_indx][col_indx] = 1;
        }
      }
    }
    $('#unseen-all-button').find('.fa-eye-slash').removeClass('fa-eye-slash').addClass('fa-eye');
  }
  redraw();
}

function UnseenAllSequences() {
  activation_sequences = activation_sequences_list[active_kernel_sequence].activation_sequences;
  for (act_seq_indx in activation_sequences) {
    activation_sequence = activation_sequences[act_seq_indx];
    act_seq_id = '#activation-sequence-' + active_kernel_sequence + '-' + act_seq_indx;
    if (unseen_all_sequences) {
      activation_sequence.highlighted = true;
      $(act_seq_id).find('.fa-eye-slash').removeClass('fa-eye-slash').addClass('fa-eye');
    } else {
      activation_sequence.highlighted = false;
      $(act_seq_id).find('.fa-eye').removeClass('fa-eye').addClass('fa-eye-slash');
    }
  }
  if (unseen_all_sequences) {
    unseen_all_sequences = false;
    current_highlight = clone(initial_kernel_highlight);
    $('#unseen-all-button').find('.fa-eye').removeClass('fa-eye').addClass('fa-eye-slash');
  } else {
    unseen_all_sequences = true;
    for (row_indx in current_highlight) {
      for (col_indx in highlight[row_indx]) {
        if (current_highlight[row_indx][col_indx] > 0) {
          current_highlight[row_indx][col_indx] = 1;
        }
      }
    }
    $('#unseen-all-button').find('.fa-eye-slash').removeClass('fa-eye-slash').addClass('fa-eye');
  }
  redraw();
}

function toggleActivation(act_indx) {
  activation = activations_list[active_kernel].activations[act_indx];
  coords = activation.coords;
  area = activation.area;
  for (coord_indx in coords) {
    row = coords[coord_indx][0]
    col = coords[coord_indx][1]
    if (activation.highlighted) {
      current_highlight[row][col] -= area[0][0];
      current_highlight[row][col+1] -= area[0][1];
      current_highlight[row+1][col] -= area[1][0];
      current_highlight[row+1][col+1] -= area[1][1];
    } else {
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

function toggleActivationSequence(act_seq_indx) {
  activation_sequence = activation_sequences_list[active_kernel_sequence].activation_sequences[act_seq_indx];
  for (act_indx in activation_sequence.activations) {
    activation = activation_sequence.activations[act_indx];
    coords = activation.coords;
    area = activation.area;
    for (coord_indx in coords) {
      row = coords[coord_indx][0]
      col = coords[coord_indx][1]
      if (activation_sequence.highlighted) {
        activation.highlighted = false;
        current_highlight[row][col] -= area[0][0];
        current_highlight[row][col+1] -= area[0][1];
        current_highlight[row+1][col] -= area[1][0];
        current_highlight[row+1][col+1] -= area[1][1];
      } else {
        activation.highlighted = true;
        current_highlight[row][col] += area[0][0];
        current_highlight[row][col+1] += area[0][1];
        current_highlight[row+1][col] += area[1][0];
        current_highlight[row+1][col+1] += area[1][1];
      }
    }
  }
  redraw();
  act_seq_id = '#activation-sequence-' + active_kernel_sequence + '-' + act_seq_indx;
  if (activation_sequence.highlighted) {
    activation_sequence.highlighted = false;
    $(act_seq_id).find('.fa-eye').removeClass('fa-eye').addClass('fa-eye-slash');
  } else {
    $(act_seq_id).find('.fa-eye-slash').removeClass('fa-eye-slash').addClass('fa-eye');
    activation_sequence.highlighted = true;
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
        c += '<svg width="' + act_figure_size + '" height="' + act_figure_size + '">';
        c += getFigure(cell[0], cell[1], 1, act_figure_size, 0, 0);
        c += '</svg>'
      }
      c += '</div>'
      matr += c;
    }
  }
  return matr
}

function getKernelCell(cell) {
  return '<div class="kernel-cell">' + cell + '</div>'
}

function restoreWSA() {
  $('.kernel-container.active').removeClass('active');
  $('#activations').empty();
  var highlights = [];
  for(var i=0; i<wsa.nrows; i++) {
    highlights[i] = [];
    for(var j=0; j<wsa.ncols; j++) {
      highlights[i][j] = 2;
    }
  }
  current_highlight = highlights;
  redraw();
}

function redraw() {
  var svg = drawWSA(wsa.matrix, wsa.nrows, wsa.ncols, current_highlight);
  $('#artifact-container').empty().append(svg);
}
