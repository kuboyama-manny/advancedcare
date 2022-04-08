// Rx Order Controller
angular.module('app').controller('OrderCtrl', ['$scope', '$state', '$stateParams', '$window', '$filter', 'APIService', '$timeout',
  function($scope, $state, $stateParams, $window, $filter, APIService, $timeout) {
    $scope.orderId = $stateParams.orderId;
    $scope.orderby = 'drug_name';
    $scope.reverse = false;
    $scope.is_admin = $window.localStorage.role == 'admin';
    $scope.is_pharmacist = $window.localStorage.role == 'pharmacist';
    $scope.is_doctor = $window.localStorage.role == 'doctor';

    $scope.patient_key = '';
    $scope.facility_key = '';
    $scope.primary_doctor = {};
    $scope.doctor_key = '';

    $scope.saveItemFailed = false;
    $scope.saveItemSuccess = false;

    $scope.order_status_labels = angular.copy(SHARED_CONST.order_status_labels);

    $scope.order_status_labels_pharmacist = angular.copy(SHARED_CONST.order_status_labels_pharmacist);

    $scope.dosage_when_options = angular.copy(SHARED_CONST.dosage_when_options);

    $scope.dosage_every_options = angular.copy(SHARED_CONST.dosage_every_options);

    $scope.duration_range_options = ['days', 'weeks', 'months'];

    $scope.initData = function() {
      $scope.order = {
        'preferred_via': 'pickup',
        'has_doctor_sign': 'true',
        'item': {
          'duration_range': 'days',
        },
      };
    };

    $scope.loadData = function() {
      if (!$scope.orderId) return;
      $scope.item = {
        'duration_range': 'days'
      };
      $scope.helpers.uiBlocks('.block', 'state_loading');
      APIService.get('/order?id=' + $scope.orderId).then(function(response) {
        $scope.helpers.uiBlocks('.block', 'state_normal');
        if (response === undefined) return;
        if (response.s && response.s === 'f') {
          return;
        }
        $scope.order = response.result;
        if ($scope.order.has_prescription) {
          $scope.order.prescription_png = APIService.API_URL + '/order/prescription?id=' + $scope.order.id + '&token=' + encodeURIComponent($window.localStorage.token) + '&t=' + new Date().getTime();
        }
      });

      jQuery('#modal-sendToPharmacy').on('hidden.bs.modal', function() {
        $scope.clearSignature();
      });

    };

    $scope.searchPatient = function() {
      APIService.get('/patient?q=' + $scope.patient_key).then(function(response) {
        if (response === undefined) return;
        if (response.s && response.s === 'f') {
          return;
        }
        $scope.patients_list = response.result.patients;
      });
    };

    $scope.patientChosen = function(patient_key) {
      if ($scope.order.patient) {
        $scope.order.patient_id = $scope.order.patient.id;
        $scope.patient_key = $scope.order.patient.first_name + ' ' + $scope.order.patient.last_name;
        patient_key.$setPristine();
      }

      $scope.loadDiagnoses();
    };

    $scope.loadDiagnoses = function(patient_key) {
      APIService.get('/patient?id=' + $scope.order.patient_id).then(function(response) {
        if (response === undefined) return;
        if (response.s && response.s === 'f') {
          return;
        }
        $scope.diagnosis_list = response.result.diagnosis;
      });
    };

    $scope.searchFacility = function() {
      APIService.get('/facility?q=' + $scope.facility_key).then(function(response) {
        if (response === undefined) return;
        if (response.s && response.s === 'f') {
          return;
        }
        $scope.facilities_list = response.result;
      });
    };
    $scope.searchFacility();

    // set default pharmacy if there is only 1 pharmacy.
    $scope.loadPharmacy = function() {
      console.log("loadPharmacy");
      APIService.get('/pharmacy').then(function(response) {
        if (response === undefined) return;
        if (response.s && response.s === 'f') {
          return;
        }
        if (response.result.length === 1) {
          $scope.pharmacy_key = response.result[0].name;
        }
      });
    };
    $scope.loadPharmacy();

    $scope.searchPharmacy = function() {
      APIService.get('/pharmacy?q=' + $scope.pharmacy_key).then(function(response) {
        if (response === undefined) return;
        if (response.s && response.s === 'f') {
          return;
        }
        $scope.pharmacies_list = response.result;
      });
    };
    $scope.pharmacy_key = '';
    $scope.searchPharmacy();

    $scope.pharmacyChosen = function(pharmacy_key) {
      if ($scope.order.pharmacy) {
        $scope.order.pharmacy_id = $scope.order.pharmacy.id;
        $scope.pharmacy_key = $scope.order.pharmacy.name;
        pharmacy_key.$setPristine();
      }
    };

    $scope.pharmacyChosen2 = function(pharmacy_key) {
      if ($scope.send_pharmacy) {
        $scope.pharmacy_key = $scope.send_pharmacy.pharmacy.name;
        pharmacy_key.$setPristine();
      }
    };

    $scope.searchDoctor = function() {
      if ($scope.doctor_key === '') {
        $scope.doctors_list = [];
        if ($scope.order) delete $scope.order.doctor;
        return;
      }
      APIService.get('/doctor?q=' + $scope.doctor_key).then(function(response) {
        if (response === undefined) return;
        if (response.s && response.s === 'f') {
          return;
        }
        $scope.doctors_list = response.result;
      });
    };
    $scope.searchDoctor();

    $scope.doctorChosen = function(doctor_key) {
      if ($scope.order.doctor) {
        $scope.order.doctor_id = $scope.order.doctor.id;
        $scope.doctor_key = $scope.order.doctor.profile.first_name + ' ' + $scope.order.doctor.profile.last_name;
        doctor_key.$setPristine();
      }
    };

    $scope.scheduleDelivery = function() {
      $state.go('delivery-order-new', {
        'rxOrderId': $scope.orderId
      });
    };

    $scope.waitForPickup = function() {
      $scope.helpers.uiBlocks('#statusBlock', 'state_loading');
      APIService.patch('/order/done_by_pharmacy?id=' + $scope.orderId + '&status=waiting_for_pickup').then(function(response) {
        $scope.helpers.uiBlocks('#statusBlock', 'state_normal');
        if (response === undefined) return;
        if (response.s && response.s === 'f') {
          $scope.statusUpdateError = response.m;
          return false;
        }
        $scope.loadData();
      });
    };

    $scope.donePickup = function() {
      $scope.helpers.uiBlocks('#statusBlock', 'state_loading');
      APIService.patch('/order/done_by_pharmacy?id=' + $scope.orderId + '&status=done').then(function(response) {
        $scope.helpers.uiBlocks('#statusBlock', 'state_normal');
        if (response === undefined) return;
        if (response.s && response.s === 'f') {
          $scope.statusUpdateError = response.m;
          return false;
        }
        $scope.loadData();
      });
    };

    $scope.formulary_list = [];
    $scope.searchDrugs = function() {
      APIService.get('/drug?q=' + $scope.drug_key + '&formulary_id=' + $scope.formulary_id).then(function(response) {
        if (response === undefined) return;
        if (response.s && response.s === 'f') {
          return false;
        }
        $scope.drugs_list = response.result.history ? response.result.history : response.result;
        if ($scope.formulary_list.length === 0)
          $scope.formulary_list = response.result.formularies;
      });
    };
    $scope.formulary_id = '';
    $scope.drug_key = '';
    $scope.searchDrugs();

    $scope.changeFormulary = function() {
      if ($scope.formulary_id) {
        $scope.searchDrugs();
      }
    };

    $scope.searchDrugProducts = function() {
      $scope.drug_products_list = [];
      if (!$scope.drug_id) return;
      APIService.get('/drug?id=' + $scope.drug_id).then(function(response) {
        if (response === undefined) return;
        if (response.s && response.s === 'f') {
          return false;
        }
        $scope.drug_products_list = response.result.products;
      });
    };

    $scope.itemFormSubmitted = false;
    $scope.editItem = function(item) {
      $scope.item = angular.copy(item);
      $scope.drug_key = item.drug_name;
      $scope.searchDrugs();
      $('html, body').animate({
        scrollTop: 600
      }, 600);
    };

    $scope.deleteItem = function(item) {
      if ($window.confirm('Are you sure you want to delete this item?')) {
        APIService.delete('/order?item_id=' + item.id).then(function(response) {
          if (response === undefined) return;
          if (response.s === 'f') {
            $scope.saveFailed = true;
            alert(response.m);
            $scope.saveError = response.m;
            return;
          } else {
            $scope.loadData();
          }
        });
      }
    };

    $scope.cancelItem = function(itemForm) {
      $scope.item = {};
      itemForm.$setPristine();
      $scope.itemFormSubmitted = false;
      $('html, body').animate({
        scrollTop: 0
      }, 200);
    };

    $scope.addItem = function(itemForm) {
      $scope.itemFormSubmitted = true;
      $scope.saveItemFailed = false;
      $scope.saveItemSuccess = false;
      $scope.saveItemError = '';
      if (!itemForm.$valid) return;
      if ($scope.item.id) {
        APIService.put('/order?item_id=' + $scope.item.id, $scope.item).then(function(response) {
          if (response === undefined) return;
          if (response.s === 'f') {
            $scope.saveItemFailed = true;
            $scope.saveItemError = response.m;
            return;
          } else {
            $scope.saveItemSuccess = true;
            $scope.itemFormSubmitted = false;
            $scope.item = {};
            itemForm.$setPristine();
            $scope.loadData();
          }
        });
      } else {
        APIService.post('/order?id=' + $scope.orderId, $scope.item).then(function(response) {
          if (response === undefined) return;
          if (response.s === 'f') {
            $scope.saveItemFailed = true;
            $scope.saveItemError = response.m;
            return;
          } else {
            $scope.saveItemSuccess = true;
            $scope.itemFormSubmitted = false;
            $scope.item = {};
            itemForm.$setPristine();
            $scope.loadData();
          }
        });
      }
    };

    $scope.save = function(isValid) {

      if (!isValid) {
        $scope.saveFailed = true;
        $scope.error_m = 'required_fields_missing';
        return false;
      }

      $scope.saveFailed = false;
      $scope.saveSuccess = false;

      $scope.helpers.uiBlocks('.block', 'state_loading');
      if ($scope.orderId) {

      } else {
        APIService.post('/order?patient_id=' + $scope.order.patient_id, $scope.order).then(function(response) {
          $scope.helpers.uiBlocks('.block', 'state_normal');
          if (response === undefined) return;
          if (response.s === 'f') {
            $scope.saveFailed = true;
            $scope.error_m = response.m;
            return;
          } else {
            $scope.saveSuccess = true;
            var newRxOrderId = response.result.id;
            $state.go('order-detail', {
              'orderId': newRxOrderId
            });
            return;
          }
        });
      }
    };

    $scope.newDiagnosis = {};
    $scope.isOpenNewDiagnosis = false;

    $scope.saveNewDiagnosis = function(isValid) {
      $scope.diagnosisSubmitted = true;
      if (!isValid) {
        $scope.diagnosisSaveFailed = true;
        $scope.error_m = 'required_fields_missing';
        return false;
      }
      $scope.diagnosisSubmitting = true;
      $scope.diagnosisSaveFailed = false;
      $scope.diagnosisSaveSuccess = false;

      $scope.helpers.uiBlocks('.block', 'state_loading');
      // Create Diagnosis
      APIService.post('/patient/diagnosis?patient_id=' + $scope.order.patient_id, $scope.newDiagnosis).then(function(response) {
        $scope.helpers.uiBlocks('.block', 'state_normal');
        if (response === undefined) return;
        if (response.s === 'f') {
          $scope.diagnosisSaveFailed = true;
          $scope.error_m = response.m;
          return;
        } else {
          $scope.diagnosisSaveSuccess = true;
          $scope.diagnosisSubmitted = false;
          $scope.newDiagnosis = {};
          $scope.loadDiagnoses();
          $scope.isOpenNewDiagnosis = false;
          $timeout(function() {
            $scope.diagnosisSaveSuccess = false;
          }, 3000);
          return;
        }
      }).finally(function() {
        $scope.diagnosisSubmitting = false;
      });
    };

    var wrapper = document.getElementById("signature-pad"),
      canvas, signaturePad;
    if (wrapper) {
      canvas = wrapper.querySelector("canvas");
      $scope.signaturePad = new SignaturePad(canvas);
    }

    $scope.clearSignature = function() {
      $scope.signaturePad.clear();
    };

    $scope.sendToPharmacy = function(isValid) {
      $scope.sendToPharmacySubmitted = true;
      if (!isValid) return;
      if ($scope.signaturePad.isEmpty()) {
        alert("Please provide signature first.");
      } else {
        $scope.helpers.uiBlocks('.block', 'state_loading');
        var data = $scope.signaturePad.toDataURL();
        APIService.patch_b64('/order/send_to_pharmacy?id=' + $scope.orderId + '&pharmacy_id=' + $scope.send_pharmacy.pharmacy.id + '&preferred_via=' + $scope.send_pharmacy.preferred_via, data).then(function(response) {
          $scope.helpers.uiBlocks('.block', 'state_normal');
          if (response === undefined) return;
          if (response.s && response.s === 'f') {
            return;
          }
          jQuery('#modal-sendToPharmacy').modal('hide');
          $scope.loadData();
        });
      }
    };

    $scope.openSendToPharmacyModal = function() {
      $scope.send_pharmacy = {
        preferred_via: 'delivery'
      };
      $scope.pharmacy_key = '';
      $scope.sendToPharmacySubmitted = false;
      jQuery('#modal-sendToPharmacy').modal('show');
    };

  }
]);