// Driver Controller
angular.module('app').controller('DriverCtrl', ['$scope', '$state', '$stateParams', '$filter', 'APIService',
    function ($scope, $state, $stateParams, $filter, APIService) {
        $scope.driverId = $stateParams.driverId;

        $scope.loadData = function () {
            if (!$scope.driverId) return;
            $scope.helpers.uiBlocks('.block', 'state_loading');
            APIService.get('/delivery?id=' + $scope.driverId).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');

                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.driver = response.result;                
            });
        };

        $scope.searchAddress = function () {
            if ($scope.address_key == '') return;
            APIService.get('/data/address?q=' + $scope.address_key).then(function (response) {
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.addresses_list = response.result;
            });
        };

        $scope.deleteDriver = function () {

            APIService.delete('/person?id=' + $scope.driverId).then(function (response) {
                if (response === undefined) return;
                if (response.s === 'f') {
                    alert(response.m);
                    return;
                } else {
                    alert('Driver has been deleted');
                    $state.go('drivers');
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

            $scope.helpers.uiBlocks('.block', 'state_loading');
            if ($scope.driverId) {
                // Update Driver
                APIService.put('/delivery?id=' + $scope.driverId, $scope.driver).then(function (response) {
                    $scope.helpers.uiBlocks('.block', 'state_normal');
                    if (response === undefined) return;
                    if (response.s === 'f') {
                        $scope.saveFailed = true;
                        $scope.error_m = response.m;
                        return;
                    } else {
                        $scope.saveSuccess = true;
                        $state.go('driver-view', {
                            'driverId': $scope.driverId
                        });
                        return;
                    }
                });
            }
        };
    }
]);