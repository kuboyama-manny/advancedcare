// Orders List Controller
angular.module('app').controller('OrdersListCtrl', ['$scope', '$window', '$stateParams', 'APIService',
    function ($scope, $window, $stateParams, APIService) {
        $scope.current_page = 1;
        $scope.page_size = 50;
        $scope.page_sizes = [5, 10, 15, 20, 50, 100];
        $scope.page_total = 1;

        $scope.is_admin = $window.localStorage.role == 'admin';
        $scope.is_pharmacist = $window.localStorage.role == 'pharmacist';

        $scope.orderby = 'created_at';
        $scope.reverse = true;
        $scope.order_status_labels = angular.copy(SHARED_CONST.order_status_labels);

        $scope.order_status_labels_pharmacist = angular.copy(SHARED_CONST.order_status_labels_pharmacist);
         
        $scope.prevPage = function () {
            if ($scope.current_page > 1) {
                $scope.current_page -= 1;
                $scope.loadList();
            }
        };

        $scope.nextPage = function () {
            if ($scope.current_page * $scope.page_size < $scope.page_total) {
                $scope.current_page += 1;
                $scope.loadList();
            }
        };

        $scope.loadList = function () {            
            $scope.helpers.uiBlocks('.block', 'state_loading');
            if ($scope.page_total <= ($scope.current_page - 1) * $scope.page_size) $scope.current_page = 1;

            var request = $stateParams.request || '';
            var url = request === ''? '/order?' : '/order?q=' + request + "&";

            APIService.get(url + 'count=' + $scope.page_size + '&page=' + $scope.current_page).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.orders = response.result.list;
                $scope.doctors = response.result.doctors;
                $scope.patients = response.result.patients;
                $scope.pharmacies = response.result.pharmacies;

                $scope.orders.forEach(function (order, index, array) {
                    if (order.doctor_id) {
                        order.doctor = $.grep($scope.doctors, function (e) {
                            return e.id == order.doctor_id;
                        })[0];
                    }
                    if (order.patient_id) {
                        order.patient = $.grep($scope.patients, function (e) {
                            return e.id == order.patient_id;
                        })[0];
                    }
                    if (order.pharmacy_id) {
                        order.pharmacy = $.grep($scope.pharmacies, function (e) {
                            return e.id == order.pharmacy_id;
                        })[0];
                    }
                });
                
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
        $scope.loadList();
    }
]);
