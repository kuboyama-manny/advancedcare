// Pharmacy Controller
angular.module('app').controller('PharmacyCtrl', ['$scope', '$state', '$stateParams', '$filter', 'APIService',
    function ($scope, $state, $stateParams, $filter, APIService) {
        $scope.pharmacyId = $stateParams.pharmacyId;

        $scope.initData = function () {
            $scope.pharmacy = {
                is_pro: false,
                connector: {
                  type: 'none',
                  username: '',
                  password: ''
                },
                working_hours: {}
            };
        };

        $scope.loadAccess = function () {
            APIService.get('/pharmacy/access?pharmacy_id=' + $scope.pharmacyId).then(function (response) {
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    $scope.pharmacy_access = [];
                    return;
                }
                $scope.pharmacy_access = response.result;
            });

            APIService.get('/pharmacist').then(function (response) {
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.pharmacists_list = response.result;
            });
        };

        $scope.days = angular.copy(SHARED_CONST.days);

        $scope.noWorkingHours = function () {
            return !$scope.pharmacy || !$scope.pharmacy.working_hours || angular.equals({}, $scope.pharmacy.working_hours);
        };

        var sortWorkingOrders = function () {
            var hours = {};

            $scope.days.forEach(function (item, index, array) {
                if ($scope.pharmacy.working_hours[item]) {
                    hours[item] = $scope.pharmacy.working_hours[item];
                }
            });
            $scope.pharmacy.working_hours = hours;
        };

        $scope.addHour = function () {
            if (!$scope.newhour || !$scope.newhour.day || !$scope.newhour.open || !$scope.newhour.close) return false;
            var o = $scope.newhour.open, c = $scope.newhour.close;
            var oh = o.split(':')[0], om = o.split(':')[1];
            var ch = c.split(':')[0], cm = c.split(':')[1];

            $scope.pharmacy.working_hours[$scope.newhour.day] = [{h: oh, m: om}, {h: ch, m: cm}];
            sortWorkingOrders($scope.pharmacy.working_hours);

            $scope.newhour = {};
        };

        $scope.removeHour = function (key) {
            delete $scope.pharmacy.working_hours[key];
        };

        $scope.loadData = function () {
            if (!$scope.pharmacyId) return;
            $scope.helpers.uiBlocks('.block', 'state_loading');
            APIService.get('/pharmacy?id=' + $scope.pharmacyId).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.pharmacy = response.result;
                if (!$scope.pharmacy.working_hours) $scope.pharmacy.working_hours = {};
                sortWorkingOrders($scope.pharmacy.working_hours);
                $scope.address_key = $scope.pharmacy.address ? $scope.pharmacy.address.description : '';
                $scope.searchAddress();

                if (!$scope.pharmacy.connector) {
                  $scope.pharmacy.connector = {type: 'none', username: '', password: ''};
                }
                if (!$scope.pharmacy.connector.type) {
                  $scope.pharmacy.connector.type = 'none';
                }

                $scope.loadAccess();
            });
        };

        $scope.searchAddress = function () {
            if ($scope.address_key == '') {
                $scope.addresses_list = [];
                delete $scope.pharmacy.address;
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
            if ($scope.pharmacy.address) {
                $scope.address_key = $scope.pharmacy.address.description;
                address_key.$setPristine();
            }
        };

        $scope.user_role = 'pharmacist';
        $scope.searchUsers = function () {
            if ($scope.user_key == '') {
                $scope.users_list = [];
                delete $scope.chosenUser;
                return;
            }

            APIService.get('/person?q=' + $scope.user_key + '&role=' + ($scope.user_role || '')).then(function (response) {
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.users_list = response.result;
            });
        };

        $scope.userChosen = function (user_key) {
            if ($scope.chosenUser) {

                user_key.$setPristine();
            }
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
            if ($scope.pharmacyId) {
                // Update pharmacy
                APIService.put('/pharmacy?id=' + $scope.pharmacyId, $scope.pharmacy).then(function (response) {
                    $scope.helpers.uiBlocks('.block', 'state_normal');
                    if (response === undefined) return;
                    if (response.s === 'f') {
                        $scope.saveFailed = true;
                        $scope.error_m = response.m;
                        return;
                    } else {
                        $scope.saveSuccess = true;
                        $state.go('pharmacy-view', {
                            'pharmacyId': $scope.pharmacyId
                        });
                        return;
                    }
                });
            } else {
                // Create pharmacy
                APIService.post('/pharmacy', $scope.pharmacy).then(function (response) {
                    $scope.helpers.uiBlocks('.block', 'state_normal');
                    if (response === undefined) return;
                    if (response.s === 'f') {
                        $scope.saveFailed = true;
                        $scope.error_m = response.m;
                        return;
                    } else {
                        $scope.saveSuccess = true;
                        var newPharmacyId = response.result;
                        $state.go('pharmacy-view', {
                            'pharmacyId': newPharmacyId
                        });
                        return;
                    }
                });
            }
        };

        $scope.addExistingUser = function (role, is_driver) {
            var param = '';
            if (is_driver) {
                param = '&delivery_id=' + $scope.chosenUser.direct_id;
            } else {
                param = '&pharmacist_id=' + $scope.chosenUser.direct_id + '&access=' + role;
            }
            $scope.addExistingUserSuccess = false;
            $scope.addExistingUserFailed = false;
            $scope.helpers.uiBlocks('#add_block', 'state_loading');
            APIService.post('/pharmacy/access?pharmacy_id=' + $scope.pharmacyId + param, {}).then(function (response) {
                $scope.helpers.uiBlocks('#add_block', 'state_normal');
                if (response === undefined) return;
                if (response.s === 'f') {
                    $scope.addExistingUserFailed = true;
                    $scope.error_m = response.m;
                    return;
                } else {
                    $scope.addExistingUserSuccess = true;
                    $scope.loadAccess();
                    return;
                }
            });
        };

        $scope.addAccess = function (pharmacist_id, role) {
            if (!pharmacist_id || !role) return;
            APIService.post('/pharmacy/access?pharmacy_id=' + $scope.pharmacyId + '&pharmacist_id=' + pharmacist_id + '&access=' + role, {}).then(function (response) {
                if (response === undefined) return;
                if (response.s === 'f') {
                    $scope.saveFailed = true;
                    $scope.error_m = response.m;
                    return;
                } else {
                    $scope.loadAccess();
                    return;
                }
            });
        };

        $scope.sendInvite = function (inviteForm) {
            if (inviteForm.$invalid) {
                $scope.inviteFailed = true;
                $scope.inviteFormSubmitted = true;
                $scope.invite_error_m = 'required_fields_missing';
                return false;
            }

            $scope.inviteFailed = false;
            $scope.inviteSuccess = false;
            $scope.helpers.uiBlocks('#invite_block', 'state_loading');
            APIService.post('/pharmacy/access/invite?pharmacy_id=' + $scope.pharmacyId + '&access=' + $scope.inviteuser.role, $scope.inviteuser).then(function (response) {
                $scope.helpers.uiBlocks('#invite_block', 'state_normal');
                if (response === undefined) return;
                if (response.s === 'f') {
                    $scope.inviteFailed = true;
                    $scope.invite_error_m = response.m;
                    return;
                } else {
                    $scope.inviteSuccess = true;
                    return;
                }
            });
        };

        var setAccessApproval = function (pharmacist_id, status) {
            $scope.helpers.uiBlocks('.block', 'state_loading');
            APIService.put('/pharmacy/access?pharmacy_id=' + $scope.pharmacyId + '&pharmacist_id=' + pharmacist_id + '&status=' + status).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.loadAccess();
            });
        };

        $scope.approveAccess = function (pharmacist_id) {
            setAccessApproval(pharmacist_id, 'approved');
        };

        $scope.declineAccess = function (pharmacist_id) {
            setAccessApproval(pharmacist_id, 'declined');
        };

        $scope.removeAccess = function (pharmacist_id, role) {
            if (!pharmacist_id || !role) return;
            var param = '';
            if (role == 'pharmacist' || role == 'admin') param = '&pharmacist_id=' + pharmacist_id;
            else if (role == 'delivery') param = '&delivery_id=' + pharmacist_id;
            APIService.delete('/pharmacy/access?pharmacy_id=' + $scope.pharmacyId + param).then(function (response) {
                if (response === undefined) return;
                if (response.s === 'f') {
                    $scope.saveFailed = true;
                    $scope.error_m = response.m;
                    return;
                } else {
                    $scope.loadAccess();
                    return;
                }
            });
        };
    }
]);

