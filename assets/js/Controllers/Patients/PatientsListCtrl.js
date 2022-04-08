// Patients Controller
angular.module('app').controller('PatientsListCtrl', ['$scope', '$stateParams', 'APIService',
    function ($scope, $stateParams, APIService) {
        $scope.current_page = 1;
        $scope.page_size = 10;
        $scope.page_sizes = [5, 10, 15, 20, 50, 100, 200];
        $scope.page_total = 1;

        $scope.orderby = 'last_name';
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
            $scope.patients = [];
            $scope.helpers.uiBlocks('.block', 'state_loading');

            if ($scope.page_total <= ($scope.current_page - 1) * $scope.page_size) $scope.current_page = 1;

            var request = $stateParams.request || '';
            var url = request === ''? '/patient?' : '/patient?q=' + request + "&";

            APIService.get(url + 'count=' + $scope.page_size + '&page=' + $scope.current_page).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.patients = response.result.patients;
                
                $scope.facilities = response.result.facilities;
                $scope.doctors = response.result.doctors || [];
                $scope.patients.forEach(function (patient, index, array) {
                    patient.doctor = $.grep($scope.doctors, function (e) {
                        return e.id == patient.primary_doctor_id;
                    })[0];
                    if (patient.doctor)
                        patient.doctor_name = (patient.doctor.first_name || '') + ' ' + (patient.doctor.last_name || '');
                    patient.facility = $.grep($scope.facilities, function (e) {
                        return e.id == patient.facility_id;
                    })[0];
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

        $scope.loadData();
    }
]);

