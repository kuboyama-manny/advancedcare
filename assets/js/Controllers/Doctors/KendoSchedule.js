function KendoScheduler(config) {

  var _ks = this;

  //default value
  _ks.selector = '#scheduler';
  _ks.doctor = null;
  _ks.doctor_id = null;
  _ks.event_doctor_id = null;
  _ks.zone_name = moment.tz.guess();
  _ks.showWorkHours = localStorage.getItem('calendarShowWorkHours') == 'true';

  //apply config
  Object.keys(config).forEach(
    function (key) {
      _ks[key] = config[key]
    }
  );

  var APIService = config.APIService;
  var showErrorModal = config.showErrorModal;

  _ks.changeDoctor = function (id) {
    _ks.doctor_id = id;
    _ks.event_doctor_id = null;
    _ks.kendoScheduler.dataSource.read();
  };

  _ks.model = {
    id: "id",
    fields: {
      id: { from: "id", type: "number" },
      title: { name: "Title", defaultValue: "No title", },
      start: { type: "date", from: "start_at" },
      end: { type: "date", from: "end_at" },
      description: { from: "notes" },
      recurrenceId: { from: "recurrence_id" },
      recurrenceRule: { from: "repeat_on" },
      recurrenceException: { from: "recurrence_exception" },
      isAllDay: { type: "boolean", from: "all_day_event" },
      patient_id: {},
      is_virtual: { type: "boolean", require: true }
    }
  };

  _ks.loadAPIRecursive = function (api, elements, onComplete) {
    elements = elements.split('.');

    var fetch = function (page, onComplete, entries) {
      if (typeof  entries === 'undefined' || entries == null) entries = [];

      APIService.get(api + '?page=' + page).then(function (response) {
        if (!response) {
          return showErrorModal('Can\'t load data!', true)
        }
        if (!response.s || response.s !== 's') {
          return showErrorModal(response.m)
        }

        var new_entries = response.result;
        elements.forEach(function (value) {
          value && ( new_entries = new_entries[value] )
        });

        entries = entries.concat(new_entries);

        if (response.paging.page < response.paging.total / response.paging.count) {
          return fetch(page + 1, onComplete, entries);
        } else {
          return onComplete(entries);
        }
      });
    };

    fetch(1, onComplete);
  };

  _ks.checkResponse = function (response) {
    return response !== undefined && response.s && response.s === 's';
  };

  _ks.navigate = function (e) {
    if (e.action === 'changeWorkDay') {
      localStorage.setItem('calendarShowWorkHours', e.isWorkDay);
    }
  };

  _ks.error = function (e) {
    console.log('Schedule Error:', e);
    showErrorModal(e.xhr.m);
  };

  _ks.transportRead = function (options) {
    APIService.get('/appointment?doctor_id=' + _ks.doctor_id)
      .then(function (response) {
        return _ks.checkResponse(response) ? options.success(response) : options.error(response);
      });
  };

  _ks.transportCreate = function (options) {
    options.data.status = 1; //for munro
    options.data.doctor_id = _ks.event_doctor_id || _ks.doctor_id;
    options.data.end_at = options.data.end_at.getTime();
    options.data.start_at = options.data.start_at.getTime();
    APIService.post('/appointment', options.data)
      .then(function (response) {
        return _ks.checkResponse(response) ? options.success(response) : options.error(response);
      });
  };

  _ks.transportUpdate = function (options) {
    options.data.status = 1; //for munro
    options.data.doctor_id = _ks.event_doctor_id || _ks.doctor_id;
    options.data.end_at = options.data.end_at.getTime();
    options.data.start_at = options.data.start_at.getTime();
    APIService.put('/appointment?id=' + options.data.id, options.data)
      .then(function (response) {
        return _ks.checkResponse(response) ? options.success(response) : options.error(response);
      });
  };

  _ks.transportDestroy = function (options) {
    APIService.delete('/appointment?id=' + options.data.id)
      .then(function (response) {
        return _ks.checkResponse(response) ? options.success(response) : options.error(response);
      });
  };

  _ks.edit = function (e) {
    var $container = e.container;

    // update the start of recurrence event (for custom template)
    $container.find("[data-role=recurrenceeditor]").data("kendoRecurrenceEditor").setOptions({
      start: new Date(e.event.start),
    });

    if (e.event.video_session && e.event.video_session.length) {
      var videoUrl = window.HOME_URL + "/#/video?session_id=" + e.event.video_session
        + "&name=" + _ks.doctor.profile.first_name + '%20' + _ks.doctor.profile.last_name;

      var $linkVideo = $('<a href="' + videoUrl + '" target="_blank" title="Launch Video"' +
        'style="vertical-align: middle;margin: 8px 10px 9px 20px;display: inline-block; font-size:18px">' +
        '<i class="fa fa-video-camera" aria-hidden="true"></i></a>');
      $container.find("[data-container-for=is_virtual]").append($linkVideo);
    }

    $container.find("select[data-bind='value:patient_id']").kendoDropDownList({
      filter: 'contains',
      dataTextField: 'full_name',
      dataValueField: 'id',
      autoWidth: true,
      enable: !e.event.patient_id,
      template: '<span><span class="k-scheduler-mark" style="background-color:#: color #"></span>#: full_name #</span>',
      dataSource: _ks.patientDataSource,
    });

    $container.find("select[data-bind='value:is_virtual']").kendoDropDownList({
      dataTextField: 'text',
      dataValueField: 'value',
      valuePrimitive: true,
      autoWidth: true,
      template: '<span><span class="k-scheduler-mark" style="background-color:#: color #"></span>#: text #</span>',
      dataSource: _ks.virtualDataSource,
    });
  };

  _ks.patientDataSource = new kendo.data.DataSource({
    transport: {
      read: function (options) {
        _ks.loadAPIRecursive('/patient', 'patients', function (patients) {
          options.success(patients);
        });
      }
    },
    sort: { field: 'text', dir: 'asc' },
    schema: {
      parse: function (response) {
        return response.map(function (patient) {
          patient.full_name = patient.first_name + ' ' + patient.last_name;
          patient.color = '#' + ( Math.random() * 0xFFFFFF << 0 ).toString(16);
          patient.value = patient.id; // fix bug show patient.color on calendar
          return patient;
        });
      }
    }
  });

  _ks.virtualDataSource = new kendo.data.DataSource({
    data: [
      { text: "Yes", value: true, color: "#39f862" },
      { text: "No", value: false, color: "#ed635d" }
    ]
  });

  _ks.dataSource = {
    transport: {
      read: _ks.transportRead,
      create: _ks.transportCreate,
      update: _ks.transportUpdate,
      destroy: _ks.transportDestroy
    },
    requestEnd: function (e) {
      var type = e.type;
      if (_ks.event_doctor_id && ( type == 'create' || type == 'update' )) {
        window.location = '#/home/dev/' + _ks.event_doctor_id;
      }
    },
    error: _ks.error,
    schema: {
      errors: "error",
      data: function (response) {
        if (!( response && response.result && response.result.appointments )) {
          showErrorModal('Failed on load appointments!', true);
        }
        return response.result.appointments.map(function (appointment) {
          appointment.doctor_id = _ks.doctor_id;
          appointment.end_at = new Date(appointment.end_at);
          appointment.start_at = new Date(appointment.start_at);
          return appointment;
        });
      },
      model: _ks.model
    }
  };

  _ks.dataBound = function (e) {
    _ks.boundCallback && _ks.boundCallback(e);
  };

  //init kendoScheduler
  _ks.run = function () {
    if (!_ks.doctor_id) {
      console.error('No doctor selected!');
      return;
    }

    $(_ks.selector).kendoScheduler({
      date: new Date(),
      height: 600,
      minorTickCount: 4,
      majorTick: 60,
      mobile: _ks.mobile(),
      showWorkHours: _ks.showWorkHours,
      views: [
        { type: "day" },
        { type: "week", selected: true, workWeekStart: 1, workWeekEnd: 7 }
      ],
      eventTemplate: _ks.getEventTemplate(),
      allDayEventTemplate: _ks.getEventTemplate(),
      editable: {
        template: _ks.getEditTemplate(),
      },
      dataBound: _ks.dataBound,
      timezone: _ks.zone_name,
      dataSource: _ks.dataSource,
      navigate: _ks.navigate,
      edit: _ks.edit,

      resources: [{
        field: "patient_id",
        title: "Patient",
        dataColorField: "color",
        dataSource: _ks.patientDataSource,
      }, {
        field: "is_virtual",
        title: "Virtual",
        dataSource: _ks.virtualDataSource
      }]
    });

    _ks.kendoScheduler = $(_ks.selector).data('kendoScheduler');
  };

  _ks.getEditTemplate = function () {
    return `
    <div class="k-edit-label"><label for="title">Title</label></div>
    <div data-container-for="title" class="k-edit-field">
        <input type="text" class="k-input k-textbox" name="Title" required="required" data-bind="value:title">
      </div>
    <div class="k-edit-label">
        <label for="start">Start</label>
      </div>
    <div data-container-for="start" class="k-edit-field">
        <input type="text"
               data-role="datetimepicker"
               data-interval="15"
               data-type="date"
               data-bind="value:start,invisible:isAllDay"
               name="start"/>
        <input type="text" data-type="date" data-role="datepicker" data-bind="value:start,visible:isAllDay" name="start" />
        <span data-bind="text: startTimezone"></span>
        <span data-for="start" class="k-invalid-msg" style="display: none;"></span>
      </div>
    <div class="k-edit-label"><label for="end">End</label></div>
    <div data-container-for="end" class="k-edit-field">
        <input type="text" data-type="date" data-role="datetimepicker" data-bind="value:end,invisible:isAllDay" name="end" data-datecompare-msg="End date should be greater than or equal to the start date" />
        <input type="text" data-type="date" data-role="datepicker" data-bind="value:end,visible:isAllDay" name="end" data-datecompare-msg="End date should be greater than or equal to the start date" />
        <span data-bind="text: endTimezone"></span>
        <span data-bind="text: startTimezone, invisible: endTimezone"></span>
        <span data-for="end" class="k-invalid-msg" style="display: none;"></span>
      </div>
    <div class="k-edit-label"><label for="isAllDay">All day event</label></div>
    <div data-container-for="isAllDay" class="k-edit-field">
        <input type="checkbox" name="isAllDay" data-type="boolean" data-bind="checked:isAllDay">
      </div>
    <div class="k-edit-label"><label for="recurrenceRule">Repeat</label></div>
    <div data-container-for="recurrenceRule" class="k-edit-field">
        <div data-bind="value:recurrenceRule" name="recurrenceRule" data-role="recurrenceeditor"></div>
      </div>
    <div class="k-edit-label"><label for="description">Description</label></div>
    <div data-container-for="description" class="k-edit-field">
        <textarea name="description" class="k-textbox" data-bind="value:description"></textarea>
    </div>
   <div class="k-edit-label"><label for="patient_id">Patient</label></div>
    <div data-container-for="patient_id" class="k-edit-field">
      <select id="patient_id" data-bind="value:patient_id" name="Patient" required></select>
    </div>

    <div class="k-edit-label"><label for="Virtual">Virtual</label></div>
    <div data-container-for="is_virtual" class="k-edit-field">
      <select id="Virtual" data-bind="value:is_virtual" name="Virtual" required></select>
    </div>
      `;
  };

  _ks.getEventTemplate = function () {
    return `
      <span  class='k-event-template'>#: title #
        #if(is_virtual) { # <i class="fa fa-video-camera" aria-hidden="true"></i># } #
      </span>
    `;
  };

  _ks.mobile = function () {
    var md = new MobileDetect(window.navigator.userAgent);
    if (md.tablet()) { return 'tablet' }
    if (md.phone()) { return 'phone' }
    return false;
  };

  _ks.run();
}


