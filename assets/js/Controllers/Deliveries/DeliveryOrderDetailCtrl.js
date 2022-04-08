
// Delivery Order Controller
angular.module('app').controller('DeliveryOrderDetailCtrl', ['$scope', '$state', '$stateParams', '$filter', '$window', 'APIService',
    function ($scope, $state, $stateParams, $filter, $window, APIService) {
        $scope.orderId = $stateParams.orderId;
        
        $scope.orderby = 'id';
        $scope.reverse = false;

        $scope.order_status_labels = angular.copy(SHARED_CONST.order_status_labels);

        $scope.loadData = function () {
            if (!$scope.orderId) return;
            $scope.helpers.uiBlocks('.block', 'state_loading');
            APIService.get('/delivery/order?id=' + $scope.orderId).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.order = response.result;
                if ($scope.order.has_recipient_sign) {
                    $scope.order.recipient_signature_url = APIService.API_URL + '/delivery/order/sign?id=' + $scope.order.id + '&type=recipient&token=' + encodeURIComponent($window.localStorage.token);
                }
                if ($scope.order.has_delivery_sign) {
                    $scope.order.delivery_signature_url = APIService.API_URL + '/delivery/order/sign?id=' + $scope.order.id + '&type=delivery&token=' + encodeURIComponent($window.localStorage.token);
                }

                $scope.order.orders.list.forEach(function (order, index, array) {
                    if (order.patient_id) {
                        order.patient = $.grep($scope.order.orders.patients, function (e) {
                            return e.id == order.patient_id;
                        })[0];
                        order.patient.name = order.patient.first_name + ' ' + order.patient.last_name;
                    }
                });
            });
        };

        $scope.cancelOrder = function () {
            alert('Cancel delivery is yet to be implemented.');
        }
    }
]);