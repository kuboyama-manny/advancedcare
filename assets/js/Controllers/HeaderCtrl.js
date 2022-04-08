
// Header Controller
angular.module('app').controller('HeaderCtrl', ['$scope', '$localStorage', '$window', '$state',
    function ($scope, $localStorage, $window, $state) {
        // When view content is loaded
        $scope.$on('$includeContentLoaded', function () {
            // Transparent header functionality
            $scope.helpers.uiHandleHeader();
        });

        $scope.search = function (searchRequest)
        {
            var state = $state.current.name;
            if (state === 'docs' || state === 'mydocs' || state === 'tasks' || state === 'file'){
                $state.go('searchdocs', {request : searchRequest});
            }
            else {
                $state.go(state, {request : searchRequest});
            }
        }
    }
]);
