// Tablet Controller
angular.module('app').controller('TabletCtrl', ['$scope', '$state', '$stateParams', '$window', '$filter', 'APIService',
    function ($scope, $state, $stateParams, $window, $filter, APIService) {
        $scope.tabletId = $stateParams.tabletId;
        $scope.facility_key = '';
        $scope.tablet = {
            facility: {}
        }
        $scope.loadData = function () {
            if (!$scope.tabletId) return;
            $scope.helpers.uiBlocks('.block', 'state_loading');
            APIService.get('/facility/tablet?id=' + $scope.tabletId).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.tablet = response.result;
            });

            $scope.searchFacility();
        };

        $scope.delete = function () {
            if (!$window.confirm('Are you sure you want to delete this tablet ?')) {
                return false;
            }
            APIService.delete('/facility/tablet?id=' + $scope.tabletId).then(function (response) {
                if (response === undefined) return;
                if (response.s === 'f') {
                    alert(response.m);
                    return;
                } else {
                    $state.go('tablets');
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

            if ($scope.tablet.facility) {
                $scope.tablet.facility_id = $scope.tablet.facility.id;
            }

            $scope.helpers.uiBlocks('.block', 'state_loading');
            if ($scope.tabletId) {
                // Update Tablet
                APIService.put('/facility/tablet?id=' + $scope.tabletId, $scope.tablet).then(function (response) {
                    $scope.helpers.uiBlocks('.block', 'state_normal');
                    if (response === undefined) return;
                    if (response.s === 'f') {
                        $scope.saveFailed = true;
                        $scope.error_m = response.m;
                        return;
                    } else {
                        $scope.saveSuccess = true;
                        $state.go('tablet-view', {
                            'tabletId': $scope.tabletId
                        });
                        return;
                    }
                });
            } else {
                // Create Tablet
                APIService.post('/facility/tablet', $scope.tablet).then(function (response) {
                    $scope.helpers.uiBlocks('.block', 'state_normal');
                    if (response === undefined) return;
                    if (response.s === 'f') {
                        $scope.saveFailed = true;
                        $scope.error_m = response.m;
                        return;
                    } else {
                        $scope.saveSuccess = true;
                        var newTabletId = response.result.id;
                        $state.go('tablet-view', {
                            'tabletId': newTabletId
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

                $scope.tablet.facility = $.grep($scope.facilities_list, function (e) {
                    return e.id == $scope.tablet.facility_id;
                })[0];

                if ($scope.tablet.facility) {
                    $scope.facility_key = $scope.tablet.facility.name;
                }

            });
        };

        $scope.facilityChosen = function (facility_key) {
            if ($scope.tablet.facility) {
                $scope.facility_key = $scope.tablet.facility.name;
                facility_key.$setPristine();
            }
        };
    }
]);
