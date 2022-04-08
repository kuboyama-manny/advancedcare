// Facility Controller
angular.module('app').controller('FacilityCtrl', ['$scope', '$state', '$stateParams', '$window', '$filter', 'APIService',
  function($scope, $state, $stateParams, $window, $filter, APIService) {
    $scope.facilityId = $stateParams.facilityId;

    $scope.loadData = function() {
      if (!$scope.facilityId) return;
      $scope.helpers.uiBlocks('.block', 'state_loading');
      APIService.get('/facility?id=' + $scope.facilityId).then(function(response) {
        $scope.helpers.uiBlocks('.block', 'state_normal');
        if (response === undefined) return;
        if (response.s && response.s === 'f') {
          return;
        }

        $scope.facility = response.result;
        $scope.address_key = $scope.facility.address ? $scope.facility.address.description : '';
        $scope.searchAddress();
      });
    };

    $scope.searchAddress = function() {
      if ($scope.address_key === '') {
        $scope.addresses_list = [];
        delete $scope.facility.address;
        return;
      }

      APIService.get('/data/address?q=' + $scope.address_key).then(function(response) {
        if (response === undefined) return;
        if (response.s && response.s === 'f') {
          return;
        }
        $scope.addresses_list = response.result;
      });
    };

    $scope.addressChosen = function(address_key) {
      if ($scope.facility.address) {
        $scope.address_key = $scope.facility.address.description;
        address_key.$setPristine();
      }
    };

    $scope.delete = function() {
      if (!$window.confirm('Are you sure you want to delete this facility ?')) {
        return false;
      }
      APIService.delete('/facility?id=' + $scope.facilityId).then(function(response) {
        if (response === undefined) return;
        if (response.s === 'f') {
          alert(response.m);
          return;
        } else {
          $state.go('facilities');
        }
      });
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
      if ($scope.facilityId) {
        // Update Facility
        APIService.put('/facility?id=' + $scope.facilityId, $scope.facility).then(function(response) {
          $scope.helpers.uiBlocks('.block', 'state_normal');
          if (response === undefined) return;
          if (response.s === 'f') {
            $scope.saveFailed = true;
            $scope.error_m = response.m;
            return;
          } else {
            $scope.saveSuccess = true;
            $state.go('facility-view', {
              'facilityId': $scope.facilityId
            });
            return;
          }
        });
      } else {
        // Create Facility
        APIService.post('/facility', $scope.facility).then(function(response) {
          $scope.helpers.uiBlocks('.block', 'state_normal');
          if (response === undefined) return;
          if (response.s === 'f') {
            $scope.saveFailed = true;
            $scope.error_m = response.m;
            return;
          } else {
            $scope.saveSuccess = true;
            var newFacilityId = response.result.id;
            $state.go('facility-view', {
              'facilityId': newFacilityId
            });
            return;
          }
        });
      }
    };
  }
]);