var newPatient = {
  $dialog: null,
  kendoWindow: null,
  patientInput: null,
  newPatient: null,
  getForm: function () {
    if (newPatient.$dialog) {
      return new Promise(function (resolve, reject) {
        resolve();
      });
    }

    return new Promise(function (resolve, reject) {
      jQuery.get('assets/views/home/new-patient.html')
        .then(function (response) {
          newPatient.$dialog = $(response);
          newPatient.$dialog.kendoWindow({
            title: 'Create new patient',
            actions: ["Close"],
            resizable: false,
            draggable: false,
            modal: true,
            position: {
              top: 200,
              left: "calc(50% - 220px)"
            },
            width: "440px"
          });
          newPatient.kendoWindow = newPatient.$dialog.data("kendoWindow");
          newPatient.$dialog.find("[name='dob']").kendoDatePicker();
          newPatient.$dialog.find(".form-submit").off('click').click(newPatient.save);
          newPatient.$dialog.find(".form-cancel").off('click').click(newPatient.cancel);
          resolve();
        });
    });
  },

  open: function (patientInput, APIService, saveCallback) {
    newPatient.APIService = APIService;
    newPatient.saveCallback = saveCallback;
    newPatient.patientInput = patientInput;

    this.getForm().then(function () {
      newPatient.kendoWindow.open();
    });
  },

  save: function (e) {
    e.preventDefault();

    var date = new Date(newPatient.$dialog.find('[name=dob]').val());
    var dob = date.getTime() - date.getTimezoneOffset() * 60 * 1000;

    newPatient.addingPatient = {
      id: null,
      first_name: newPatient.$dialog.find('[name=first_name]').val(),
      last_name: newPatient.$dialog.find('[name=last_name]').val(),
      email: newPatient.$dialog.find('[name=email]').val(),
      phone_number: newPatient.$dialog.find('[name=phone_number]').val(),
      dob: dob,
      gender: null
    };

    newPatient.$dialog.find(':input').attr('disabled');
    newPatient.APIService.post('/sign/up/1', {
      profile: newPatient.addingPatient,
      role: "patient"
    }).then(function (response) {
      if (response) {
        newPatient.$dialog.find(':input').removeAttr('disabled');
        if (response.s === 'f') {
          return alert(response.m);
        }
        newPatient.addingPatient.id = response.result.direct_id;
        newPatient.kendoWindow.close();
        newPatient.saveCallback(newPatient.addingPatient);

      }
    });
    return false;
  },

  cancel: function (e) {
    e.preventDefault();
    newPatient.kendoWindow.close();
    return false;
  }
};

