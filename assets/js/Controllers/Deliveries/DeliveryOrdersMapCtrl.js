// Delivery Orders Map Controller
angular.module('app').controller('DeliveryOrdersMapCtrl', ['$scope', '$state', '$window', '$interval', 'APIService',
    function ($scope, $state, $window, $interval, APIService) {
        $scope.map_markers = false;

        $scope.loadData = function () {
            $scope.deliveries = [];
            $scope.markers = [];
            $scope.helpers.uiBlocks('.block', 'state_loading');
            APIService.get('/delivery/order').then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.orders = response.result.orders;
                $scope.deliveries = response.result.deliveries;
                $scope.facilities = response.result.facilities;
                $scope.patients = response.result.patients;
                $scope.pings = response.result.pings;

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
                });

                $scope.deliveries.forEach(function (driver, index, array) {
                    var ping = $.grep($scope.pings, function (e) {
                        return e.id == driver.ping_id;
                    })[0];

                    if (!ping) return;
                    ping.orders = $.grep($scope.orders, function (e) {
                        return e.ping_id == ping.id;
                    });

                    $scope.lat = ping.lat;
                    $scope.lng = ping.lon;

                    var color = 'FFD900';
                    var image = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + color;
                    var order_ids = ping.orders.map(function (a) {
                        if (a.status == 'delivered')
                            color = '00FF00';
                        else if (a.status == 'in_delivery')
                            color = '6699FF';
                        image = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + color;
                        return '<img src="' + image + '">' + 'Order #' + a.id + ' (' + a.patient.first_name + ' ' + a.patient.last_name + ')';
                    }).join('<br>');

                    var href = $state.href('driver-view', {
                        driverId: driver.id
                    }, {
                        absolute: false
                    });
                    $scope.markers.push({
                        lat: ping.lat,
                        lng: ping.lon,
                        icon: image,
                        title: 'Driver #' + driver.id + ' (' + driver.first_name + ' ' + driver.last_name + ')',
                        animation: google.maps.Animation.DROP,
                        infoWindow: {
                            content: '<strong>Driver #' + driver.id + ' (' + driver.first_name + ' ' + driver.last_name + ')</strong><br><br>' +
                            order_ids + '<br><br>' +
                            '<a href="' + href + '"><small>View Driver Details</small></a>'
                        }
                    });
                });
                if (!$scope.map_markers) initMapMarkers();
                $scope.map_markers.removeMarkers();
                $scope.map_markers.addMarkers($scope.markers);
            });
        }

        // Init Markers Map
        var initMapMarkers = function () {
            $scope.map_markers = new GMaps({
                div: '#js-map-markers',
                lat: $scope.lat,
                lng: $scope.lng,
                zoom: 6,
                scrollwheel: false
            });
        };

        var stop;
        stop = $interval($scope.loadData, 60000);

        var stopInterval = function () {
            if (angular.isDefined(stop)) {
                $interval.cancel(stop);
                stop = undefined;
            }
        };

        $scope.$on('$destroy', function () {
            stopInterval();
        });

        $scope.driverChosen = function () {
            if (!$scope.driver) return false;
            var ping = $.grep($scope.pings, function (e) {
                return e.id == $scope.driver.ping_id;
            })[0];
            $scope.map_markers.setCenter(ping.lat, ping.lon);
        }
    }
]);
