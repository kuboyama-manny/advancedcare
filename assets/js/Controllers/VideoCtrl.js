angular.module('app').controller('VideoCtrl', ['$scope', '$stateParams', '$state', '$window', 'APIService', 'AlfrescoService',
  function ($scope, $stateParams, $state, $window, APIService, AlfrescoService) {
    console.log('VideoCtrl loaded');

    $scope.loadData = function()
    {
      $scope.session_id = $stateParams.session_id;
      $scope.name = $stateParams.name;
      $scope.second_video = $stateParams.second_video;

      $scope.is_patient = $window.localStorage.role == 'patient';

      $scope.video_url = window.VIDEO_URL + "/embed.html#";
      $scope.video_url += $scope.session_id + "&screen=0&name=" + $scope.name;

      $scope.video2Link = window.HOME_URL + "/#/video?session_id=" + $scope.session_id;
      $scope.video2Link += "&name=" + $scope.name + "&second_video=true";

      var video_frame = document.getElementById('video_frame');
      if (null != video_frame) {
        video_frame.src = $scope.video_url;
      }
    }

    $scope.goBack = function () {
      if ($scope.is_patient) {
        $state.go('patient-scheduler');
      } else {
        $state.go('doctor-scheduler');
      }
    };

    $('#second_camera_link').click(function(event) {
      console.log('event.shiftKey', event.shiftKey);
      if (!event.shiftKey) {
        alert('Please press shift key and click the camera icon again.');
        return false;
      }
    })
  }
]);
