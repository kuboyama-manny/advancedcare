
// EMAR Patients Controller
angular.module('app').controller('EMARPatientsListCtrl', ['$scope', '$stateParams', 'APIService',
    function ($scope, $stateParams, APIService) {
        $scope.today = new Date();
        $scope.current_page = 1;
        $scope.page_size = 10;
        $scope.page_sizes = [5, 10, 15, 20, 50, 100, 200];
        $scope.page_total = 1;
        $scope.alerts = [];

        $scope.orderby = 'name';
        $scope.reverse = false;
        $scope.time_columns = angular.copy(SHARED_CONST.time_columns);

        /**
        * Loads data for prev page.
        **/
        $scope.prevPage = function () {
            if ($scope.current_page > 1) {
                $scope.current_page -= 1;
                $scope.loadData();
            }
        };

        /**
        * Loads data for next page.
        **/

        $scope.nextPage = function () {
            if ($scope.current_page * $scope.page_size < $scope.page_total) {
                $scope.current_page += 1;
                $scope.loadData();
            }
        };

        /**
        * Returns image url for the given schedule column
        *
        **/

        $scope.get_column_mark = function(actions, column)
        {
            var now = new Date();
            var ret_str = "";
            var str_date = (now.getMonth() + 1) + "/" + now.getDate() +"/"+ now.getFullYear();
            var column_start_time = new Date(str_date +" "+ column.from);
            var column_end_time = new Date(str_date +" "+ column.to);
            var totalCount = 0;
            var completedCount = 0;
            actions.map(function(item){
                scheduled_at = new Date(item.scheduled_at);

                if(item.scheduled_at == 0){
                    totalCount++;
                }

                if(scheduled_at.getTime() == column_start_time.getTime()){
                    totalCount++;
                    if(item.performed_at != 0){
                        completedCount++;
                    }
                }
            });

            if(totalCount == 0)
            {
                ret_str= "assets/img/empty.png";
            }else
            {
                if(totalCount - completedCount == 0)
                {
                    ret_str= "assets/img/check.png";
                }else if( completedCount == 0)
                {
                    ret_str= "assets/img/close.png";
                }else if(totalCount - completedCount > 0)
                {
                    ret_str= "assets/img/uncheck.png";
                }
            }

            return ret_str;
        }


        /**
        * Returns string for the ALERT/REMINDER column
        *
        **/

        $scope.get_alerts_reminders_text = function(patient)
        {
            actions = patient.med_schedules;
            var now = new Date();
            var ret_str = "";
            var str_date = (now.getMonth() + 1) + "/" + now.getDate() +"/"+ now.getFullYear();
            var scheduled_at, performed_at;
            
            actions.map(function(item){
                scheduled_at = new Date(item.scheduled_at);
                performed_at = new Date(item.performed_at);
                if(item.reason !="")
                    {                    
                        ret_str = ret_str + ("0" + (scheduled_at.getHours())).slice(-2) + ("0" + (scheduled_at.getMinutes())).slice(-2)+ " " + item.reason + ", " ; 
                    }
                });
            return ret_str;
        }

        $scope.loadData = function () {

            $scope.patients = [];
            $scope.helpers.uiBlocks('.block', 'state_loading');

            if ($scope.page_total <= ($scope.current_page - 1) * $scope.page_size) $scope.current_page = 1;

            var request = $stateParams.request || '';
            var url = request === ''? '/patient?' : '/patient?q=' + request + "&";
            url += "emar=true&";

            APIService.get(url + 'count=' + $scope.page_size + '&page=' + $scope.current_page).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');

                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }

                $scope.patients = response.result.patients;

                $scope.patients.map(function(patient){
                    $scope.helpers.uiBlocks('.block', 'state_loading');

                    APIService.get('/patient/med_alert?patient_id=' + patient.id).then(function (response_alert) {
                        $scope.helpers.uiBlocks('.block', 'state_normal');
                        if (response_alert === undefined) return;
                        if (response_alert.s && response_alert.s === 'f') {
                            return;
                        }

                        var alert_list = response_alert.result.med_alerts;
                        alert_list.map(function(item){
                            $scope.alerts.push(item);
                        });

                    });
                });

                var now = new Date();
                var default_date = new Date((now.getMonth() + 1) + "/" + now.getDate() +"/"+ now.getFullYear() + " 08:00:00");
                var end_date = new Date((now.getMonth() + 1) + "/" + now.getDate() +"/"+ now.getFullYear() + " 20:00:01");

                $scope.patients.map(function(patient){
                       var med_schedules_list = [];
                        patient.med_schedules.map(function(item){
                            scheduled_at = new Date(item.scheduled_at);
                            if(default_date.getTime() <= scheduled_at.getTime() && end_date.getTime() >= scheduled_at.getTime() ){
                                med_schedules_list.push(item);
                            }
                        });
                        patient.med_schedules = med_schedules_list;
                });

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
