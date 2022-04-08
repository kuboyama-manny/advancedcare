// Doctors Controller
angular.module('app').controller('DoctorCtrl', ['$scope', '$state', '$stateParams', '$window', '$filter', 'APIService',
    function ($scope, $state, $stateParams, $window, $filter, APIService) {

        $scope.doctorId = $stateParams.doctorId;

        $scope.initData = function () {
            $scope.doctor = {
                npi: "0",
                msp: 0,
                cps: 0
            };
        };

        $scope.loadData = function () {
            
            if (!$scope.doctorId) return;
            $scope.helpers.uiBlocks('.block', 'state_loading');
            APIService.get('/doctor?id=' + $scope.doctorId).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.doctor = response.result;
                $scope.address_key = $scope.doctor.profile.address ? $scope.doctor.profile.address.description : '';
                $scope.searchAddress();
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

        $scope.delete = function () {
            if (!$window.confirm('Are you sure you want to delete this doctor ?')) {
                return false;
            }
            APIService.delete('/doctor?id=' + $scope.doctorId).then(function (response) {
                if (response === undefined) return;
                if (response.s === 'f') {
                    alert(response.m);
                    return;
                } else {
                    $state.go('doctors');
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
            if ($scope.doctorId) {
                // Update Doctor
                APIService.put('/doctor?id=' + $scope.doctorId, $scope.doctor).then(function (response) {
                    $scope.helpers.uiBlocks('.block', 'state_normal');
                    if (response === undefined) return;
                    if (response.s === 'f') {
                        $scope.saveFailed = true;
                        $scope.error_m = response.m;
                        return;
                    } else {
                        $scope.saveSuccess = true;
                        $state.go('doctor-view', {
                            'doctorId': $scope.doctorId
                        });
                        return;
                    }
                });
            }
            else {
                // add new doctor
                APIService.post('/doctor', $scope.doctor).then(function (response) {
                    $scope.helpers.uiBlocks('.block', 'state_normal');
                    if (response === undefined) return;
                    if (response.s === 'f') {
                        $scope.saveFailed = true;
                        $scope.error_m = response.m;
                        return;
                    } else {
                        $scope.doctorId = response.result.id;
                        $scope.saveSuccess = true;
                        $state.go('doctor-view', {
                            'doctorId': $scope.doctorId
                        });
                        return;
                    }
                });
            }
        };
    }
]);