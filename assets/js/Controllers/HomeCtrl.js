// Dashboard Content Controller
angular.module('app').controller('HomeCtrl', ['$scope', '$state', '$window', '$timeout', '$interval', 'APIService', 'PushService', 'AlfrescoService',
                                 'AuthorizationService',
    function ($scope, $state, $window, $timeout, $interval, APIService, PushService, AlfrescoService, AuthorizationService) {

        $scope.order_status_labels = angular.copy(SHARED_CONST.order_status_labels);

        $scope.period = 'week';

        if (!$window.localStorage.pushServiceRegistered) {
            PushService.register();
        }

        AlfrescoService.setAuthFailureHandler(function(){
            $state.go('logout');
        });

        $scope.init = function() {
            if ('patient' === $window.localStorage.role) {
                $state.go('patients');
            } else {
                $scope.loadDocData('week');
            }
        }

        $scope.loadSummaryData = function (period) {
            $scope.helpers.uiBlocks('.block', 'state_loading');

            APIService.get('/order/dashboard?period='+period).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s && response.s === 'f') return;

                $scope.dataset = response.result;
                $scope.dataset.latest_orders.list.forEach(function (order, index, array) {
                    if (order.patient_id) {
                        order.patient = $.grep($scope.dataset.latest_orders.patients, function (e) {
                            return e.id == order.patient_id;
                        })[0];
                    }
                    if (order.facility_id) {
                        order.facility = $.grep($scope.dataset.latest_orders.facilities, function (e) {
                            return e.id == order.facility_id;
                        })[0];
                    }
                    if (order.doctor_id) {
                        order.doctor = $.grep($scope.dataset.latest_orders.doctors, function (e) {
                            return e.id == order.doctor_id;
                        })[0];
                    }
                    if (order.pharmacy_id) {
                        order.pharmacy = $.grep($scope.dataset.latest_orders.pharmacies, function (e) {
                            return e.id == order.pharmacy_id;
                        })[0];
                    }
                });

                $scope.dataset.latest_delivery_orders.orders.forEach(function (order, index, array) {
                    if (order.patient_id) {
                        order.patient = $.grep($scope.dataset.latest_delivery_orders.patients, function (e) {
                            return e.id == order.patient_id;
                        })[0];
                    }
                    if (order.facility_id) {
                        order.facility = $.grep($scope.dataset.latest_delivery_orders.facilities, function (e) {
                            return e.id == order.facility_id;
                        })[0];
                    }
                    if (order.delivery_id) {
                        order.delivery = $.grep($scope.dataset.latest_delivery_orders.deliveries, function (e) {
                            return e.id == order.delivery_id;
                        })[0];
                    }
                    if (order.delivery && order.delivery.ping_id) {
                        order.delivery.ping = $.grep($scope.dataset.latest_delivery_orders.pings, function (e) {
                            return e.id == order.delivery.ping_id;
                        })[0];
                    }
                });

                $timeout(initCharts(period), 1000);
            });
        };

        $scope.loadStatisticsData = function(period) {
            $scope.helpers.uiBlocks('.block', 'state_loading');

            APIService.get('/order/statistics?period='+period).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined || response === null) return;
                if (response.s && response.s === 'f') return;

                $scope.statistics = response.result;

                $scope.loadSummaryData(period);
            });
        }

        var inter;
        $scope.loadDocData = function (period) {
            $scope.helpers.uiBlocks('.block', 'state_loading');

            if (AuthorizationService.getAlfrescoTicket()) {
                AlfrescoService.getStats(period).then(function (response) {
                    $scope.documents = response.data;
                    $scope.loadStatisticsData(period);
                });
            } else {

                // have to wait alfreso logged in
                if (angular.isDefined(inter)) return;

                var count = 300;
                inter = $interval(function () {
                    if (AuthorizationService.getAlfrescoTicket()) {
                        AlfrescoService.getStats(period).then(function (response) {
                            $scope.documents = response.data;
                            $scope.loadStatisticsData(period);
                            $interval.cancel(inter);
                        });
                    } else {
                        count--;
                        if (count < 0) {
                            $interval.cancel(inter);
                            $state.go('logout');
                        }
                    }
                }, 5000);
            }

        };

        var initCharts = function (period) {
            $scope.period = period;

            // Get Chart Container
            var canvas = jQuery('.js-dash-chartjs-' + period);
            var dashChartLinesCon = canvas[0].getContext('2d');
            dashChartLinesCon.clearRect(0, 0, canvas.width(), canvas.height());

            // Set Chart and Chart Data variables
            var dashChartLines, dashChartLinesData;

            var xLabels = [];

            if ('week' === period) {
                xLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
            } else if ('month' === period) {
                var date = new Date(), y = date.getFullYear(), m = date.getMonth();
                var firstDay = new Date(y, m, 1);
                var lastDay = new Date(y, m + 1, 1);
                var timeDiff = Math.abs(lastDay.getTime() - firstDay.getTime());
                var days = Math.ceil(timeDiff / (1000 * 3600 * 24));

                xLabels = [];
                for( i=0; i<days; i++) {
                    var theDate = new Date(new Date().setDate(firstDay.getDate() + i)).toLocaleDateString();
                    xLabels.push(theDate);
                }
            } else {
                xLabels = ["Jan", "Feb", "Mar",
                    "Apr", "May", "Jun", "Jul",
                    "Aug", "Sep", "Oct",
                    "Nov", "Dec"];
            }

            // Lines Chart Data
            var dashChartLinesData = {
                labels: xLabels,
                datasets: [{
                    // documents
                    label: 'Documents',
                    fillColor: 'rgba(194, 84, 73, .15)',
                    strokeColor: 'rgba(194, 84, 73, 1)',
                    pointColor: 'rgba(194, 84, 73, 1)',
                    pointStrokeColor: '#fff',
                    pointHighlightFill: '#fff',
                    pointHighlightStroke: 'rgba(194, 84, 73, 1)',
                    data: $scope.documents.list
                }, {
                    // RX orders
                    label: 'RX Orders',
                    fillColor: 'rgba(171, 227, 125, .15)',
                    strokeColor: 'rgba(171, 227, 125, 1)',
                    pointColor: 'rgba(171, 227, 125, 1)',
                    pointStrokeColor: '#fff',
                    pointHighlightFill: '#fff',
                    pointHighlightStroke: 'rgba(171, 227, 125, 1)',
                    data: $scope.statistics.rx_orders
                }, {
                    // deliveries
                    label: 'Deliveries',
                    fillColor: 'rgba(93,165,224,.15)',
                    strokeColor: 'rgba(93,165,224,1)',
                    pointColor: 'rgba(93,165,224,1)',
                    pointStrokeColor: '#fff',
                    pointHighlightFill: '#fff',
                    pointHighlightStroke: 'rgba(93,165,224, 1)',
                    data: $scope.statistics.delivery_orders
                }]
            };

            var lineOptions = {
                scaleFontFamily: "'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                scaleFontColor: '#999',
                scaleFontStyle: '600',
                tooltipTitleFontFamily: "'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                tooltipCornerRadius: 3,
                maintainAspectRatio: false,
                responsive: true,
                legendTemplate : '<table style=\"width:400px; height: 40px;\"><tr>'
                    +'<% for (var i=0; i<datasets.length; i++) { %>'
                    +'<td width=\"25\"><div class=\"boxx\" style=\"background-color:<%=datasets[i].pointColor %>\"></div></td>'
                    +'<% if (datasets[i].label) { %><td align="left"><%= datasets[i].label %></td><% } %>'
                    +'<% } %>'
                    +'</tr></table>',
                multiTooltipTemplate: "<%= datasetLabel %> - <%= value %>"
            }

            // Init Lines Chart
            dashChartLines = new Chart(dashChartLinesCon).Line(dashChartLinesData, lineOptions);

            document.getElementById("legendDiv").innerHTML = dashChartLines.generateLegend();
        };

        $scope.queryStat = function (period) {
            $scope.loadDocData(period);
        }

        $scope.init();

        $scope.toDocSearch = function (period) {
            $state.go('search', {request : 'unscanned&period=' + period});
        }
    }
]);

