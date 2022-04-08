function KendoScheduler(config) {

  var _ks = this;

  //default value
  _ks.selector = '#scheduler';
  _ks.patient = null;
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
        // hot fix for patient: show only logged in patient
        response.result.appointments = response.result.appointments.filter(function (appointment) {
          return appointment.patient_id === _ks.patient.id;
        });
        return _ks.checkResponse(response) ? options.success(response) : options.error(response);
      });
  };

  _ks.transportCreate = function (options) {
    options.data.status = 1; //for munro
    options.data.patient_id = _ks.patient.id; //for patient scheduler
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
    options.data.patient_id = _ks.patient.id; //for patient scheduler
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

    $container.find("select[data-bind='value:is_virtual']").kendoDropDownList({
      dataTextField: 'text',
      dataValueField: 'value',
      valuePrimitive: true,
      autoWidth: true,
      template: '<span><span class="k-scheduler-mark" style="background-color:#: color #"></span>#: text #</span>',
      dataSource: _ks.virtualDataSource,
    });
  };

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
      minorTickCount: 2,
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

    <div class="k-edit-label"><label for="Virtual">Virtual</label></div>
    <div data-container-for="is_virtual" class="k-edit-field">
      <select id="Virtual" data-bind="value:is_virtual" name="Virtual" required="required"></select>
    </div>
    <!--<div class="k-edit-label"><label for="clinic_id">Clinic</label></div>
    <div data-container-for="clinic_id" class="k-edit-field">
      <select id="clinic_id" data-bind="value:clinic_id" name="Clinic" required="required"></select>
    </div>

    <div class="k-edit-label"><label for="visit_type_id">Visit type</label></div>
    <div data-container-for="visit_type_id" class="k-edit-field">
      <select id="visit_type_id" data-bind="value:visit_type_id" name="visit_type_id"></select>
    </div>
    
    <div class="k-edit-label"><label for="visit_type_id">Fee $</label></div>
    <div data-container-for="fee" class="k-edit-field">
      <input  class="k-input k-textbox" id="fee" data-bind="value:fee" name="fee">
    </div>-->
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
    if (md.tablet()) {
      return 'tablet'
    }
    if (md.phone()) {
      return 'phone'
    }
    return false;
  };

  _ks.run();
}