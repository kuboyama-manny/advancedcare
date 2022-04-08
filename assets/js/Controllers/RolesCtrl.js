// Admin Roles Controller
angular.module('app').controller('RolesCtrl', ['$scope', '$stateParams', 'APIService',
    function ($scope, $stateParams, APIService) {
        $scope.current_page = 1;
        $scope.page_size = 10;
        $scope.page_sizes = [5, 10, 15, 20, 50];
        $scope.page_total = 1;

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

        $scope.loadList = function (role) {
            $scope.helpers.uiBlocks('.block', 'state_loading');
            if ($scope.page_total <= ($scope.current_page - 1) * $scope.page_size) $scope.current_page = 1;

            var request = $stateParams.request || '';
            var url = request === ''? '/admin/role?' : '/admin/role?q=' + request + "&";

            APIService.get(url + 'count=' + $scope.page_size + '&page=' + $scope.current_page).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.roles = response.result;

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

        var prepareData = function (role) {
            role.permissions = [];
            role.list.forEach(function (item, index, array) {
                role.permissions[item.resource] = [];
                item.access.forEach(function (it, index, array) {
                    role.permissions[item.resource][it] = true;
                });
            });
        };

        $scope.roleId = $stateParams.roleId;
        $scope.loadDetail = function (role) {
            $scope.helpers.uiBlocks('.block', 'state_loading');
            APIService.get('/admin/role?id=' + $scope.roleId).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.role = response.result;

                prepareData($scope.role);
            });
        };

        $scope.saveRole = function (isValid) {
            if (!isValid) return false;

            var list = [];
            var role = $scope.role;



            if ('permissions' in role) {
                Object.keys(role.permissions).forEach(function (key) {
                    var value = role.permissions[key];
                    var resource = {
                        resource: key,
                        access: []
                    };
                    Object.keys(value).forEach(function (k) {
                        if (value[k]) resource.access.push(k);
                    });
                    list.push(resource);
                });
                role.list = list;
            } else {
                role.list = [];
            }

            $scope.saveFailed = false;
            $scope.saveSuccess = false;
            console.log(role);
            $scope.helpers.uiBlocks('.block', 'state_loading');
            if ($scope.roleId) {
                APIService.put('/admin/role?id=' + $scope.roleId, role).then(function (response) {
                    $scope.helpers.uiBlocks('.block', 'state_normal');
                    if (response === undefined) return;
                    if (response.s === 'f') {
                        $scope.saveFailed = true;
                        $scope.error_m = response.m;
                        return;
                    } else {
                        $scope.saveSuccess = true;
                        return;
                    }
                });
            } else {
                APIService.post('/admin/role', role).then(function (response) {
                    $scope.helpers.uiBlocks('.block', 'state_normal');
                    if (response === undefined) return;
                    if (response.s === 'f') {
                        $scope.saveFailed = true;
                        $scope.error_m = response.m;
                        return;
                    } else {
                        $scope.saveSuccess = true;
                        return;
                    }
                });
            }
        }
    }
]);
