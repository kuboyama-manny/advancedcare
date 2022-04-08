
// Sidebar Controller
angular.module('app').controller('SidebarCtrl', ['$scope', '$rootScope', '$localStorage', '$window', '$location', '$state','Upload', 'AlfrescoService', 'SharedVariablesService',
    function ($scope, $rootScope, $localStorage, $window, $location, $state, Upload,AlfrescoService, SharedVariablesService) {

        $scope.SharedVariablesService = SharedVariablesService;
        $scope.a_user_role = $window.localStorage.role;        
        // When view content is loaded
        $scope.$on('$includeContentLoaded', function () {
            // Handle Scrolling
            $scope.helpers.uiHandleScroll();
            // Get current path to use it for adding active classes to our submenus
            $scope.path = $location.path();
        });
        $scope.get_role = function(role){
            return $window.localStorage.role == role;
        }
        $scope.clear_request = function() {
            var state = $state.current.name;
            $state.go(state, {request : ''});

        }
    }
]);