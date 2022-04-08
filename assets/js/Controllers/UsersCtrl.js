// Users List Controller
angular.module('app').controller('UsersCtrl', ['$scope', '$window', '$state', '$stateParams', 'AuthorizationService', 'APIService',
    function ($scope, $window, $state, $stateParams, AuthorizationService, APIService) {
        $scope.current_page = 1;
        $scope.page_size = 10;
        $scope.page_sizes = [5, 10, 15, 20, 50];
        $scope.page_total = 1;

        $scope.orderby = '[first_name, last_name]';
        $scope.reverse = false;
        $scope.user_status_labels = angular.copy(SHARED_CONST.user_status_labels);
            
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
            $scope.users = [];
            $scope.helpers.uiBlocks('.block', 'state_loading');

            if ($scope.page_total <= ($scope.current_page - 1) * $scope.page_size) $scope.current_page = 1;

            var request = $stateParams.request || '';
            var url = request === ''? '/person?' : '/person?q=' + request + "&";

            APIService.get(url + 'count=' + $scope.page_size + '&page=' + $scope.current_page).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.users = response.result;

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

            if (AuthorizationService.check('person_approval', 'view') && !$scope.invitations) {
                $scope.loadRequests();
            }

            if (AuthorizationService.check('person_invite', 'view') && !$scope.invitations) {
                $scope.loadInvites();
            }
        };

        $scope.userId = $stateParams.userId;

        $scope.loadDetail = function () {
            $scope.users = [];

            APIService.get('/admin/role').then(function (response) {
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.roles = response.result;
            });

            $scope.helpers.uiBlocks('.block', 'state_loading');
            APIService.get('/person?id=' + $scope.userId).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.user = response.result;
                if ($scope.user.role_id) $scope.user_role_id = $scope.user.role_id
            });
        };

        $scope.assignRole = function () {
            $scope.roleSaveFailed = false;
            $scope.roleSaveSuccess = false;

            $scope.helpers.uiBlocks('.block', 'state_loading');
            APIService.put('/person/role' + '?person_id=' + $scope.userId + '&role_id=' + $scope.user.role_id, {}).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    $scope.roleSaveFailed = true;
                    $scope.role_error_m = response.m;
                    return;
                }
                $scope.roleSaveSuccess = true;
            });
        };

        $scope.deleteUser = function () {
            if (!$window.confirm('Are you sure to want to delete this user ? \r\n Ok to proceed')) {
                return false;
            }
            console.log('/person?id=' + $scope.user.id);
            APIService.delete('/person?id=' + $scope.user.id).then(function (response) {
                if (response === undefined) return;
                if (response.s === 'f') {
                    alert(response.m);
                    return;
                } else {
                    alert('User has been deleted');
                    $state.go('users');
                }
            });
        };

        $scope.loadRequests = function () {
            $scope.requests = [];
            $scope.helpers.uiBlocks('.block', 'state_loading');
            APIService.get('/person/approval').then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');

                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.requests = response.result;
            });
        };

        var setApproval = function (user, status) {
            $scope.helpers.uiBlocks('.block', 'state_loading');
            APIService.patch('/person/approval?status=' + status + '&person_id=' + user.id).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.loadRequests();
            });
        };

        $scope.approve = function (user) {
            setApproval(user, 'approve');
        };

        $scope.decline = function (user) {
            setApproval(user, 'decline');
        };

        $scope.invite_status_labels = angular.copy(SHARED_CONST.invite_status_labels);

        $scope.loadInvites = function () {
            $scope.users = [];
            $scope.helpers.uiBlocks('.block', 'state_loading');
            APIService.get('/person/invite').then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }

                $scope.invitations = response.result.list;
                if ($scope.invitations.history) {
                    $scope.invitations.history.forEach(function (item, index, array) {
                        item.invited_user = $.grep(response.result.invited_by, function (e) {
                            return e.id == item.invited_by;
                        })[0];
                    });
                }
            });
        };

        $scope.resendInvite = function (invite_id) {
            $scope.helpers.uiBlocks('.block', 'state_loading');

            APIService.post('/person/invite?person_id=' + $scope.userId, {}).then(function (response) {
                $scope.helpers.uiBlocks('.block', 'state_normal');
                if (response === undefined) return;

                if (response.s === 'f') {
                    $scope.inviteFailed = true;
                    $scope.error_invite_m = response.m;
                    return;
                } else {
                    jQuery('#modal-invitation-success').modal('show');
                    $scope.inviteSuccess = true;
                    return;
                }
            });
        }
    }
]);
