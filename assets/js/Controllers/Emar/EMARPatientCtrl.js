// Patient Controller
angular.module('app').controller('EMARPatientCtrl', ['$scope', '$state', '$stateParams', '$window', '$filter', 'APIService',
  function ($scope, $state, $stateParams, $window, $filter, APIService) {

    $scope.today = new Date();
    $scope.cur_date = $scope.today;
    $scope.patientId = $stateParams.patientId;
    $scope.med_schedules = [];
    $scope.facilities_list = [];
    $scope.alerts = [];
    $scope.addresses_list = [];
    $scope.facility_key = '';
    $scope.address_key = '';
    $scope.allergy = '';
    $scope.is_admin = $window.localStorage.role == 'admin';
    $scope.is_pharmacist = $window.localStorage.role == 'pharmacist';
    $scope.is_doctor = $window.localStorage.role == 'doctor';
    $scope.primary_doctor_option = 'choose';
    $scope.orderby = 'name';
    $scope.reverse = false;
    $scope.med_show_for = '';
    $scope.invite = true;
    $scope.cycle_arr = [1, 2, 3, 4, 5, 6, 7];
    $scope.cur_medication;
    $scope.cur_med_schedule;

    var myscope = $scope;
    $scope.checkWeeklyModel = [false, false, false, false, false, false, false];
    $scope.checkWeeklyResults = [];

    $scope.time_columns = angular.copy(SHARED_CONST.time_columns);
    $scope.week_arr = angular.copy(SHARED_CONST.week_arr);
    $scope.selectedRepeatsModel_arr = angular.copy(SHARED_CONST.selectedRepeatsModel_arr);
    $scope.status_arr = angular.copy(SHARED_CONST.status_arr);
    $scope.unit_arr = angular.copy(SHARED_CONST.unit_arr);
    $scope.med_review_status_labels = angular.copy(SHARED_CONST.med_review_status_labels);
    $scope.med_review_status_simple_labels = angular.copy(SHARED_CONST.med_review_status_simple_labels);
    $scope.dosage_when_options = angular.copy(SHARED_CONST.dosage_when_options);
    $scope.dosage_every_options = angular.copy(SHARED_CONST.dosage_every_options);

    $scope.preDate = function () {
      var timeVal = $scope.cur_date.getTime();

      if (timeVal >= 86400) {
        timeVal -= 86400000;
      }

      $scope.cur_date = new Date(timeVal);

      $scope.loadData();
    }

    $scope.NextDate = function () {
      var timeVal = $scope.cur_date.getTime();

      timeVal += 86400000;

      $scope.cur_date = new Date(timeVal);
      $scope.loadData();
    }

    $scope.initData = function () {
      $scope.patient = {
        profile: {
          // gender: 'M'
        },
        allergies: []
      };
      $scope.patient_in_facility = 'true';

    };

    $scope.loadData = function () {

      if (!$scope.patientId) return;
      $scope.initMedReview();

      $scope.helpers.uiBlocks('.block', 'state_loading');

      APIService.get('/patient?id=' + $scope.patientId).then(function (response) {
        $scope.helpers.uiBlocks('.block', 'state_normal');
        if (response === undefined) return;
        if (response.s && response.s === 'f') {
          return;
        }

        $scope.patient = response.result;

        var offset = new Date().getTimezoneOffset();
        $scope.patient.profile.dob = $scope.patient.profile.dob + offset * 60 * 1000;
        $scope.patient.profile.dob_format = $filter('date')($scope.patient.profile.dob, 'MM/dd/yyyy');
        $scope.patient.avatar_url = APIService.API_URL + '/patient/avatar?id=' + $scope.patient.id + '&token=' + encodeURIComponent($window.localStorage.token) + '&t=' + new Date().getTime();
        $scope.primary_doctor = angular.copy($scope.patient.primary_doctor);
        $scope.patient_in_facility = ($scope.patient.facility || !$scope.patient.profile.address) ? 'true' : 'false';
        $scope.facility_key = $scope.patient.facility ? $scope.patient.facility.name : '';
        $scope.address_key = $scope.patient.profile.address ? $scope.patient.profile.address.description : '';
        $scope.doctor_key = $scope.patient.primary_doctor ? $scope.patient.primary_doctor.profile.first_name + ' ' + $scope.patient.primary_doctor.profile.last_name : '';

        $scope.patient.med_reviews.list.forEach(function (med_review, index, array) {
          if (med_review.doctor_id) med_review.doctor = $.grep($scope.patient.med_reviews.doctors, function (e) {
            return e.id == med_review.doctor_id;
          })[0];
          if (med_review.pharmacist_id) med_review.pharmacist = $.grep($scope.patient.med_reviews.pharmacists, function (e) {
            return e.id == med_review.pharmacist_id;
          })[0];
          if (med_review.pharmacy_id) med_review.pharmacy = $.grep($scope.patient.med_reviews.pharmacies, function (e) {
            return e.id == med_review.pharmacy_id;
          })[0];
          med_review.items.forEach(function (item, index, array) {
            if (item.diagnose_id) item.diagnose = $.grep($scope.patient.diagnosis, function (e) {
              return e.id == item.diagnose_id;
            })[0];
          });
        });

        $scope.diagnosisPanel = false;
        $scope.diagnosisInEdit = false;

        var now = $scope.cur_date;
        var default_date = new Date((now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear() + "  08:00:00");
        var end_date = new Date((now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear() + "  20:00:01");
        var med_schedules_list = [];

        $scope.patient.med_schedules.map(function (item) {

          scheduled_at = new Date(item.scheduled_at);

          if (default_date.getTime() <= scheduled_at.getTime() && end_date.getTime() >= scheduled_at.getTime()) {
            med_schedules_list.push(item);
          }
        });

        $scope.med_schedules = med_schedules_list;

        var med_prns_list = [];
        var offset = new Date().getTimezoneOffset();
        end_date = new Date((now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear() + "  23:59:59");
        $scope.patient.med_prns.map(function (item) {

          item.created_at = item.created_at + offset;
          item.modified_at = item.modified_at + offset;
          created_at = new Date(item.created_at);

          if (default_date.getTime() <= created_at.getTime() && end_date.getTime() >= created_at.getTime()) {
            med_prns_list.push(item);
          }
        });

        $scope.med_prns = med_prns_list;

        $scope.medications_loaded = [];
        $scope.medications = [];
        $scope.prn_medications = [];
        $scope.patient.medications.forEach(function (medication, index, array) {

          if (medication.is_prn == 0) {
            $scope.medications.push(medication);
          }
          else {
            $scope.prn_medications.push(medication);
          }

          if (medication.has_drug_image) {
            medication.drug_product_image = APIService.API_URL + '/drug/image?id=' + medication.drug_product_id + '&' + new Date().getTime() + '&token=' + encodeURIComponent($window.localStorage.token);
          } else {
            medication.drug_product_image = "";
          }

          medication.diagnose_ids.forEach(function (diagnose_id, index, array) {
            var diagnose = $.grep($scope.patient.diagnosis, function (e) {
              return e.id == diagnose_id;
            })[0];
            if (diagnose) {
              medication.diagnosis_name = diagnose.name;
              medication.diagnosis_goal = diagnose.goal;
              medication.diagnosis_plan = diagnose.plan;
            }
          });
          if (medication.diagnose_ids.length == 0) medication.diagnosis_name = 'Other';
        });
        $scope.toggleStatus();
        $scope.searchAddress();
      });

      $scope.helpers.uiBlocks('.block', 'state_loading');

      APIService.get('/patient/med_alert?patient_id=' + $scope.patientId).then(function (response) {
        $scope.helpers.uiBlocks('.block', 'state_normal');
        if (response === undefined) return;
        if (response.s && response.s === 'f') {
          return;
        }

        $scope.alerts = response.result.med_alerts;

      });
    };

    /**
    * Returns image url of the given medication
    * If there is no image, returns empty
    **/

    $scope.get_product_image = function (medication) {

      var ret_str;
      if (medication.drug_product_image == "") {
        ret_str = "assets/img/DinNoImage.jpg";
      }
      else {
        ret_str = medication.drug_product_image;
      }
      return ret_str;
    }

    /**
    * Returns performed time of med_schedule that has the drug_product_id.
    **/
    $scope.get_column_time = function (column, drug_product_id) {

      var now = $scope.cur_date;
      var ret_str = "";
      var str_date = (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear();
      var column_start_time = new Date(str_date + " " + column.from);
      var column_end_time = new Date(str_date + " " + column.to);

      $scope.med_schedules.map(function (item) {
        scheduled_at = new Date(item.scheduled_at);
        if (drug_product_id == item.drug_product_id && scheduled_at.getTime() == column_start_time.getTime()) {
          ret_str = ("0" + (scheduled_at.getHours())).slice(-2) + ("0" + (scheduled_at.getMinutes())).slice(-2);
        }
      });

      return ret_str;
    }

    $scope.get_column_time_NS = function (column, drug_product_id) {

      var ret_str = "";

      if ($scope.is_admin) {
        return ret_str;
      }

      var now = $scope.cur_date;

      var str_date = (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear();
      var column_start_time = new Date(str_date + " " + column.from);
      var column_end_time = new Date(str_date + " " + column.to);

      $scope.med_schedules.map(function (item) {
        scheduled_at = new Date(item.scheduled_at);

        if (drug_product_id == item.drug_product_id && scheduled_at.getTime() == column_start_time.getTime()) {
          if (item.performed_at != 0) {
            if (item.created_by_first_name != "" && item.created_by_first_name != undefined) {
              ret_str = item.created_by_first_name.substring(0, 1);
            }

            if (item.created_by_last_name != "" && item.created_by_first_name != undefined) {
              ret_str = ret_str + item.created_by_last_name.substring(0, 1);
            }
          }
          return;

        }
      });

      return ret_str;
    }

    /**
    * Returns color of the given column.
    **/
    $scope.get_column_color = function (column, drug_product_id) {

      var now = $scope.cur_date;
      var ret_str = "";
      var str_date = (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear();
      var column_start_time = new Date(str_date + " " + column.from);
      var column_end_time = new Date(str_date + " " + column.to);
      var f_flag = 1;
      var flag = 0;
      $scope.med_schedules.map(function (item) {
        if (flag == 0) {
          scheduled_at = new Date(item.scheduled_at);
          if (drug_product_id == item.drug_product_id && scheduled_at.getTime() >= column_start_time.getTime() && scheduled_at.getTime() <= column_end_time.getTime()) {
            f_flag = 0;
            performed_at = new Date(item.performed_at);

            if (item.performed_at != "" && performed_at.getTime() < now.getTime()) {

              ret_str = "status" + item.status;

            }
            else if (now.getTime() >= column_start_time.getTime() && now.getTime() <= column_end_time.getTime()) {
              flag = 1;
            }
            else {
              flag = 2;
            }
          }
        }
      });

      if (f_flag == 1) {
        ret_str = "grey";
      }
      else if (flag == 1) {
        ret_str = "red";
      }
      else if (flag == 2) {
        ret_str = "grey";
      }

      return ret_str;
    }

    /**
    * Returns the notes of the given medication.
    **/
    $scope.get_content = function (medication) {
      var ret_arr = [];
      var now = $scope.cur_date;
      var str_date = (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear();

      var scheduled_at, performed_at;

      $scope.med_schedules.map(function (item) {
        scheduled_at = new Date(item.scheduled_at);
        performed_at = new Date(item.performed_at);
        if (medication.drug_product_id == item.drug_product_id && item.reason != "") {
          ret_arr.push(("0" + (scheduled_at.getHours())).slice(-2) + ("0" + (scheduled_at.getMinutes())).slice(-2) + " " + item.reason);
        }
      });

      return ret_arr;
    }

    /**
    *
    *
    */
    $scope.$watchCollection('checkWeeklyModel', function () {
      myscope.checkWeeklyResults = "";
      angular.forEach($scope.checkWeeklyModel, function (value, key) {
        if (value) {
          myscope.checkWeeklyResults = myscope.checkWeeklyResults + "," + key;
        }
      });

      if (myscope.checkWeeklyResults != "") {
        myscope.checkWeeklyResults = myscope.checkWeeklyResults.slice(1);
      }

    });

    $scope.checkstatus = [];
    $scope.checkStatusResults = [];
    $scope.$watchCollection('checkstatus', function () {
      $scope.checkStatusResults = [];
      angular.forEach($scope.checkstatus, function (value, key) {
        if (value) {
          myscope.checkStatusResults.push(key);
        }
      });
    });

    $scope.changestatus = function (id) {
      $scope.checkstatus = [false, false, false, false];
      $scope.checkstatus[id - 1] = true;
    }

    $scope.havingPrnMed = function (medication) {
      var ret_val = false;
      $scope.med_prns.map(function (item) {

        if (medication.drug_product_id == item.drug_product_id) {
          ret_val = true;
        }
      });

      return ret_val;
    }

    $scope.get_prn_column_time = function (column, drug_product_id) {

      var now = $scope.cur_date;
      var ret_str = "";
      var str_date = (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear();
      var column_start_time = new Date(str_date + " " + column.from);
      var column_end_time = new Date(str_date + " " + column.to);

      $scope.med_prns.map(function (item) {
        created_at = new Date(item.created_at);

        if (drug_product_id == item.drug_product_id && created_at.getTime() >= column_start_time.getTime() && created_at.getTime() <= column_end_time.getTime()) {
          ret_str = ("0" + (created_at.getHours())).slice(-2) + ("0" + (created_at.getMinutes())).slice(-2);
        }
      });

      return ret_str;
    }

    /**
    * Returns the notes of the given medication.
    **/
    $scope.get_prn_content = function (medication) {
      var ret_arr = [];
      var now = $scope.cur_date;
      var str_date = (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear();

      var created_at, performed_at;

      $scope.med_prns.map(function (item) {
        created_at = new Date(item.created_at);

        modified_at = new Date(item.modified_at);
        if (medication.drug_product_id == item.drug_product_id && item.reason != "") {
          if (item.modified_at == 0) {
            ret_arr.push(("0" + (created_at.getHours())).slice(-2) + ("0" + (created_at.getMinutes())).slice(-2) + " " + item.reason);
          }
          else {
            ret_arr.push(("0" + (modified_at.getHours())).slice(-2) + ("0" + (modified_at.getMinutes())).slice(-2) + " " + item.reason);
          }
        }
      });

      return ret_arr;
    }

    $scope.click_prn_Column = function (column, medication) {

      if ($scope.is_admin) {
        if ($scope.cur_date.getTime() >= $scope.today.getTime()) {
          $scope.prn_createMedSchedule(column, medication);
        }
        else {
          alert("You can't modify past schedule");
          return;
        }
      }
      else {
        if ($scope.cur_date.getTime() <= $scope.today.getTime()) {
          $scope.prn_createMedSchedule(column, medication);
        }
        else {
          alert("You can't perform future schedule");
          return;
        }
      }
    }

    $scope.new_med_schedule_name = "";
    $scope.new_med_schedule_reason = "";

    $scope.click_Column = function (column, medication) {

      if ($scope.is_admin) {
        if ($scope.cur_date.getTime() >= $scope.today.getTime()) {
          $scope.click_createMedSchedule(column, medication);
        }
        else {
          alert("You can't modify past schedule");
          return;
        }
      }
      else {
        if ($scope.cur_date.getTime() <= $scope.today.getTime()) {
          $scope.click_performMedSchedule(column, medication);
        }
        else {
          alert("You can't perform future schedule");
          return;
        }
      }
    }

    /**
    * Display the create modal with scheduled state
    * between the given column time.
    **/

    $scope.click_createMedSchedule = function (column, medication) {

      var now = $scope.cur_date;
      var ret_str = "";
      var str_date = (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear();
      $scope.cur_medication = medication;
      var column_start_time = new Date(str_date + " " + column.from);
      var column_end_time = new Date(str_date + " " + column.to);
      var f_flag = 1;

      $scope.med_schedules.map(function (item) {
        scheduled_at = new Date(item.scheduled_at);

        if (medication.drug_product_id == item.drug_product_id && scheduled_at.getTime() == column_start_time.getTime()) {
          if (item.performed_at != 0) {
            alert("You cannot modify this emar after it was administered.");
            f_flag = 2;
            return;
          } else {
            f_flag = 0;
            $scope.cur_med_schedule = item;
          }
        }
      });

      if (f_flag == 1) {

        // Add New Schedule
        $scope.new_flag = 1;
        $scope.new_med_schedule_name = "Create MAR Schedule";

        $scope.schedule_time = column;
        $scope.schedule_date = now.getFullYear() + "-" + ("0" + (now.getMonth() + 1)).slice(-2) + "-" + now.getDate();
        $scope.new_med_schedule_notes = "";
        $scope.new_med_schedule_dose = 100;
        $scope.current_unit = $scope.unit_arr[0];
        $scope.selectedRepeatsModel = $scope.selectedRepeatsModel_arr[0];
        $scope.selectedCycleModel = $scope.cycle_arr[0];
        $scope.checkWeeklyModel = [false, false, false, false, false, false, false];
        jQuery('#modal-create-med-schedule').modal('show');
      } else if (f_flag == 0) {
        $scope.new_flag = 0;
        $scope.new_med_schedule_name = "Edit MAR Schedule";
        // Modify exist Schedule

        $scope.schedule_time = column;
        var scheduled_at = new Date($scope.cur_med_schedule.scheduled_at);
        $scope.schedule_date = scheduled_at.getFullYear() + "-" + ("0" + (scheduled_at.getMonth() + 1)).slice(-2) + "-" + scheduled_at.getDate();

        $scope.new_med_schedule_notes = $scope.cur_med_schedule.reason;
        $scope.new_med_schedule_dose = $scope.cur_med_schedule.dose;
        $scope.current_unit = $scope.unit_arr[$scope.cur_med_schedule.unit - 1];
        $scope.selectedRepeatsModel = $scope.selectedRepeatsModel_arr[$scope.cur_med_schedule.repeat_by];
        $scope.selectedCycleModel = $scope.cycle_arr[$scope.cur_med_schedule.repeat_every - 1];

        $scope.checkWeeklyModel = [false, false, false, false, false, false, false];
        if ($scope.cur_med_schedule.repeat_on != "") {
          var arr = $scope.cur_med_schedule.repeat_on.split(",");
          arr.map(function (item_week) {
            $scope.checkWeeklyModel[item_week * 1] = true;
          });
        }
        jQuery('#modal-create-med-schedule').modal('show');
      }
    }

    /**
    * Posts new schedule to server.
    *
    **/
    $scope.createNewMedSchedule = function () {


      var date_arr = $scope.schedule_date.split('-');
      var str_date = date_arr[1] + "/" + date_arr[2] + "/" + date_arr[0];
      var scheduled_at = new Date(str_date + " " + $scope.schedule_time.from);

      var now = new Date();
      if (scheduled_at < now) {
        alert("Please select a time in the future.");
        return;
      }

      if ($scope.new_flag == 1) {

        var new_med_schedule = {
          name: $scope.new_med_schedule_name,
          drug_product_id: $scope.cur_medication.drug_product_id,
          route: "",
          scheduled_at: scheduled_at.getTime(),
          performed_at: 0,
          pain_level: 0,
          reason: $scope.new_med_schedule_notes,
          patient_id: $scope.patientId * 1,
          dose: $scope.new_med_schedule_dose * 1,
          unit: $scope.current_unit.value * 1,
          repeat_by: $scope.selectedRepeatsModel.id - 1,
          repeat_every: $scope.selectedCycleModel,
          repeat_on: $scope.checkWeeklyResults,
          repeat_start: 0,
          repeat_end: 0
        };


        $scope.helpers.uiBlocks('.block', 'state_loading');
        APIService.post('/patient/med_schedule', new_med_schedule).then(function (response) {
          $scope.helpers.uiBlocks('.block', 'state_normal');

          if (response === undefined) return;
          if (response.s === 'f') {

            return;
          } else {

            jQuery('#modal-create-med-schedule').modal('hide');
            $state.go('emar-patient-view', {
              'patientId': $scope.patientId
            });
            $scope.loadData();
            return;
          }
        });
      } else {
        var new_med_schedule = {
          id: $scope.cur_med_schedule.id,
          name: $scope.new_med_schedule_name,
          drug_product_id: $scope.cur_medication.drug_product_id,
          route: "",
          scheduled_at: scheduled_at.getTime(),
          performed_at: 0,
          pain_level: 0,
          reason: $scope.new_med_schedule_notes,
          patient_id: $scope.patientId * 1,
          dose: $scope.new_med_schedule_dose * 1,
          unit: $scope.current_unit.value * 1,
          repeat_by: $scope.selectedRepeatsModel.id - 1,
          repeat_every: $scope.selectedCycleModel,
          repeat_on: $scope.checkWeeklyResults,
          repeat_start: 0,
          repeat_end: 0
        };

        $scope.helpers.uiBlocks('.block', 'state_loading');
        APIService.put('/patient/med_schedule?id=' + $scope.cur_med_schedule.id, new_med_schedule).then(function (response) {
          $scope.helpers.uiBlocks('.block', 'state_normal');

          if (response === undefined) return;
          if (response.s === 'f') {
            return;
          } else {
            jQuery('#modal-create-med-schedule').modal('hide');
            $state.go('emar-patient-view', {
              'patientId': $scope.patientId
            });
            $scope.loadData();
            return;
          }
        });
      }
    }

    /**
    * Deletes med schedule.
    *
    **/
    $scope.deleteMedSchedule = function () {
      if (!$window.confirm('Are you sure you want to delete this med schedule ?')) {
        return false;
      }

      $scope.helpers.uiBlocks('.block', 'state_loading');
      APIService.delete('/patient/med_schedule?id=' + $scope.cur_med_schedule.id).then(function (response) {
        $scope.helpers.uiBlocks('.block', 'state_normal');

        if (response === undefined) return;
        if (response.s === 'f') {

          return;
        } else {
          jQuery('#modal-create-med-schedule').modal('hide');
          $state.go('emar-patient-view', {
            'patientId': $scope.patientId
          });
          $scope.loadData();
          return;
        }
      });
    }


    /**
    * Display the perform modal or the note modal
    * condition: perfored state of med_schedule
    **/

    $scope.click_performMedSchedule = function (column, medication) {
      var now = new Date();
      var ret_str = "";
      var str_date = (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear();
      $scope.cur_medication = medication;
      var column_start_time = new Date(str_date + " " + column.from);
      var column_end_time = new Date(str_date + " " + column.to);
      var f_flag = 2;
      var flag = 0;

      $scope.med_schedules.map(function (item) {
        scheduled_at = new Date(item.scheduled_at);

        if (medication.drug_product_id == item.drug_product_id && scheduled_at.getTime() == column_start_time.getTime()) {
          if (item.performed_at != 0) {
            f_flag = 1;
          } else {
            f_flag = 0;
            $scope.cur_med_schedule = item;
          }
        }
      });

      if (f_flag == 1) {
        alert("You can't modify this schedule because it was performed.");
        return;
      }

      if (f_flag == 2) {
        alert("You can't create new med schedule.");
        return;
      }


      $scope.cur_med_schedule_reason = "";
      $scope.checkstatus = [false, false, false, false];

      myscope.InputTime = now.getHours() + ":" + now.getMinutes();
      jQuery('#modal-perform').modal('show');

    }

    /**
    * Puts the performed schedule to the server
    *
    **/
    $scope.performMedSchedule = function () {


      var now = new Date();
      if ($scope.InputTime == undefined) {
        $window.alert('You must insert correct performed at.');
        return false;
      }

      if ($scope.checkStatusResults.length == 0) {
        alert("Please select Status.");
        return;
      }

      if ($scope.checkStatusResults[0] == 0) {
        $scope.cur_med_schedule_reason = "";

      }

      var str_date = (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear();
      var str_time_arr = $scope.InputTime.split(":");
      var performed_at = new Date(str_date + " " + str_time_arr[0] + ":" + str_time_arr[1] + ":00");
      if (performed_at >= now) {
        $window.alert('Perform at should not be a future time.');
        return false;
      }

      var performed_med_schedule = {
        id: $scope.cur_med_schedule.id,
        name: $scope.cur_med_schedule.name,
        drug_product_id: $scope.cur_medication.drug_product_id,
        route: "",
        scheduled_at: $scope.cur_med_schedule.scheduled_at,
        performed_at: performed_at.getTime(),
        pain_level: $scope.cur_med_schedule.pain_level,
        reason: $scope.cur_med_schedule_reason,
        patient_id: $scope.patientId * 1,
        repeat_by: $scope.cur_med_schedule.repeat_by,
        repeat_every: $scope.cur_med_schedule.repeat_every,
        repeat_on: $scope.cur_med_schedule.repeat_on,
        repeat_start: 0,
        repeat_end: 0,
        status: $scope.checkStatusResults[0] * 1
      };


      $scope.helpers.uiBlocks('.block', 'state_loading');
      APIService.put('/patient/med_schedule?id=' + $scope.cur_med_schedule.id, performed_med_schedule).then(function (response) {
        $scope.helpers.uiBlocks('.block', 'state_normal');

        if (response === undefined) return;
        if (response.s === 'f') {

          return;
        } else {

          jQuery('#modal-perform').modal('hide');
          $state.go('emar-patient-view', {
            'patientId': $scope.patientId
          });
          $scope.loadData();
          return;
        }
      });
    }

    /**
    *
    *
    **/
    $scope.prn_createMedSchedule = function (column, medication) {

      var now = $scope.cur_date;
      var ret_str = "";
      var str_date = (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear();
      $scope.cur_medication = medication;
      var column_start_time = new Date(str_date + " " + column.from);
      var column_end_time = new Date(str_date + " " + column.to);
      var f_flag = 1;

      $scope.med_prns.map(function (item) {
        created_at = new Date(item.created_at);

        if (medication.drug_product_id == item.drug_product_id && created_at.getTime() >= column_start_time.getTime() && created_at.getTime() <= column_end_time.getTime()) {
          f_flag = 0;
          $scope.cur_med_prn = item;
          return;
        }
      });
      if (f_flag == 0) {
        $scope.new_med_schedule_reason = $scope.cur_med_prn.reason;
      }
      else {
        $scope.new_med_schedule_reason = "";

      }
      $scope.new_flag = f_flag;

      jQuery('#modal-prn-create-med-schedule').modal('show');
    }

    /**
    * Posts new prn schedule to server.
    *
    **/
    $scope.createNewPrnMedSchedule = function () {
      var date_arr = $scope.schedule_date.split('-');
      var str_date = date_arr[1] + "/" + date_arr[2] + "/" + date_arr[0];

      if ($scope.new_flag == 1) {
        var new_med_prn = {
          name: $scope.new_med_schedule_name,
          drug_product_id: $scope.cur_medication.drug_product_id,
          route: "",
          pain_level: 0,
          reason: $scope.new_med_schedule_reason,
          patient_id: $scope.patientId * 1,
          status: 0,
          created_at: $scope.today.getTime(),
          modified_at: 0
        };

        $scope.helpers.uiBlocks('.block', 'state_loading');
        APIService.post('/patient/med_prn', new_med_prn).then(function (response) {
          $scope.helpers.uiBlocks('.block', 'state_normal');

          if (response === undefined) return;
          if (response.s === 'f') {

            return;
          } else {

            jQuery('#modal-prn-create-med-schedule').modal('hide');
            $state.go('emar-patient-view', {
              'patientId': $scope.patientId
            });
            $scope.loadData();
            return;
          }
        });
      }
      else {
        var new_med_prn = {
          id: $scope.cur_med_prn.id,
          name: $scope.new_med_schedule_name,
          drug_product_id: $scope.cur_medication.drug_product_id,
          route: "",
          pain_level: 0,
          reason: $scope.new_med_schedule_reason,
          status: 0,
          created_at: $scope.cur_med_prn.created_at,
          modified_at: $scope.today.getTime()
        };

        $scope.helpers.uiBlocks('.block', 'state_loading');
        APIService.put('/patient/med_prn?id=' + $scope.cur_med_prn.id, new_med_prn).then(function (response) {
          $scope.helpers.uiBlocks('.block', 'state_normal');

          if (response === undefined) return;
          if (response.s === 'f') {

            return;
          } else {

            jQuery('#modal-prn-create-med-schedule').modal('hide');
            $state.go('emar-patient-view', {
              'patientId': $scope.patientId
            });
            $scope.loadData();
            return;
          }
        });
      }
    }

    $scope.toggleStatus = function () {

      $scope.medications_loaded = [];
      $scope.patient.medications.forEach(function (medication, index, array) {
        if (medication.status === $scope.med_show_for || '' === $scope.med_show_for) {
          $scope.medications_loaded.push(medication);
        }
      });
    }

    $scope.progressFilter = function (item) {
      return item.status === 'draft' || item.status === 'sent_to_doctor' || item.status === 'doctor_draft';
    };

    $scope.completedFilter = function (item) {
      return item.status === 'sent_to_pharmacy';
    };

    $scope.initMedReview = function () {
      $scope.doctors_list2 = [];
      if ($scope.is_admin) {
        APIService.get('/doctor').then(function (response) {
          if (response === undefined) return;
          if (response.s === 'f') return;
          $scope.doctors_list2 = response.result;
        });
      }


      $scope.pharmacies_list = [];
      APIService.get('/pharmacy').then(function (response) {
        if (response === undefined) return;
        if (response.s === 'f') return;
        $scope.pharmacies_list = response.result;
      });

      $scope.pharmacists_list = [];
      APIService.get('/pharmacist').then(function (response) {
        if (response === undefined) return;
        if (response.s === 'f') return;
        $scope.pharmacists_list = response.result;
      });

      jQuery('#modal-signature').on('hidden.bs.modal', function () {
        if (!$scope.signaturePad.isEmpty() && jQuery('#modal-signature').data('signed')) {
          var cb = jQuery('#modal-signature').data('callback');
          cb($scope.signaturePad.toDataURL());
        }
        $scope.clearSignature();
      });

      jQuery('#modal-signature').on('shown.bs.modal', function () {
        jQuery('#modal-signature').data('signed', false);
        var role = jQuery('#modal-signature').data('role');
        jQuery('#modal-signature #role').text('[ AS ' + role + ']');
      });

    };

    var handleSaveMedReview = function (pharmacist_sign_png, patient_sign_png) {
      var status = $scope.medical_review.save_status;

      var validated = true;
      var items = [];
      $scope.patient.medications.forEach(function (medication, index, array) {
        items.push(medication.clone);
      });

      if (!validated) return;
      if (items.length == 0) {
        alert('You should select at least one diagnosis.');
        return;
      }
      $scope.medical_review.pharmacist_sign_png = pharmacist_sign_png;
      $scope.medical_review.patient_sign_png = patient_sign_png;
      $scope.medical_review.items = items;
      $scope.medical_review.patient_id = $scope.patient.id;

      $scope.medReviewFailed = false;
      $scope.helpers.uiBlocks('.block', 'state_loading');

      APIService.post('/patient/med_review' + (status ? '?status=' + status : ''), $scope.medical_review).then(function (response) {
        $scope.helpers.uiBlocks('.block', 'state_normal');
        if (response === undefined) return;
        if (response.s === 'f') {
          $scope.medReviewFailed = true;
          $scope.med_review_error_m = response.m;
          return;
        } else {
          $scope.medReviewFormSubmitted = false;
          $scope.cancelMedReview();
          $scope.loadData();
          return;
        }
      });
    };

    $scope.saveMedReview = function (medicalReviewForm, status) {
      $scope.medReviewFormSubmitted = true;
      if (!medicalReviewForm.$valid) return;
      $scope.medical_review.save_status = status;
      if (status == 'sent_to_doctor' && !$window.confirm('Are you sure you want to submit this medical review ?')) {
        return false;
      }

      if (status == 'sent_to_doctor' && !$scope.medical_review.pharmacist_sign_png) {
        jQuery('#modal-signature').data('callback', function (pharmacist_sign_png) {
          // var pharmacist_sign_png = pharmacist_sign_png;
          jQuery('#modal-signature').data('callback', function (patient_sign_png) {
            handleSaveMedReview(pharmacist_sign_png, patient_sign_png);
          });
          jQuery('#modal-signature').data('role', 'patient');
          jQuery('#modal-signature').modal('show');
        });
        jQuery('#modal-signature').data('role', 'pharmacist');
        jQuery('#modal-signature').modal('show');
        return false;
      } else {
        handleSaveMedReview();
      }
    };

    var handleUpdateMedReview = function (pharmacist_sign_png, patient_sign_png) {
      var status = $scope.chosenMedReview.update_status;
      var medreview = {
        patient_id: $scope.patient.id,
        doctor_id: $scope.chosenMedReview.doctor_id,
        pharmacy_id: $scope.chosenMedReview.pharmacy_id,
        pharmacist_id: $scope.chosenMedReview.pharmacist_id,
        pharmacist_sign_png: pharmacist_sign_png,
        patient_sign_png: patient_sign_png,
        items: []
      };

      $scope.chosenMedReview.items.forEach(function (item, index, array) {
        medreview.items.push({
          id: item.id,
          checked: item.checked,
          goal: item.goal,
          plan: item.plan,
          assessment: item.assessment,
          dosage: item.dosage,
          dosage_every: item.dosage_every,
          dosage_when: item.dosage_when,
          pharmacist_notes: item.pharmacist_notes,
        });
      });

      $scope.medReviewFailed = false;
      APIService.put('/patient/med_review?id=' + $scope.chosenMedReview.id + (status ? '&status=' + status : ''), medreview).then(function (response) {
        $scope.helpers.uiBlocks('.block', 'state_normal');
        if (response === undefined) return;
        if (response.s === 'f') {
          $scope.medReviewFailed = true;
          $scope.med_review_error_m = response.m;
          return;
        } else {
          $scope.medReviewFormSubmitted = false;
          $scope.cancelMedReview();
          $scope.loadData();
          return;
        }
      });
    }

    $scope.updateMedReview = function (status) {
      $scope.chosenMedReview.update_status = status;
      if (status == 'sent_to_doctor' && !$window.confirm('Are you sure you want to save and submit this medical review ?')) {
        return false;
      }

      if (status == 'sent_to_doctor' && !$scope.chosenMedReview.pharmacist_sign_png) {
        jQuery('#modal-signature').data('callback', function (pharmacist_sign_png) {
          jQuery('#modal-signature').data('callback', function (patient_sign_png) {
            handleUpdateMedReview(pharmacist_sign_png, patient_sign_png);
          });
          jQuery('#modal-signature').data('role', 'patient');
          jQuery('#modal-signature').modal('show');
        });
        jQuery('#modal-signature').data('role', 'pharmacist');
        jQuery('#modal-signature').modal('show');
        return false;
      } else {
        handleUpdateMedReview();
      }
    };

    $scope.deleteMedReview = function () {
      if (!$window.confirm('Are you sure you want to delete this medical review ?')) {
        return false;
      }

      APIService.delete('/patient/med_review?id=' + $scope.chosenMedReview.id).then(function (response) {
        $scope.helpers.uiBlocks('.block', 'state_normal');
        if (response === undefined) return;
        if (response.s === 'f') {
          $scope.medReviewFailed = true;
          $scope.med_review_error_m = response.m;
          return;
        } else {
          $scope.cancelMedReview();
          $scope.loadData();
          return;
        }
      });
    };

    $scope.saveMedReviewDoctor = function () {
      var items = [];
      $scope.chosenMedReview.items.forEach(function (item, index, array) {
        items.push({
          id: item.id,
          checked: item.checked,
          doctor_notes: item.doctor_notes,
          goal: item.goal,
          plan: item.plan,
          assessment: item.assessment,
          dosage: item.dosage,
          dosage_every: item.dosage_every,
          dosage_when: item.dosage_when,
        });
      });

      $scope.medReviewFailed = false;
      $scope.helpers.uiBlocks('.block', 'state_loading');
      APIService.put('/patient/med_review?id=' + $scope.chosenMedReview.id, { items: items }).then(function (response) {
        $scope.helpers.uiBlocks('.block', 'state_normal');
        if (response === undefined) return;
        if (response.s === 'f') {
          $scope.medReviewFailed = true;
          $scope.med_review_error_m = response.m;
          return;
        } else {
          $scope.medReviewFormSubmitted = false;
          $scope.medReviewEdit = false;
          $scope.cancelMedReview();
          $scope.loadData();
          return;
        }
      });
    };

    $scope.newDiagnose = function () {
      $scope.diagnosis = angular.copy({});
      $scope.diagnosisInEdit = true;
      $scope.diagnosisPanel = true;
      $scope.diagnosisSubmitted = false;
    };

    $scope.viewDiagnose = function (id) {
      $scope.diagnosisPanel = true;
      $scope.diagnosisInEdit = false;
      $scope.diagnosis = $.grep($scope.patient.diagnosis, function (e) {
        return e.id == id;
      })[0];
      $scope.diagnosis.medications = [];
      $scope.patient.medications.forEach(function (medication, index, array) {
        if (medication.diagnose_ids.indexOf($scope.diagnosis.id) > -1) {
          $scope.diagnosis.medications.push(medication);
        }
      });
    };

    $scope.editDiagnose = function () {
      $scope.diagnosisPanel = true;
      $scope.diagnosisInEdit = true;
    };

    $scope.cancelDiagnose = function (id) {
      $scope.diagnosisPanel = false;
    };

    $scope.saveDiagnosis = function (isValid) {
      $scope.diagnosisSubmitted = true;
      if (!isValid) {
        $scope.saveFailed = true;
        $scope.error_m = 'required_fields_missing';
        return false;
      }

      $scope.saveFailed = false;
      $scope.saveSuccess = false;

      $scope.helpers.uiBlocks('.block', 'state_loading');
      if ($scope.diagnosisInEdit) {
        if ($scope.diagnosis.id) {
          // Update Diagnosis
          APIService.put('/patient/diagnosis?id=' + $scope.diagnosis.id, $scope.diagnosis).then(function (response) {
            $scope.helpers.uiBlocks('.block', 'state_normal');
            if (response === undefined) return;
            if (response.s === 'f') {
              $scope.saveFailed = true;
              $scope.error_m = response.m;
              return;
            } else {
              // $scope.saveSuccess = true;
              $scope.diagnosisSubmitted = false;
              $scope.loadData();
              return;
            }
          });
        } else {
          // Create Diagnosis
          APIService.post('/patient/diagnosis?patient_id=' + $scope.patientId, $scope.diagnosis).then(function (response) {
            $scope.helpers.uiBlocks('.block', 'state_normal');
            if (response === undefined) return;
            if (response.s === 'f') {
              $scope.saveFailed = true;
              $scope.error_m = response.m;
              return;
            } else {
              // $scope.saveSuccess = true;
              $scope.diagnosisSubmitted = false;
              $scope.loadData();
              return;
            }
          });
        }
      }
    };

    $scope.saveDiagnosisNote = function (isValid) {
      $scope.diagnosisNoteSubmitted = true;
      if (!isValid) {
        $scope.saveNoteFailed = false;
        $scope.saveSuccess = false;
        return false;
      }

      $scope.saveNoteFailed = false;
      $scope.saveNoteSuccess = false;

      $scope.helpers.uiBlocks('.block', 'state_loading');
      if ($scope.diagnosisNote.id) {
        // Update Diagnosis

      } else {
        // Create Diagnosis
        APIService.post('/patient/diagnosis/notes?diagnose_id=' + $scope.diagnosis.id, $scope.diagnosisNote).then(function (response) {
          $scope.helpers.uiBlocks('.block', 'state_normal');
          if (response === undefined) return;
          if (response.s === 'f') {
            $scope.error_m = response.m;
            return;
          } else {
            $scope.diagnosisNote.content = '';
            $scope.loadData();
            return;
          }
        });
      }
    };

    var wrapper = document.getElementById("signature-pad"), canvas, signaturePad;
    if (wrapper) {
      canvas = wrapper.querySelector("canvas");
      $scope.signaturePad = new SignaturePad(canvas);
    }

    $scope.clearSignature = function () {
      $scope.signaturePad.clear();
    };

    $scope.signSignature = function () {
      if ($scope.signaturePad.isEmpty()) {
        alert("Please provide signature first.");
      } else {
        jQuery('#modal-signature').data('signed', true);
        jQuery('#modal-signature').modal('hide');
      }
    };

    $scope.medReviewNew = false;
    $scope.startMedReview = function () {
      $scope.medReviewNew = true;
      $scope.medical_review = $scope.medical_review || {};
      $scope.medical_review.doctor_id = $scope.patient.primary_doctor.id;

      $scope.medications_loaded.forEach(function (medication, index, array) {
        medication.clone = {
          medication_id: medication.id,
          checked: true,
          dosage: medication.dosage_value,
          dosage_when: medication.dosage_when,
          dosage_every: medication.dosage_every
        };
      });
    };

    $scope.chooseMedReview = function (med_review) {
      $scope.helpers.uiBlocks('.block', 'state_loading');
      APIService.get('/patient/med_review?id=' + med_review.id).then(function (response) {
        $scope.helpers.uiBlocks('.block', 'state_normal');
        if (response === undefined) return;
        if (response.s && response.s === 'f') {
          return;
        }

        $scope.chosenMedReview = response.result;
        $scope.chosenMedReview.items.forEach(function (item, index, array) {
          var diagnosis = $.grep($scope.patient.diagnosis, function (e) {
            return e.id == item.diagnose_id;
          })[0];
          if (diagnosis) {
            item.diagnosis_name = diagnosis.name;
          } else {
            item.diagnosis_name = 'Other';
          }
        });
        $scope.medReviewView = true;
      });
    };

    $scope.editMedReview = function (med_review) {
      $scope.medReviewView = false;
      $scope.medReviewEdit = true;
    };

    var changeMedReviewStatus = function (status, callback) {
      $scope.medReviewFailed = false;
      $scope.helpers.uiBlocks('.block', 'state_loading');
      var payload = {
        doctor_sign_png: $scope.chosenMedReview.doctor_sign_png
      };
      APIService.patch('/patient/med_review?id=' + $scope.chosenMedReview.id + '&status=' + status, payload).then(function (response) {
        $scope.helpers.uiBlocks('.block', 'state_normal');
        if (response === undefined) return;
        if (response.s === 'f') {
          $scope.medReviewFailed = true;
          $scope.med_review_error_m = response.m;
          return;
        } else {
          callback();
        }
      });
    };

    $scope.approveMedReview = function () {
      if (!$window.confirm('Are you sure you want to approve this medical review ?')) {
        return false;
      }

      jQuery('#modal-signature').data('callback', function (doctor_sign_png) {
        $scope.chosenMedReview.doctor_sign_png = doctor_sign_png;
        changeMedReviewStatus('approved', function () {
          $scope.cancelMedReview();
          $scope.loadData();
          return;
        });
      });
      jQuery('#modal-signature').data('role', 'doctor');
      jQuery('#modal-signature').modal('show');
      return false;
    };

    $scope.declineMedReview = function () {
      if (!$window.confirm('Are you sure you want to decline this medical review ?')) {
        return false;
      }
      changeMedReviewStatus('declined', function () {
        $scope.cancelMedReview();
        $scope.loadData();
        return;
      });
    };

    $scope.amendMedReview = function () {
      if (!$window.confirm('Are you sure to send back modified medical review to pharmacy ?')) {
        return false;
      }
      changeMedReviewStatus('amended', function () {
        $scope.cancelMedReview();
        $scope.loadData();
        return;
      });
    };

    $scope.cancelMedReview = function () {
      $scope.medReviewNew = false;
      $scope.medReviewView = false;
      $scope.medReviewEdit = false;
      $scope.chosenMedReview = {};
      $scope.diagnosisNoteSubmitted = false;
    };

    $scope.searchFacility = function () {
      if (!$scope.is_admin) {
        return;
      }
      APIService.get('/facility?q=' + $scope.facility_key).then(function (response) {

        if (response === undefined) return;
        if (response.s && response.s === 'f') {
          return;
        }
        $scope.facilities_list = response.result;
      });
    };
    $scope.searchFacility();

    $scope.facilityChosen = function (facility_key) {
      if ($scope.patient.facility) {
        $scope.facility_key = $scope.patient.facility.name;
        facility_key.$setPristine();
      }
    };

    $scope.searchAddress = function () {
      if ($scope.address_key == '') {
        $scope.addresses_list = [];
        delete $scope.patient.profile.address;
        return;
      }

      APIService.get('/data/address?q=' + $scope.address_key).then(function (response) {
        if (response === undefined) return;
        if (response.s && response.s === 'f') {
          return;
        }
        $scope.addresses_list = response.result;
      });
    };

    $scope.addressChosen = function (address_key) {
      if ($scope.patient.profile.address) {
        $scope.address_key = $scope.patient.profile.address.description;
        address_key.$setPristine();
      }
    };

    $scope.searchDoctor = function () {

      if (!$scope.is_admin) {
        return;
      }

      if ($scope.doctor_key == '') {
        $scope.doctors_list = [];
        delete $scope.patient.primary_doctor;
        return;
      }

      APIService.get('/doctor?q=' + $scope.doctor_key).then(function (response) {
        if (response === undefined) return;
        if (response.s && response.s === 'f') {
          return;
        }
        $scope.doctors_list = response.result;
      });
    };
    $scope.searchDoctor();

    $scope.doctorChosen = function (doctor_key) {
      if ($scope.patient.primary_doctor) {
        $scope.primary_doctor = $scope.patient.primary_doctor;
        $scope.doctor_key = $scope.primary_doctor.profile.first_name + ' ' + $scope.primary_doctor.profile.last_name;
        doctor_key.$setPristine();
      }
    };

    $scope.addAllergy = function () {
      if ($scope.allergy == '') return;
      $scope.patient.allergies.push($scope.allergy);
      $scope.allergy = {};
    };

    $scope.removeAllergy = function (allergy) {
      var index = $scope.patient.allergies.indexOf(allergy);
      $scope.patient.allergies.splice(index, 1);
    };

    $scope.updateAvatar = function () {
      if (document.getElementById('profile_image').files.length == 0) return;
      var f = document.getElementById('profile_image').files[0],
        r = new FileReader();

      r.onloadend = function (e) {
        var data = e.target.result;
        $scope.helpers.uiBlocks('.block', 'state_loading');
        APIService.patch_b64('/patient/avatar?id=' + $scope.patientId, data).then(function (response) {
          $scope.helpers.uiBlocks('.block', 'state_normal');
          $scope.patient.avatar_url = APIService.API_URL + '/patient/avatar?id=' + $scope.patient.id + '&token=' + encodeURIComponent($window.localStorage.token) + '&t=' + new Date().getTime();
          $scope.patient.profile.has_avatar = true;
          alert('Patient avatar is uploaded successfully.');
        });
      }
      r.readAsDataURL(f);
    };

    $scope.deleteAvatar = function () {
      $scope.helpers.uiBlocks('.block', 'state_loading');
      APIService.delete('/patient/avatar?id=' + $scope.patientId).then(function (response) {
        $scope.helpers.uiBlocks('.block', 'state_normal');
        $scope.patient.avatar_url = APIService.API_URL + '/patient/avatar?id=' + $scope.patient.id + '&token=' + encodeURIComponent($window.localStorage.token) + '&t=' + new Date().getTime();
        $scope.patient.profile.has_avatar = false;
      });
    };

    $scope.delete = function () {
      if (!$window.confirm('Are you sure you want to delete this patient ?')) {
        return false;
      }

      APIService.delete('/patient?id=' + $scope.patientId).then(function (response) {
        if (response === undefined) return;
        if (response.s === 'f') {
          alert(response.m);
          return;
        } else {
          $state.go('patients');
        }
      });
    };

    $scope.save = function (isValid) {

      if (!isValid) {
        $scope.saveFailed = true;
        $scope.error_m = 'required_fields_missing';
        return false;
      }

      $scope.saveFailed = false;
      $scope.saveSuccess = false;

      var dt = new Date($scope.patient.profile.dob_format);
      $scope.patient.profile.dob = dt.getTime() - dt.getTimezoneOffset() * 60 * 1000;

      if ($scope.patient_in_facility == 'true')
        delete $scope.patient.profile.address;
      else
        delete $scope.patient.facility;

      $scope.helpers.uiBlocks('.block', 'state_loading');
      if ($scope.patientId) {
        // Update Patient
        APIService.put('/patient?id=' + $scope.patientId, $scope.patient).then(function (response) {
          $scope.helpers.uiBlocks('.block', 'state_normal');
          if (response === undefined) return;
          if (response.s === 'f') {
            $scope.saveFailed = true;
            $scope.error_m = response.m;
            return;
          } else {
            $scope.saveSuccess = true;
            $state.go('emar-patient-view', {
              'patientId': $scope.patientId
            });
            return;
          }
        });
      } else {
        // New Patient
        if ($scope.primary_doctor_option == 'create') {
          APIService.post('/doctor', $scope.new_doctor).then(function (response) {
            $scope.helpers.uiBlocks('.block', 'state_normal');
            if (response === undefined) return;
            if (response.s === 'f') {
              $scope.saveFailed = true;
              $scope.error_m = response.m;
              return;
            } else {

              $scope.patient.primary_doctor = {
                id: response.result.id
              };

              $scope.helpers.uiBlocks('.block', 'state_loading');
              APIService.post('/patient', $scope.patient).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s === 'f') {
                  $scope.saveFailed = true;
                  $scope.error_m = response.m;
                  return;
                } else {
                  $scope.saveSuccess = true;
                  var newPatientId = response.result.id;
                  if ($scope.invite) {
                    $scope.sendInvite(newPatientId);
                  }
                  $state.go('emar-patient-view', {
                    'patientId': newPatientId
                  });
                  return;
                }
              });
            }
          });
        } else {
          APIService.post('/patient', $scope.patient).then(function (response) {
            $scope.helpers.uiBlocks('.block', 'state_normal');

            if (response === undefined) return;
            if (response.s === 'f') {
              $scope.saveFailed = true;
              $scope.error_m = response.m;
              return;
            } else {
              $scope.saveSuccess = true;
              var newPatientId = response.result.id;
              if ($scope.invite) {
                $scope.sendInvite(newPatientId);
              }
              $state.go('patient-view', {
                'patientId': newPatientId
              });
              return;
            }
          });
        }
        return false;
      }
    };

    $scope.sendInvite = function (patientId) {
      // invite patient
      $scope.helpers.uiBlocks('.block', 'state_loading');
      APIService.patch('/patient/invite?id=' + patientId).then(function (response) {
        $scope.helpers.uiBlocks('.block', 'state_normal');
        if (response === undefined) return;
        if (response.s === 'f') {
          $scope.inviteFailed = true;
          $scope.error_invite_m = response.m;
          return;
        } else {
          jQuery('#modal-invitation-success').modal('show');
          $scope.inviteSuccess = true;
          $scope.patient.has_login = true;
          return;
        }
      });
      return false;
    }
  }

]);

