// Delivery Order Controller
angular.module('app').controller('DeliveryOrderCtrl', ['$scope', '$state', '$stateParams', '$filter', '$window', 'APIService', 'AuthorizationService',
    function ($scope, $state, $stateParams, $filter, $window, APIService, AuthorizationService) {
        $scope.orderId = $stateParams.orderId;

        $scope.recipient = 'patient';
        $scope.facility_key = '';
        $scope.order_key = '';
        $scope.pharmacy_key = '';

        $scope.orderby = 'id';
        $scope.reverse = false;

        $scope.rxOrderId = $stateParams.rxOrderId;
        $scope.orders_list_filtered = [];

        $scope.order_status_labels = angular.copy(SHARED_CONST.delivery_order_status_labels);

        if ($scope.rxOrderId) {
            APIService.get('/order?id=' + $scope.rxOrderId).then(function (response) {
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.patient_key = response.result.patient.profile.first_name + ' ' + response.result.patient.profile.last_name;
                $scope.order.recipient = {
                    patient_id: response.result.patient.id,
                    patient: response.result.patient
                };
                $scope.searchPatient();
                $scope.rx_orders.push(response.result);
            });
        }

        $scope.initData = function () {
            $scope.order = {
                'recipient_sign_required': 'true',
                'delivery_sign_required': 'true'
            };
            $scope.rx_orders = [];
        };

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
                $scope.order.time_from_format = $filter('date')($scope.order.time_from, 'yyyy-MM-dd HH:mm');
                $scope.order.time_to_format = $filter('date')($scope.order.time_to, 'yyyy-MM-dd HH:mm');
                if ($scope.order.recipient.facility) {
                    $scope.recipient = 'facility';
                    $scope.facility_key = $scope.order.recipient.facility.name;
                    $scope.order.recipient.facility_id = $scope.order.recipient.facility.id;
                    $scope.searchFacility();
                } else {
                    $scope.recipient = 'patient';
                    $scope.patient_key = $scope.order.recipient.patient.profile.first_name + ' ' + $scope.order.recipient.patient.profile.last_name;
                    $scope.order.recipient.patient_id = $scope.order.recipient.patient.id;
                    $scope.searchPatient();
                }
                $scope.rx_orders = $scope.order.orders.list;

                $scope.order.orders.list.forEach(function (order, index, array) {
                    if (order.patient_id) {
                        order.patient = $.grep($scope.order.orders.patients, function (e) {
                            return e.id == order.patient_id;
                        })[0];
                        order.patient.name = order.patient.first_name + ' ' + order.patient.last_name;
                    }
                });

                if ($scope.order.delivery) $scope.order.delivery_id = $scope.order.delivery.id;
            });
        };

        $scope.searchPatient = function () {
            APIService.get('/patient?q=' + $scope.patient_key).then(function (response) {
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.patients_list = response.result.patients;
            });
        };

        $scope.patientChosen = function (patient_key) {
            if ($scope.order.recipient.patient) {
                $scope.patient_key = $scope.order.recipient.patient.first_name + ' ' + $scope.order.recipient.patient.last_name;
                patient_key.$setPristine();

                $scope.orders_list_filtered = $filter('filter')($scope.orders_list, {
                    patient_id: $scope.order.recipient.patient.id
                }, true);
            }
        };

        $scope.searchFacility = function () {
            APIService.get('/facility?q=' + $scope.facility_key).then(function (response) {
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.facilities_list = response.result;
            });
        };
        $scope.searchFacility();

        $scope.facilityChosen = function (facility_key) {
            if ($scope.order.recipient.facility) {
                $scope.facility_key = $scope.order.recipient.facility.name;
                facility_key.$setPristine();

                $scope.orders_list_filtered = $filter('filter')($scope.orders_list, {
                    facility_id: $scope.order.recipient.facility.id
                }, true);
            }
        };

        // set default pharmacy if there is only 1 pharmacy.
        $scope.loadPharmacy = function () {

            APIService.get('/pharmacy').then(function (response) {
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                if (response.result.length === 1) {
                    $scope.pharmacy_key = response.result[0].name;
                }
            });
        };
        $scope.loadPharmacy();

        $scope.searchPharmacy = function () {
            if (AuthorizationService.checkRole('delivery')) return;
            APIService.get('/pharmacy?q=' + $scope.pharmacy_key).then(function (response) {
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.pharmacies_list = response.result;
            });
        };
        $scope.searchPharmacy();

        $scope.pharmacyChosen = function (pharmacy_key) {
            if ($scope.order.pharmacy) {
                $scope.pharmacy_key = $scope.order.pharmacy.name;
                $scope.order.pharmacy_id = $scope.order.pharmacy.id;
                pharmacy_key.$setPristine();
            }
        };

        $scope.searchOrders = function () {
            if (AuthorizationService.checkRole('delivery')) return;
            APIService.get('/order?count=50&for_delivery=true&q=' + $scope.order_key).then(function (response) {
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.orders_list = response.result.list;
                $scope.orders_list_filtered = $scope.orders_list;
                $scope.orders_list_filtered_number = $scope.orders_list_filtered.length;
                $scope.orders_list.forEach(function (order, index, array) {
                    if (order.patient_id) {
                        order.patient = $.grep(response.result.patients, function (e) {
                            return e.id == order.patient_id;
                        })[0];
                    }
                    if (order.pharmacy_id) {
                        order.pharmacy = $.grep(response.result.pharmacies, function (e) {
                            return e.id == order.pharmacy_id;
                        })[0];
                    }
                    if (order.doctor_id) {
                        order.doctor = $.grep(response.result.doctors, function (e) {
                            return e.id == order.doctor_id;
                        })[0];
                    }
                    if (order.patient && order.patient.facility_id) {
                        order.facility_id = order.patient.facility_id;
                    }
                });
            });
        };

        if (!$scope.rxOrderId) {
            $scope.searchOrders();

        }
        $scope.searchOrders();

        $scope.searchDrivers = function () {
            if (AuthorizationService.checkRole('delivery')) return;
            APIService.get('/delivery').then(function (response) {
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.drivers_list = response.result;
            });
        };
        $scope.searchDrivers();

        $scope.beforeRenderStartDate = function ($view, $dates, $leftDate, $upDate, $rightDate) {
            var activeDate,
                now = new moment().subtract(1, $view).add(1, 'minute');
            if ($scope.order && $scope.order.time_to_format) {
                activeDate = moment($scope.order.time_to_format);
            }
            $dates.forEach(function (date) {
                if ((activeDate && date.localDateValue() >= activeDate.valueOf()) || (date.localDateValue() < now.valueOf())) {
                    date.selectable = false;
                }
            });

        };

        $scope.beforeRenderEndDate = function ($view, $dates, $leftDate, $upDate, $rightDate) {
            var activeDate,
                now = moment().subtract(1, $view).add(1, 'minute');
            if ($scope.order && $scope.order.time_from_format) {
                activeDate = moment($scope.order.time_from_format).subtract(1, $view).add(1, 'minute');
            }
            $dates.forEach(function (date) {
                if ((activeDate && date.localDateValue() <= activeDate.valueOf()) || (date.localDateValue() < now.valueOf())) {
                    date.selectable = false;
                }
            });
        };

        $scope.onTimeFromSet = function (oldDate, newDate) {
            if ($scope.order && $scope.order.time_from_format) {
                $scope.order.time_to_format = new Date();
                $scope.order.time_to_format.setTime($scope.order.time_from_format.getTime() + (1 * 60 * 60 * 1000));
            } else if($scope.order && $scope.order.time_to_format) {
                $scope.order.time_to_format = null;
            }
            $scope.$broadcast('time-from-changed');
        };

        $scope.onTimeToSet = function (oldDate, newDate) {
            $scope.$broadcast('time-to-changed');
        };

        $scope.addRxOrder = function () {
            if (!$scope.rx_order) return;
            var index = $scope.rx_orders.indexOf($scope.rx_order);
            if (index >= 0) return;
            $scope.rx_orders.push($scope.rx_order);
        };

        $scope.removeRxOrder = function (rx_order) {
            var index = $scope.rx_orders.indexOf(rx_order);
            $scope.rx_orders.splice(index, 1);
        };

        $scope.save = function (isValid) {

            if (!isValid) {
                $scope.saveFailed = true;
                $scope.error_m = 'required_fields_missing';
                return false;
            }

            $scope.saveFailed = false;
            $scope.saveSuccess = false;

            var order_ids = $scope.rx_orders.map(function (a) {
                return a.id;
            });
            $scope.order.orders = order_ids;
            if (order_ids.length == 0) {
                if (!$window.confirm('You did not choose to attach an order to this delivery. Do you still want to proceed? \r\n Ok to proceed')) {
                    return false;
                }
            } else {
                delete $scope.order.pharmacy_id;
            }

            $scope.order.time_from = new Date($scope.order.time_from_format).getTime();
            $scope.order.time_to = new Date($scope.order.time_to_format).getTime();

            if ($scope.recipient == 'patient') {
                $scope.order.recipient.patient_id = $scope.order.recipient.patient.id
                delete $scope.order.recipient.facility_id;
            } else {
                $scope.order.recipient.facility_id = $scope.order.recipient.facility.id
                delete $scope.order.recipient.patient_id;
            }

            $scope.helpers.uiBlocks('.block', 'state_loading');
            if ($scope.orderId) {
                // Update delivery order
                var order_to_save = $scope.order;
                if (AuthorizationService.checkRole('admin')) {
                    order_to_save = {
                        notes: $scope.order.notes
                    }
                }
                APIService.put('/delivery/order?id=' + $scope.orderId, order_to_save).then(function (response) {
                    $scope.helpers.uiBlocks('.block', 'state_normal');
                    if (response === undefined) return;
                    if (response.s === 'f') {
                        $scope.saveFailed = true;
                        $scope.error_m = response.m;
                        return;
                    } else {
                        $scope.saveSuccess = true;
                        $state.go('delivery-order-detail', {
                            'orderId': $scope.orderId
                        });
                        return;
                    }
                });
            } else {
                APIService.post('/delivery/order', $scope.order).then(function (response) {
                    $scope.helpers.uiBlocks('.block', 'state_normal');
                    if (response === undefined) return;
                    if (response.s === 'f') {
                        $scope.saveFailed = true;
                        $scope.error_m = response.m;
                        return;
                    } else {
                        $scope.saveSuccess = true;                       
                        $state.go('delivery-orders-list');
                        return;
                    }
                });
            }
        };
    }
]);