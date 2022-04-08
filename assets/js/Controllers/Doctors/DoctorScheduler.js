angular.module('app').controller('DoctorScheduler', ['$scope', '$state', '$window', 'APIService', 'AlfrescoService',
  function ($scope, $state, $window, APIService, AlfrescoService) {
    var profilePhotoLink = function () {
      return $window.API_URL + '/profile/image?id=' + $scope.profileId;
    };

    $scope.loadData = function () {
      APIService.get('/doctor/me').then(function (response) {
        if (response === undefined) { return $scope.helpers.showErrorModal('Can\'t load your profile', true) }
        if (response.s && response.s === 'f') { return $scope.helpers.showErrorModal(response.m, false) }

        $scope.doctor = response.result;
        $scope.profileId = $scope.doctor.profile.id;

        if ($scope.doctor.profile.has_image) {
          $scope.profileImageURL = profilePhotoLink() + '&time=' + Date.now();
        }

        $scope.kendoScheduler = new KendoScheduler({
          doctor_id: $scope.doctor.id,
          doctor: $scope.doctor,
          APIService: APIService,
          showErrorModal: $scope.helpers.showErrorModal
        });
      });
    };

  }
]);
