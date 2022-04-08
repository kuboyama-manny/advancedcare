// Patient Scheduler Controller
angular.module('app').controller('PatientScheduler', ['$scope', '$state', '$window', 'APIService', 'AlfrescoService',
  function ($scope, $state, $window, APIService, AlfrescoService) {

    $scope.loadData = function () {
      APIService.get('/patient?id=' + $window.localStorage.person_id).then(function (response) {
        if (response === undefined) { return $scope.helpers.showErrorModal('Can\'t load your profile', true) }
        if (response.s && response.s === 'f') { return $scope.helpers.showErrorModal(response.m, false) }

        $scope.patient = response.result;
        $scope.doctor = $scope.patient.primary_doctor;
        $scope.doctor_name = $scope.doctor.profile.first_name + " " + $scope.doctor.profile.last_name;

        $scope.kendoScheduler = new KendoScheduler({
          doctor_id: $scope.doctor.id,
          doctor: $scope.doctor,
          patient: $scope.patient,
          APIService: APIService,
          showErrorModal: $scope.helpers.showErrorModal
        });
      });
    };
  }
]);
