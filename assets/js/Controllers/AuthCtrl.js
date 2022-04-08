// Auth Controller
angular.module('app').controller('AuthCtrl', ['$rootScope', '$scope', '$state', '$location', '$window', '$interval', 'APIService', 'AuthorizationService', 'AlfrescoService', 'UserService', 'PushService',
    function ($rootScope, $scope, $state, $location, $window, $interval, APIService, AuthorizationService, AlfrescoService, UserService, PushService) {

        // skip phone verify.
        $scope.skipPhoneVerify = true;

        var initView = function () {
            $scope.oneui.settings.sidebarOpen = false;
            $scope.oneui.settings.sidebarOpenXs = false;
            $scope.oneui.settings.sidebarMini = false;
            $scope.oneui.settings.headerFixed = false;
        }

        $scope.initLogin = function () {
            var e = $location.search().e;
            if (e && e == 'e_chpwd_redirect') {
                $scope.chPasswordSuccess = true;
            }
        };

        var doLogin = function (user) {
            $scope.helpers.uiBlocks('.block', 'state_loading');
            APIService.login('/sign/in', user).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s === 'f') {
                    $scope.loginFailed = true;
                    $scope.error_m = response.m;
                    return false;
                }
                $window.localStorage.token = response.result.token;
                $window.localStorage.person_id = response.result.person_id;
                $window.localStorage.person_userName = user.login;
                UserService.setCurrentUser(user.login);

                // Login into Alfresco
                AlfrescoService.login(user.login, user.password).then(function(response) {
                    if (!!response && AuthorizationService.getAlfrescoTicket()) {
                        $scope.$broadcast("alf_login_succ");
                        console.log('Alfresco logged in.');
                        AlfrescoService.getAssignedFiles();
                    }
                });

                // make sure web push notification is registered.
                if (!$window.localStorage.pushServiceRegistered) {
                    PushService.register();
                }

                $window.localStorage.role = response.result.access.role;
                $rootScope.user_role = $window.localStorage.role
                $rootScope.$broadcast('loadUserAvatar');

                AuthorizationService.saveAccess(response.result.access);
                $scope.oneui.settings.sidebarOpen = true;

                // set different home page for different roles.
                if (response.result.access.name.toLowerCase().indexOf('nurse') != -1) {
                    $state.go('emar-patients');
                } else {
                    $state.go('root');
                }
            });
        };

        $scope.submitLoginForm = function (isValid) {

            $scope.loginSubmitted = true;
            $scope.loginFailed = false;
            if (!isValid) return false;
            doLogin($scope.loginuser);
        };

        $scope.initRegister = function () {
            $scope.sessionInvalid = true;
            var e = $location.search().e;
            if (e && e == 'e_session_not_found') {
                $scope.sessionNotFound = true;
            }
            $scope.registeruser = {
                role: 'pharmacy_admin'
            };
        };

        $scope.resumeRegister = function () {
            $scope.registerFailed = false;
            $scope.error_m = '';
        };

        $scope.submitRegisterForm = function (isValid) {

            $scope.registerSubmitted = true;
            $scope.registerFailed = false;
            $scope.registerSuccess = false;
            $scope.sessionNotFound = false;

            if (!isValid) return false;

            if ($scope.registeruser.dob_format) {
                var dt = new Date($scope.registeruser.dob_format);
                $scope.registeruser.dob = dt.getTime() - dt.getTimezoneOffset() * 60 * 1000;
            }

            $scope.helpers.uiBlocks('.block', 'state_loading');
            APIService.post('/sign/up/1', $scope.registeruser).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s === 'f') {
                    $scope.registerFailed = true;
                    $scope.error_m = response.m;
                    return;
                } else if (response.s === 's') {
                    $scope.registerSuccess = true;
                    return;
                }
            });
        };

        $scope.initAuth = function () {
            $scope.sessionInvalid = true;
            $scope.authuser = {};
            $scope.newpharmacy = {
                name: '',
                working_hours: {}
            };

            var session = $location.search().s;
            if (!session) return;
            $scope.session = session;
            $scope.helpers.uiBlocks('.block', 'state_loading');
            $scope.signup_status = '';
            APIService.get('/sign/up/status?session=' + $scope.session).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s && response.s === 'f') return;

                $scope.signup_status = response.result;
                if ($scope.signup_status == 'phone_ready' || $scope.signup_status == 'phone_error' || $scope.signup_status == 'phone_waiting' || $scope.signup_status == 'phone_calling') {
                    $scope.getDigits();
                }

                $scope.sessionInvalid = false;
                $scope.helpers.uiBlocks('.block', 'state_loading');
                APIService.get('/sign/up/2?session=' + session).then(function (response) {
                    $scope.helpers.uiBlocks('.block', 'state_normal');
                    if (response === undefined) return;
                    if (response.s && response.s === 'f') return;
                    $scope.role = response.result.role;
                    // $scope.role = 'pharmacy_admin';
                    if ($scope.role == 'doctor') {
                        $scope.formStep = 2;
                    } else {
                        $scope.formStep = 1;
                    }
                });
            });
        };

        $scope.getDigits = function () {
            APIService.post('/sign/up/call?&session=' + $scope.session).then(function (response) {
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.phone_digits = response.result.digits;
                $scope.signup_status = 'phone_ready';
            });
        };

        $scope.callNow = function () {
            APIService.patch('/sign/up/call?&session=' + $scope.session).then(function (response) {
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
                APIService.get('/sign/up/status?session=' + $scope.session).then(function (response) {
                    $scope.helpers.uiBlocks('.block', 'state_normal');
                    if (response === undefined) return;
                    if (response.s && response.s === 'f') return;
                    $scope.signup_status = response.result;
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

        $scope.gotoStep1 = function () {
            $scope.formStep = 1;
        };

        $scope.gotoStep2 = function () {
            if (($scope.role == 'delivery' || $scope.role == 'pharmacist') && !$scope.authuser.pharmacy_id) {
                $scope.step1Validate = true;
                return false;
            }
            if ($scope.role == 'pharmacy_admin' && (!$scope.newpharmacy.name || !$scope.newpharmacy.address)) {
                $scope.step1Validate = true;
                return false;
            }
            $scope.formStep = 2;
        };

        $scope.days = ['wd', 'mon', 'tue', 'wed', 'thu', 'fri', 'we', 'sat', 'sun'];
        $scope.dayNames = {
            'mon': 'Monday',
            'tue': 'Tuesday',
            'wed': 'Wednesday',
            'thu': 'Thursday',
            'fri': 'Friday',
            'sat': 'Saturday',
            'sun': 'Sunday',
            'wd': 'Weekdays',
            'we': 'Weekends'
        };

        $scope.noWorkingHours = function () {
            return !$scope.newpharmacy || !$scope.newpharmacy.working_hours || angular.equals({}, $scope.newpharmacy.working_hours);
        };

        var sortWorkingOrders = function () {
            var hours = {};

            $scope.days.forEach(function (item, index, array) {
                if ($scope.newpharmacy.working_hours[item]) {
                    hours[item] = $scope.newpharmacy.working_hours[item];
                }
            });
            $scope.newpharmacy.working_hours = hours;
        };

        $scope.addHour = function () {
            if (!$scope.newhour || !$scope.newhour.day || !$scope.newhour.open || !$scope.newhour.close) return false;
            var o = $scope.newhour.open, c = $scope.newhour.close;
            var oh = o.split(':')[0], om = o.split(':')[1];
            var ch = c.split(':')[0], cm = c.split(':')[1];

            $scope.newpharmacy.working_hours[$scope.newhour.day] = [{h: oh, m: om}, {h: ch, m: cm}];
            sortWorkingOrders($scope.newpharmacy.working_hours);

            $scope.newhour = {};
        };

        $scope.removeHour = function (key) {
            delete $scope.newpharmacy.working_hours[key];
        };

        $scope.searchPharmacyAddress = function () {
            if ($scope.pharmacy_address_key == '') {
                $scope.pharmacy_addresses_list = [];
                delete $scope.newpharmacy.address;
                return;
            }

            APIService.get('/sign/up/address?q=' + $scope.pharmacy_address_key + '&session=' + $scope.session).then(function (response) {
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.pharmacy_addresses_list = response.result;
            });
        };

        $scope.pharmacyAddressChosen = function (address_key) {
            if ($scope.newpharmacy.address) {
                $scope.pharmacy_address_key = $scope.newpharmacy.address.description;
                address_key.$setPristine();
            }
        };

        $scope.searchPharmacy = function () {
            if ($scope.pharmacy_key == '') {
                delete $scope.authuser.pharmacy;
                delete $scope.authuser.pharmacy_id;
            } else {
                APIService.get('/sign/up/pharmacy?session=' + $scope.session + "&q=" + $scope.pharmacy_key).then(function (response) {
                    if (response === undefined) return;
                    if (response.s && response.s === 'f') {
                        return;
                    }
                    $scope.pharmacies_list = response.result;
                });
            }
        };

        $scope.pharmacyChosen = function (pharmacy_key) {
            if ($scope.pharmacy_chosen) {
                $scope.pharmacy_key = $scope.pharmacy_chosen.name;
                $scope.authuser.pharmacy_id = $scope.pharmacy_chosen.id;
                pharmacy_key.$setPristine();
            }
        };

        $scope.formSuccess = false;
        $scope.submitAuthForm = function (isValid) {

            if ($scope.sessionInvalid) {
                $state.go('register');
                return false;
            }
            $scope.formSubmitted = true;
            $scope.formFailed = false;
            $scope.formSuccess = false;

            if (!isValid) return false;

            if ($scope.newpharmacy && !$scope.authuser.pharmacy_id && $scope.role != 'doctor') {
                $scope.authuser.pharmacy = $scope.newpharmacy;
            }

            $scope.helpers.uiBlocks('.block', 'state_loading');
            APIService.post('/sign/up/2?session=' + $scope.session, $scope.authuser).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s === 'f') {
                    $scope.formFailed = true;
                    $scope.error_m = response.m;
                    return;
                } else if (response.s === 's') {
                    $scope.formSuccess = true;
                    AuthorizationService.clearSignupSession();
                    $scope.approvalRequired = response.result.approval_needed;
                    return;
                }
            });
        };

        $scope.forgotSubmitted = false;
        $scope.forgotFailed = false;
        $scope.submitForgotForm = function (isValid) {

            $scope.forgotSubmitted = true;
            $scope.forgotFailed = false;
            if (!isValid) return false;

            $scope.helpers.uiBlocks('.block', 'state_loading');
            APIService.patch('/reset_password', $scope.user).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s === 'f') {
                    $scope.forgotFailed = true;
                    $scope.error_m = response.m;
                    return false;
                }
                $scope.forgotSuccess = true;
            });
        };

        $scope.initReset = function () {
            $scope.resetFailed = false;
            $scope.resetSuccess = false;
            $scope.session = $location.search().session;
        };

        $scope.submitResetForm = function (isValid) {
            $scope.formSubmitted = true;
            $scope.resetFailed = false;
            if (!isValid) return false;

            $scope.helpers.uiBlocks('.block', 'state_loading');
            APIService.put('/reset_password?session=' + $scope.session, $scope.reset).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    $scope.resetFailed = true;
                    $scope.error_m = response.m;
                    return;
                }
                $scope.resetSuccess = true;
            });
        };

        $scope.logout = function () {
            delete $window.localStorage.token;
            delete $window.localStorage.role;
            delete $window.localStorage.access;
            delete $window.localStorage.person_id;
            delete $window.localStorage.user_avatar;
            delete $window.localStorage.alfTicket;
            delete $window.localStorage.alf_folder_eventSource;
            delete $window.localStorage.alf_file_eventSource;
            delete $window.localStorage.pushServiceRegistered;
            delete $window.localStorage.alfTicketValidateStatus;

            $state.go('login');
        };

        initView();
    }
]);
