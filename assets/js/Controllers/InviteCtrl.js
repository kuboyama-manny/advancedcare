// Users Invitation Controller
angular.module('app').controller('InviteCtrl', ['$scope', '$state', '$location', '$window', '$interval', 'AuthorizationService', 'APIService',
    function ($scope, $state, $location, $window, $interval, AuthorizationService, APIService) {

        $scope.skipPhoneVerify = true;

        // $scope.roles = ['doctor', 'delivery', 'nurse'];
        $scope.roles = [];

        $scope.loadRoles = function (role) {
            $scope.helpers.uiBlocks('.block', 'state_loading');

            var url = '/admin/role?';

            APIService.get(url).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }

                response.result.forEach(function (role, index, array) {
                    // if (role.is_default) {
                    if (role.role !== 'admin' &&
                        role.name.toLowerCase().indexOf('test') < 0 &&
                        role.name.toLowerCase().indexOf('helper') < 0) {

                        $scope.roles.push({'id': role.id, 'role': role.role, 'name': role.name});
                    }
                });
            });
        };
        $scope.loadRoles();

        $scope.save = function (isValid) {

            if (!isValid) {
                $scope.saveFailed = true;
                $scope.formSubmitted = true;
                $scope.error_m = 'required_fields_missing';
                return false;
            }

            $scope.saveFailed = false;
            $scope.saveSuccess = false;

            $scope.roles.forEach(function (role, index, array) {
                if (role.id === parseInt($scope.newuser.role_id)) {
                    $scope.newuser.role = role.role;
                    return;
                }
            });

            $scope.helpers.uiBlocks('.block', 'state_loading');
            APIService.post('/person/invite', $scope.newuser).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s === 'f') {
                    $scope.saveFailed = true;
                    $scope.error_m = response.m;
                    return;
                } else {
                    $scope.saveSuccess = true;
                    return;
                }
            });
        };

        var hideSidebar = function () {
            $scope.oneui.settings.sidebarOpen = false;
            $scope.oneui.settings.sidebarOpenXs = false;
            $scope.oneui.settings.sidebarMini = false;
            $scope.oneui.settings.headerFixed = false;
        }

        $scope.sessionNotFound = true;
        $scope.initAcceptInvite = function () {
            hideSidebar();
            $scope.inviteSession = $location.search().session;
            AuthorizationService.setInviteSession($scope.inviteSession);
            if ($scope.inviteSession) {
                $scope.helpers.uiBlocks('.block', 'state_loading');
                APIService.get('/invite?session=' + $scope.inviteSession).then(function (response) {
                    $scope.helpers.uiBlocks('.block', 'state_normal');
                    if (response === undefined) return;

                    // xiaoning notes: backend redirected frontend to new page, never return correct response status.
                    // no need check response status here.

                    // if (response.s === 'f') {
                    //     $scope.sessionNotFound = true;
                    //     $scope.error_m = response.m;
                    //     return;
                    // } else {
                        $scope.sessionNotFound = false;
                        $scope.inviteuser = response.result;
                        $window.localStorage.inviteUserRole = $scope.inviteuser.role;
                        return;
                    // }
                });
            }
        };

        $scope.submitAcceptForm = function (isValid) {

            $scope.formSubmitted = true;
            $scope.submitFailed = false;
            $scope.submitSuccess = false;
            $scope.sessionNotFound = false;

            if (!isValid) return false;

            var session = $scope.inviteSession;
            $scope.helpers.uiBlocks('.block', 'state_loading');
            APIService.patch('/invite?session=' + $scope.inviteSession, $scope.inviteuser).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s === 'f') {
                    $scope.submitFailed = true;
                    $scope.error_m = response.m;
                    return;
                } else if (response.s === 's') {
                    $scope.submitSuccess = true;
                    $state.go('accept-invite-auth');
                    return;
                }
            });
        };

        $scope.initAuth = function () {
            hideSidebar();
            $scope.sessionInvalid = true;
            $scope.inviteSession = AuthorizationService.getInviteSession();
            $scope.helpers.uiBlocks('.block', 'state_loading');
            APIService.get('/invite/status?session=' + $scope.inviteSession).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s && response.s === 'f') return;
                if (response.result && response.result.status != 'signup_waiting' && response.result.status != 'phone_waiting' && response.result.status != 'phone_ready') return;

                $scope.signup_status = response.result.status;
                if ($scope.signup_status == 'phone_waiting') {
                    $scope.refreshDigits();
                }
                $scope.sessionInvalid = false;
            });

            $scope.refreshDigits = function () {
                $scope.formFailed = false;
                $scope.helpers.uiBlocks('.block', 'state_loading');
                APIService.post('/invite/call?session=' + $scope.inviteSession).then(function (response) {
                    $scope.helpers.uiBlocks('.block', 'state_normal');
                    if (response === undefined) return;
                    if (response.s === 'f') {
                        $scope.formFailed = true;
                        $scope.error_m = response.m;
                        return;
                    } else if (response.s === 's') {
                        $scope.phone_digits = response.result.digits;
                        $scope.signup_status = 'phone_ready';
                        return;
                    }
                });
            };

            $scope.callNow = function () {
                APIService.patch('/invite/call?&session=' + $scope.inviteSession).then(function (response) {
                    if (response === undefined) return;
                    if (response.s && response.s === 'f') {
                        return;
                    }
                    $scope.signup_status = 'phone_calling';
                    $scope.refreshStatus();
                });
            };

            var stop;
            $scope.refreshStatus = function () {
                if (angular.isDefined(stop)) return;
                stop = $interval(function () {
                    APIService.get('/invite/status?session=' + $scope.inviteSession).then(function (response) {
                        $scope.helpers.uiBlocks('.block', 'state_normal');
                        if (response === undefined) return;
                        if (response.s && response.s === 'f') return;
                        $scope.signup_status = response.result.status;
                        if ($scope.signup_status == 'signup_waiting' || $scope.signup_status == 'phone_error') {
                            $scope.stopRefreshStatus();
                            if ($scope.signup_status == 'phone_error') {
                                $scope.had_phone_error = true;
                                $scope.getDigits();
                            }
                        }
                    });
                }, 2000);
            };

            $scope.stopRefreshStatus = function () {
                if (angular.isDefined(stop)) {
                    $interval.cancel(stop);
                    stop = undefined;
                }
            };

            $scope.$on('$destroy', function () {
                // Make sure that the interval is destroyed too
                $scope.stopRefreshStatus();
            });

            $scope.formSuccess = false;
            $scope.submitAuthForm = function (isValid) {
                if ($scope.sessionInvalid) {
                    $state.go('login');
                    return false;
                }
                if (!isValid) return false;
                $scope.formSubmitted = true;
                $scope.formFailed = false;
                $scope.formSuccess = false;
                var session = AuthorizationService.getInviteSession();
                $scope.helpers.uiBlocks('.block', 'state_loading');
                APIService.post('/invite/password?session=' + session, $scope.authuser).then(function (response) {
                    $scope.helpers.uiBlocks('.block', 'state_normal');
                    if (response === undefined) return;
                    if (response.s === 'f') {
                        $scope.formFailed = true;
                        $scope.error_m = response.m;
                        return;
                    } else if (response.s === 's') {
                        $scope.formSuccess = true;
                        $scope.approvalRequired = response.result.approval_needed === 'true';
                        $scope.role = $window.localStorage.inviteUserRole;
                        AuthorizationService.clearInviteSession();
                        return;
                    }
                });
            };
        };
    }
]);