function patientTableSelector(patientInput, patientDataSource, config) {
  var _pts = this;
  _pts.APIService = config.APIService;
  var showErrorModal = config.showErrorModal;

  _pts.patientInput = patientInput;
  _pts.patientDataSource = patientDataSource;
  _pts.selectedPatient = 0;

  _pts.columns = [{
    field: "id", title: "ID", width: '80px'
  }, {
    field: "full_name", title: "Full Name"
  }, {
    field: "email", title: "Email"
  }, {
    field: "gender", title: "Gender",
    width: '100px',
    template: "# if (gender != 'U') { if (gender == 'M') { # Male # } else { # Female # } } #"
  }, {
    field: "phone_number",
    title: "Phone Number",
    width: '160px'
  }, {
    field: "",
    width: '50px',
    template: "<label class='css-input css-radio css-radio-info'>" +
    "<input type='radio' name='selectedPatient' value='#: id #'>" +
    "<span></span></label>"
  }];

  _pts.popupLink = $('#open_patient_selector');
  _pts.popupLink.click(function () {
    _pts.selectedPatient = _pts.patientInput.val() || '';
    _pts.filter.val(_pts.selectedPatient).trigger('change');

    _pts.patientDataSource.pageSize(5);
    _pts.popup.data("kendoWindow").open();
  });

  _pts.popup = $(
    '<div id="patientsTableContainer">' +
    '<div style="margin: 10px 0">' +
    '<label>Search</label>: &nbsp; <input class="k-input k-textbox" style="width: 50%">' +
    '<a id="newPatient" class="k-button k-primary pull-right">New Patient</a>' +
    '</div>' +
    '<div id="patientsTable"></div>' +
    '<div class="k-edit-buttons k-state-default mgT-10 pull-right">' +
    '<button class="k-button k-primary form-submit" style="margin-right: 30px">OK</button>' +
    '<button class="k-button form-cancel" href="#" type="reset">Cancel</button>' +
    '</div>' +
    '</div>');
  _pts.patientInput.append(_pts.popup);

  _pts.addPatientlink = _pts.popup.find('a#newPatient');
  _pts.table = _pts.popup.find('#patientsTable');
  _pts.filter = _pts.popup.find('input');

  _pts.addPatientlink.on('click touchstart', function (e) {
    e.preventDefault();
    newPatient.open(_pts.patientInput, _pts.APIService, function (patient) {
      patient.full_name = patient.first_name + ' ' + patient.last_name;
      _pts.patientDataSource.add(patient);
      _pts.selectedPatient = patient.id;
      _pts.filter.val(patient.id).trigger('change');
    });
  });

  _pts.table.kendoGrid({
    dataSource: _pts.patientDataSource,
    filterable: { mode: "none" },
    sortable: true,
    pageable: {
      pageSize: 5,
      pageSizes: true,
      buttonCount: 5
    },
    columns: _pts.columns
  });

  _pts.popup.kendoWindow({
    width: "1000px",
    title: "Patients",
    closable: true,
    actions: ["Close"],
    resizable: false,
    // draggable: false,
    modal: true,
    position: {
      top: 100,
      left: "calc(50% - 500px)"
    }
  });
  _pts.popupK = _pts.popup.data('kendoWindow');

  _pts.popup.change('[name=selectedPatient]', function () {
    _pts.selectedPatient = $('[name=selectedPatient]:checked').val();
  });

  _pts.popup.find(".form-submit").click(function () {
    if (_pts.selectedPatient) {
      _pts.patientInput.val(_pts.selectedPatient).trigger('change');
      _pts.popupK.close();
      resetData();
    } else {
      showErrorModal('Please select a patient');
    }
  });

  _pts.popup.find(".form-cancel").click(function () {
    _pts.popupK.close();
    resetData();
  });

  _pts.filter.on('keyup change', function () {
    const val = _pts.filter.val();
    const filters = [
      { field: "id", operator: "eq", value: val },
      { field: "full_name", operator: "contains", value: val },
      { field: "email", operator: "contains", value: val },
      { field: "phone_number", operator: "contains", value: val }
    ];
    _pts.patientDataSource.filter({ logic: "or", filters: filters });
    $('[name=selectedPatient]').val([_pts.selectedPatient]);
  });

  function resetData() {
    _pts.patientDataSource.filter({});
    _pts.patientDataSource.pageSize(-1);
  }
}