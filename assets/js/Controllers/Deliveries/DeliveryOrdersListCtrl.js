// Delivery Orders List Controller
angular.module('app').controller('DeliveryOrdersListCtrl', ['$scope', '$stateParams', 'APIService',
    function ($scope, $stateParams, APIService) {
        $scope.current_page = 1;
        $scope.page_size = 10;
        $scope.page_sizes = [5, 10, 15, 20, 50];
        $scope.page_total = 1;

        $scope.orderby = 'id';
        $scope.reverse = true;
        $scope.order_status_labels = angular.copy(SHARED_CONST.order_status_labels);
            
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
            $scope.deliveries = [];
            $scope.helpers.uiBlocks('.block', 'state_loading');
            if ($scope.page_total <= ($scope.current_page - 1) * $scope.page_size) $scope.current_page = 1;

            var request = $stateParams.request || '';
            var url = request === ''? '/delivery/order?' : '/delivery/order?q=' + request + "&";

            APIService.get(url + 'count=' + $scope.page_size + '&page=' + $scope.current_page).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.orders = response.result.orders;
                $scope.deliveries = response.result.deliveries;
                $scope.facilities = response.result.facilities;
                $scope.patients = response.result.patients;

                $scope.orders.forEach(function (order, index, array) {
                    if (order.delivery_id) {
                        order.delivery = $.grep($scope.deliveries, function (e) {
                            return e.id == order.delivery_id;
                        })[0];
                    }
                    if (order.patient_id) {
                        order.patient = $.grep($scope.patients, function (e) {
                            return e.id == order.patient_id;
                        })[0];
                    }
                    if (order.facility_id) {
                        order.facility = $.grep($scope.facilities, function (e) {
                            return e.id == order.facility_id;
                        })[0];
                    }

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
            });
        }

        $scope.loadData();
    }
]);