
// Drugs List Controller
angular.module('app').controller('DrugsListCtrl', ['$scope', '$stateParams', 'APIService',
    function ($scope, $stateParams, APIService) {
        
        $scope.current_page = 0;
        $scope.page_size = 15;
        $scope.reverse = true;

        var loadData = function () {
            $scope.drivers = [];
            $scope.helpers.uiBlocks('.block', 'state_loading');

            var request = $stateParams.request || '';
            var url = request === ''? '/drug' : '/drug?q=' + request;

            APIService.get(url).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.drugs = response.result;

                if ($scope.drugs.history) {
                    $scope.drugs.history.forEach(function (item, index, array) {
                        item.formulary = $.grep($scope.drugs.formularies, function (e) {
                            return e.id == item.formulary_id;
                        })[0];
                    });
                }
            });
        }

        loadData();
    }
]);
