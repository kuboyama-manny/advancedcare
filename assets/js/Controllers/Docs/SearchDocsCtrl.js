
// Search Controller
angular.module('app').controller('SearchDocsCtrl', ['$scope', '$state', '$stateParams', '$window', 'AlfrescoService', 'AuthorizationService', 'TimeFormatService',
    function ($scope, $state, $stateParams, $window, AlfrescoService, AuthorizationService, TimeFormatService) {

        $scope.current_files = [];

        $scope.request;
        $scope.sortBy = "cm:modified";
        $scope.ascending = false;
        $scope.searchIsDone = false;

        //pagination
        $scope.current_page = 1;
        $scope.page_size = 10;
        $scope.page_sizes = [5, 10, 15, 20, 50];
        $scope.page_total = 1;
        $scope.numberFound;

        AlfrescoService.setAuthFailureHandler(function(){
            $state.go('logout');
        });

        $scope.init = function () {
            $scope.request = $stateParams.request;
            $scope.search();
        };

        $scope.changeSorting = function (selectedColumn) {

            if ($scope.sortBy == selectedColumn){
                $scope.ascending = !$scope.ascending;
            } else {
                $scope.sortBy = selectedColumn;
            }
            $scope.search();
        };

        $scope.search = function () {

            $scope.searchIsDone = false;
            if ($scope.page_total <= ($scope.current_page - 1) * $scope.page_size) $scope.current_page = 1;

            $scope.show_file = false;
            $scope.searchResults = [];

            AlfrescoService.search(
                $scope.request,
                $scope.page_size,
                ($scope.current_page - 1) * $scope.page_size,
                $scope.sortBy,
                $scope.ascending
            ).then(function (response) {
                for (var j = 0; j < response.items.length; j++) {
                    var item = response.items[j];
                    if (item.type === "document") {
                        item.mimetypeFileType = AlfrescoService.getMimetypeFileType(item);
                        item.displayTime = TimeFormatService.format(item.modifiedOn);
                        item.displayCreatedOn = TimeFormatService.format(item.createdOn);
                        $scope.searchResults.push(item);
                    }
                }
                $scope.page_total = response.numberFound;
                var page_numbers = [];
                var i = 0;
                do {
                    i += 1;
                    page_numbers.push(i);
                } while ($scope.page_size * i < $scope.page_total);
                $scope.page_numbers = page_numbers;
                $scope.searchIsDone = true;
            });
        };

        $scope.openFile = function (file) {
            var backPoint = 'request:' + $scope.request;
            $state.go('file', {node_ref : file.nodeRef, from : backPoint});
        };

        $scope.prevPage = function () {
            if ($scope.current_page > 1) {
                $scope.current_page -= 1;
                $scope.search();
            }
        };

        $scope.nextPage = function () {
            if ($scope.current_page * $scope.page_size < $scope.page_total) {
                $scope.current_page += 1;
                $scope.search();
            }
        };

        if (!$scope.initalized) {
            $scope.initalized = true;

          if (AuthorizationService.getAlfrescoTicket()){
            $scope.init();
          } else {
            $scope.$on("alf_login_succ", function (event) {
              $scope.init();
            });
          }
        }
    }
]).directive("searchResult", function () {
    return {
        restrict: 'E',
        templateUrl: "assets/directive/search/search-result-list.html"
    }
});
