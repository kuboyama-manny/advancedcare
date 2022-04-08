
// Smartpen Controller
angular.module('app').controller('SmartpenCtrl', ['$scope', '$state', '$stateParams', '$window', '$filter', 'APIService',
    function ($scope, $state, $stateParams, $window, $filter, APIService) {
        $scope.smartpenId = $stateParams.smartpenId;
        $scope.facility_key = '';
        $scope.smartpen = {
            facility: {}
        }

        $scope.loadData = function () {
            if (!$scope.smartpenId) return;
            $scope.helpers.uiBlocks('.block', 'state_loading');
            APIService.get('/facility/smartpen?id=' + $scope.smartpenId).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.smartpen = response.result;
            });

            $scope.searchFacility();
        };

        $scope.delete = function () {
            if (!$window.confirm('Are you sure you want to delete this smartpen ?')) {
                return false;
            }
            APIService.delete('/facility/smartpen?id=' + $scope.smartpenId).then(function (response) {
                if (response === undefined) return;
                if (response.s === 'f') {
                    alert(response.m);
                    return;
                } else {
                    $state.go('smartpens');
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

            if ($scope.smartpen.facility) {
                $scope.smartpen.facility_id = $scope.smartpen.facility.id;
            }

            $scope.helpers.uiBlocks('.block', 'state_loading');
            if ($scope.smartpenId) {                
                // Update Smartpen
                APIService.put('/facility/smartpen?id=' + $scope.smartpenId, $scope.smartpen).then(function (response) {
                    $scope.helpers.uiBlocks('.block', 'state_normal');
                    if (response === undefined) return;
                    if (response.s === 'f') {
                        $scope.saveFailed = true;
                        $scope.error_m = response.m;
                        return;
                    } else {
                        $scope.saveSuccess = true;
                        $state.go('smartpen-view', {
                            'smartpenId': $scope.smartpenId
                        });
                        return;
                    }
                });
            } else {
                // Create Smartpen
                APIService.post('/facility/smartpen', $scope.smartpen).then(function (response) {
                    $scope.helpers.uiBlocks('.block', 'state_normal');
                    if (response === undefined) return;
                    if (response.s === 'f') {
                        $scope.saveFailed = true;
                        $scope.error_m = response.m;
                        return;
                        
                    } else {
                        $scope.saveSuccess = true;
                        var newSmartpenId = response.result.id;
                        $state.go('smartpen-view', {
                            'smartpenId': newSmartpenId
                        });
                        return;
                    }
                });
            }
        };

        $scope.searchFacility = function () {
            APIService.get('/facility?q=' + $scope.facility_key).then(function (response) {
                if (response === undefined || response === null) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.facilities_list = response.result;

                $scope.smartpen.facility = $.grep($scope.facilities_list, function (e) {
                    return e.id == $scope.smartpen.facility_id;
                })[0];

                if ($scope.smartpen.facility) {
                    $scope.facility_key = $scope.smartpen.facility.name;
                }

            });
        };

        $scope.facilityChosen = function (facility_key) {
            if ($scope.smartpen.facility) {
                $scope.facility_key = $scope.smartpen.facility.name;
                facility_key.$setPristine();
            }
        };
    }

]);
