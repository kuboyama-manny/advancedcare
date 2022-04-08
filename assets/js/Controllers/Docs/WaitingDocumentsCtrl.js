
// Waiting Documents Controller
angular.module('app').controller('WaitingDocumentsCtrl', ['$scope', '$state', '$location', '$window', '$interval', 'AlfrescoService', 'AuthorizationService', 'APIService', 'TimeFormatService',
        function ($scope, $state, $location, $window, $interval, AlfrescoService, AuthorizationService, APIService, TimeFormatService) {

            $scope.waitingFiles = [];

            $scope.file_attachments = [];

            AlfrescoService.setAuthFailureHandler(function(){
                $state.go('logout');
            });

            $scope.init = function () {
                $scope.getWaitingFiles();
            };

            $scope.getWaitingFiles = function () {

                $scope.helpers.uiBlocks('#waitingFiles', 'state_loading');
                AlfrescoService.getAssignedFiles().then(function(response) {
                    for (var i = 0; i < response.data.items.length; i++) {
                        response.data.items[i].mimetypeFileType = AlfrescoService.getMimetypeFileType(response.data.items[i]);
                        response.data.items[i].displayTime = TimeFormatService.format(response.data.items[i].modifiedOn);
                        response.data.items[i].displayCreatedOn = TimeFormatService.format(response.data.items[i].createdOn);
                    }
                    $scope.waitingFiles = response.data;
                    $scope.helpers.uiBlocks('#waitingFiles', 'state_normal');
                });
            };

            $scope.openFile = function (file) {
                $state.go('file', {node_ref : file.nodeRef, from : 'workflow'});
            };

            if (!$scope.initalized) {
              $scope.initalized = true;

              if (AuthorizationService.getAlfrescoTicket()){
                $scope.init();
              } else {
                $scope.$on("alf_login_succ", function (event) {
                  $scope.init();
                });
              }
            }
        }
    ]).directive("waitingfiles", function () {
    return {
        restrict: 'E',
        templateUrl: "assets/directive/tasks/waiting-files-list.html"
    }
});
