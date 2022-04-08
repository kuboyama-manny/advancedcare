
// Application Main Controller
angular.module('app').controller('AppCtrl', ['$rootScope', '$scope', '$localStorage', '$window', 'APIService', 'AuthorizationService',
    function ($rootScope, $scope, $localStorage, $window, APIService, AuthorizationService) {
        // Template Settings
        $scope.oneui = {
            version: '2.0', // Template version
            localStorage: true, // Enable/Disable local storage
            settings: {
                activeColorTheme: false, // Set a color theme of your choice, available: 'amethyst', 'city, 'flat', 'modern' and 'smooth'
                sidebarLeft: true, // true: Left Sidebar and right Side Overlay, false: Right Sidebar and left Side Overlay
                sidebarOpen: false, // Visible Sidebar by default (> 991px)
                sidebarOpenXs: false, // Visible Sidebar by default (< 992px)
                sidebarMini: false, // Mini hoverable Sidebar (> 991px)
                sideOverlayOpen: false, // Visible Side Overlay by default (> 991px)
                sideOverlayHover: false, // Hoverable Side Overlay (> 991px)
                sideScroll: true, // Enables custom scrolling on Sidebar and Side Overlay instead of native scrolling (> 991px)
                headerFixed: true // Enables fixed header
            }
        };

        // If local storage setting is enabled
        if ($scope.oneui.localStorage) {
            // Save/Restore local storage settings
            if ($scope.oneui.localStorage) {
                if (angular.isDefined($localStorage.oneuiSettings)) {
                    $scope.oneui.settings = $localStorage.oneuiSettings;
                } else {
                    $localStorage.oneuiSettings = $scope.oneui.settings;
                }
            }

            // Watch for settings changes
            $scope.$watch('oneui.settings', function () {
                // If settings are changed then save them to localstorage
                $localStorage.oneuiSettings = $scope.oneui.settings;
            }, true);
        }

        if(window.localStorage && window.localStorage.token) {
          $scope.oneui.settings.sidebarOpen = !!window.localStorage.token;   // should init after auth loaded
        }

        // Watch for activeColorTheme variable update
        $scope.$watch('oneui.settings.activeColorTheme', function () {
            // Handle Color Theme
            $scope.helpers.uiHandleColorTheme($scope.oneui.settings.activeColorTheme);
        }, true);

        // Watch for sideScroll variable update
        $scope.$watch('oneui.settings.sideScroll', function () {
            // Handle Scrolling
            setTimeout(function () {
                $scope.helpers.uiHandleScroll();
            }, 150);
        }, true);

        // When view content is loaded
        $scope.$on('$viewContentLoaded', function () {
            // Hide page loader
            $scope.helpers.uiLoader('hide');
            // Resize #main-container
            $scope.helpers.uiHandleMain();
        });

        $scope.check = function(action, permission) {
          return AuthorizationService.check(action, permission);
        };

        $scope.checkRole = function(role) {
          return AuthorizationService.checkRole(role);
        };
        
        var _arrayBufferToBase64 = function( buffer ) {
          var binary = '';
          var bytes = new Uint8Array( buffer );
          var len = bytes.byteLength;
          for (var i = 0; i < len; i++) {
            binary += String.fromCharCode( bytes[ i ] );
          }
          return window.btoa( binary );
        };

        $scope.$on('loadUserAvatar', function (event) {
          loadAvatar();
        });

        var loadAvatar = function() {
          if ($window.localStorage.token) {
            $scope.avatar_url = APIService.API_URL + '/me/avatar?' + new Date().getTime() + '&token=' + encodeURIComponent($window.localStorage.token);
          }
        };
        loadAvatar();
    }
]);
