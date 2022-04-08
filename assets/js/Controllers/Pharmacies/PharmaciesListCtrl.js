// Pharmacies List Controller
angular.module('app').controller('PharmaciesListCtrl', ['$scope', '$stateParams', 'APIService',
    function ($scope, $stateParams, APIService) {
        $scope.current_page = 1;
        $scope.page_size = 50;
        $scope.page_sizes = [5, 10, 15, 20, 50, 100];
        $scope.page_total = 1;

        $scope.orderby = 'id';
        $scope.reverse = false;

        $scope.prevPage = function () {
            if ($scope.current_page > 1) {
                $scope.current_page -= 1;
                $scope.loadData();
            }
        };

        $scope.nextPage = function () {
            if ($scope.current_page * $scope.page_size < $scope.page_total) {
                $scope.current_page += 1;
                $scope.loadData();
            }
        };

        $scope.loadData = function () {
            $scope.pharmacies = [];
            $scope.helpers.uiBlocks('.block', 'state_loading');
            if ($scope.page_total <= ($scope.current_page - 1) * $scope.page_size) $scope.current_page = 1;

            var request = $stateParams.request || '';
            var url = request === ''? '/pharmacy?' : '/pharmacy?q=' + request + "&";

            APIService.get(url + 'count=' + $scope.page_size + '&page=' + $scope.current_page).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');

                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.pharmacies = response.result;
                
                if (response.paging) {
                    $scope.page_total = response.paging.total;
                }
                var page_numbers = [];
                var i = 0;
                do {
                    i += 1;
                    page_numbers.push(i);
                } while ($scope.page_size * i < $scope.page_total);
                $scope.page_numbers = page_numbers;
            });
        };

        $scope.loadData();
    }
]);
