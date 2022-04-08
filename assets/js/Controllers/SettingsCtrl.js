// Profile Settings Controller
angular.module('app').controller('SettingsCtrl', ['$rootScope', '$scope', '$filter', '$window', 'APIService',
    function ($rootScope, $scope, $filter, $window, APIService) {

        $scope.loadData = function() {
            $scope.helpers.uiBlocks('.block', 'state_loading');
            APIService.get('/me').then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.me = response.result;
                var offset = new Date().getTimezoneOffset();
                $scope.me.profile.dob = $scope.me.profile.dob;
                $scope.me.profile.dob_format = $filter('date')($scope.me.profile.dob, 'MM/dd/yyyy');
            });
        };
        $scope.loadData();

        $scope.cancelForm = function() {
            $scope.clearChoosenAvatar();
            $scope.loadData();
        };

        function _base64ToArrayBuffer(base64) {
            var binary_string = atob(base64);
            var len = binary_string.length;
            var bytes = new Uint8Array(len);
            for (var i = 0; i < len; i++) {
                bytes[i] = binary_string.charCodeAt(i);
            }
            return bytes.buffer;
        };

        $scope.setProfileFile = function(element) {
            $scope.$apply(function($scope) {
                if (element.files.length > 0) {
                    $scope.profile_chosen_file = element.files[0];
                }
            });
        };

        $scope.updateAvatar = function () {
            var profile_el = angular.element('#profile_image')[0];
            if (profile_el.files.length == 0) return;
            var f = profile_el.files[0],
                r = new FileReader();
            r.onloadend = function (e) {
                var data = e.target.result;
                APIService.patch_b64('/me/avatar', data).then(function (response) {
                    $rootScope.$broadcast('loadUserAvatar');
                    $scope.me.profile.has_avatar = true;
                    $scope.clearChoosenAvatar();
                    $.notify({message: 'Avatar Updated!', icon: 'fa fa-check'});
                }).finally(function() {
                    $scope.uploadingAvatar = false;
                })
            }
            $scope.uploadingAvatar = true;
            r.readAsDataURL(f);
        };

        $scope.deleteAvatar = function () {
            $scope.deletingAvatar = true;
            APIService.delete('/me/avatar').then(function (response) {
                $rootScope.$broadcast('loadUserAvatar');
                $scope.me.profile.has_avatar = false;
                $.notify({message: 'Avatar Deleted!', icon: 'fa fa-check'});
            }).finally(function() {
                $scope.deletingAvatar = false;
            });
        };

        $scope.clearChoosenAvatar = function() {
            $scope.profile_chosen_file = null;
            angular.element('#profile_image').val('');
        };

        $scope.updateProfile = function (isValid) {

            $scope.saveFailed = false;
            $scope.saveSuccess = false;
            $scope.formSubmitted = true;
            if (!isValid) return false;

            var dt = new Date($scope.me.profile.dob_format);
            $scope.me.profile.dob = dt.getTime() - dt.getTimezoneOffset() * 60 * 1000;

            var data = {
                profile: {
                    first_name: $scope.me.profile.first_name,
                    last_name: $scope.me.profile.last_name,
                    dob: $scope.me.profile.dob,
                    email: $scope.me.profile.email,
                    phone_number: $scope.me.profile.phone_number,
                    gender: $scope.me.profile.gender
                }
            };

            $scope.helpers.uiBlocks('.block', 'state_loading');
            APIService.put('/me', data).then(function (response) {
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

        $scope.changePassword = function (isValid) {

            $scope.passwordSaveFailed = false;
            $scope.passwordSaveSuccess = false;
            $scope.passwordFormSubmitted = true;

            if (!isValid) return false;

            var data = {                
                current_password: $scope.me.current_password,
                new_password: $scope.me.password
            };

            $scope.helpers.uiBlocks('.block', 'state_loading');
            APIService.put('/me', data).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s === 'f') {
                    $scope.passwordSaveFailed = true;
                    $scope.error_m = response.m;
                    return;
                } else {
                    $scope.passwordSaveSuccess = true;
                    $scope.passwordFormSubmitted = false;
                    $scope.me.current_password = '';
                    $scope.me.confirm_password = '';
                    $scope.me.new_password = '';
                    return;
                }
            });
        };
    }
]);