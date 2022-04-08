/*
 *  Document   : app.js
 *  Author     : pixelcave
 *  Description: Setting up and vital functionality for our App
 *
 */

// Create our angular module
var App = angular.module('app', [
  'ngStorage',
  'ui.router',
  'ui.bootstrap',
  // 'ui.bootstrap.datetimepicker',
  'oc.lazyLoad',
  'ngFileUpload'
  //'kendo.directives'
]);

// Router configuration
App.config(['$ocLazyLoadProvider', '$stateProvider', '$urlRouterProvider',
  function ($ocLazyLoadProvider, $stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');

    $ocLazyLoadProvider.config({
      modules: [
        {name: 'DeliveryOrderCtrl', files: ['assets/js/Controllers/Deliveries/DeliveryOrderCtrl.js']},
        {name: 'DeliveryOrderDetailCtrl', files: ['assets/js/Controllers/Deliveries/DeliveryOrderDetailCtrl.js']},
        {name: 'DeliveryOrdersListCtrl', files: ['assets/js/Controllers/Deliveries/DeliveryOrdersListCtrl.js']},
        {name: 'DeliveryOrdersMapCtrl', files: ['assets/js/Controllers/Deliveries/DeliveryOrdersMapCtrl.js']},
        //{name: 'DocumentsCtrl', files: ['assets/js/Controllers/Docs/DocumentsCtrl.js']},
        //{name: 'WaitingDocumentsCtrl', files: ['assets/js/Controllers/Docs/WaitingDocumentsCtrl.js']},
        //{name: 'FilesCtrl', files: ['assets/js/Controllers/Docs/FilesCtrl.js']},
        //{name: 'SearchDocsCtrl', files: ['assets/js/Controllers/Docs/SearchDocsCtrl.js']},
        {name: 'DoctorCtrl', files: ['assets/js/Controllers/Doctors/DoctorCtrl.js']},
        {name: 'DoctorScheduler', files: ['assets/js/Controllers/Doctors/DoctorScheduler.js']},
        {name: 'DoctorsListCtrl', files: ['assets/js/Controllers/Doctors/DoctorsListCtrl.js']},
        {name: 'DriverCtrl', files: ['assets/js/Controllers/Drivers/DriverCtrl.js']},
        {name: 'DriversListCtrl', files: ['assets/js/Controllers/Drivers/DriversListCtrl.js']},
        {name: 'DrugCtrl', files: ['assets/js/Controllers/Drugs/DrugCtrl.js']},
        {name: 'DrugsListCtrl', files: ['assets/js/Controllers/Drugs/DrugsListCtrl.js']},
        {name: 'EMARPatientCtrl', files: ['assets/js/Controllers/Emar/EMARPatientCtrl.js']},
        {name: 'EMARPatientsListCtrl', files: ['assets/js/Controllers/Emar/EMARPatientsListCtrl.js']},
        {name: 'FacilitiesListCtrl', files: ['assets/js/Controllers/Facilities/FacilitiesListCtrl.js']},
        {name: 'FacilityCtrl', files: ['assets/js/Controllers/Facilities/FacilityCtrl.js']},
        {name: 'OrderCtrl', files: ['assets/js/Controllers/Orders/OrderCtrl.js']},
        {name: 'OrdersListCtrl', files: ['assets/js/Controllers/Orders/OrdersListCtrl.js']},
        {name: 'PatientCtrl', files: ['assets/js/Controllers/Patients/PatientCtrl.js']},
        {name: 'PatientScheduler', files: ['assets/js/Controllers/Patients/PatientScheduler.js']},
        {name: 'PatientsListCtrl', files: ['assets/js/Controllers/Patients/PatientsListCtrl.js']},
        {name: 'PharmaciesListCtrl', files: ['assets/js/Controllers/Pharmacies/PharmaciesListCtrl.js']},
        {name: 'PharmacyCtrl', files: ['assets/js/Controllers/Pharmacies/PharmacyCtrl.js']},
        {name: 'AuthCtrl', files: ['assets/js/Controllers/AuthCtrl.js']},
        {name: 'InviteCtrl', files: ['assets/js/Controllers/InviteCtrl.js']},
        {name: 'RolesCtrl', files: ['assets/js/Controllers/RolesCtrl.js']},
        {name: 'SettingsCtrl', files: ['assets/js/Controllers/SettingsCtrl.js']},
        {name: 'UsersCtrl', files: ['assets/js/Controllers/UsersCtrl.js']},
        {name: 'VideoCtrl', files: ['assets/js/Controllers/VideoCtrl.js']},
      ]
    });

    $stateProvider
      .state('root', {
        url: '/',
        templateUrl: 'assets/views/home.html',
        controller: 'HomeCtrl',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            //$ocLazyLoad.load('DocumentsCtrl');

            return $ocLazyLoad.load({
              insertBefore: '#css-bootstrap',
              serie: true,
              files: [
                'assets/js/plugins/slick/slick.min.css',
                'assets/js/plugins/slick/slick-theme.min.css',
                'assets/js/plugins/slick/slick.min.js',
                'assets/js/plugins/chartjs/Chart.min.js'
              ]
            });
          }]
        }
      })
      .state('login', {
        url: '/login',
        templateUrl: 'assets/views/auth/login.html',
        controller: 'AuthCtrl',
        resolve: {}
      })
      .state('logout', {
        url: '/logout',
        templateUrl: 'assets/views/auth/logout.html',
        controller: 'AuthCtrl',
        resolve: {}
      })
      .state('settings', {
        url: '/settings',
        templateUrl: 'assets/views/auth/settings.html',
        controller: 'SettingsCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('SettingsCtrl');
          }],
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              insertBefore: '#css-bootstrap',
              serie: true,
              files: [
                'assets/js/plugins/bootstrap-datepicker/bootstrap-datepicker3.min.css',
                'assets/js/plugins/bootstrap-datepicker/bootstrap-datepicker.min.js'
              ]
            });
          }]
        }
      })
      .state('register', {
        url: '/register',
        templateUrl: 'assets/views/auth/register.html',
        controller: 'AuthCtrl',
        resolve: {}
      })
      .state('register-auth', {
        url: '/register/auth',
        templateUrl: 'assets/views/auth/auth.html',
        controller: 'AuthCtrl',
        resolve: {}
      })
      .state('forgot', {
        url: '/forgot',
        templateUrl: 'assets/views/auth/forgot.html',
        controller: 'AuthCtrl',
        resolve: {}
      })
      .state('reset-password', {
        url: '/reset-password',
        templateUrl: 'assets/views/auth/reset.html',
        controller: 'AuthCtrl',
        resolve: {}
      })
      .state('patients', {
        url: '/patients?request',
        templateUrl: 'assets/views/patients/patients-list.html',
        controller: 'PatientsListCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('PatientsListCtrl');
          }]
        }
      })
      .state('patient-view', {
        url: '/patients/view/:patientId',
        templateUrl: 'assets/views/patients/patient-view.html',
        controller: 'PatientCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('PatientCtrl');
          }],

          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              insertBefore: '#css-bootstrap',
              serie: true,
              files: [
                'assets/js/plugins/signature_pad/signature_pad.js'
              ]
            });
          }]
        }
      })
      .state('patient-edit', {
        url: '/patients/edit/:patientId',
        templateUrl: 'assets/views/patients/patient-edit.html',
        controller: 'PatientCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('PatientCtrl');
          }],

          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              insertBefore: '#css-bootstrap',
              serie: true,
              files: [
                'assets/js/plugins/bootstrap-datepicker/bootstrap-datepicker3.min.css',
                'assets/js/plugins/bootstrap-datepicker/bootstrap-datepicker.min.js'
              ]
            });
          }]
        }
      })
      .state('patient-new', {
        url: '/patients/new',
        templateUrl: 'assets/views/patients/patient-new.html',
        controller: 'PatientCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('PatientCtrl');
          }],

          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              insertBefore: '#css-bootstrap',
              serie: true,
              files: [
                'assets/js/plugins/bootstrap-datepicker/bootstrap-datepicker3.min.css',
                'assets/js/plugins/bootstrap-datepicker/bootstrap-datepicker.min.js'
              ]
            });
          }]
        }
      })
      .state('doctors', {
        url: '/doctors?request',
        templateUrl: 'assets/views/doctors/doctors-list.html',
        controller: 'DoctorsListCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('DoctorsListCtrl');
          }]
        }
      })
      .state('doctor-view', {
        url: '/doctors/view/:doctorId',
        templateUrl: 'assets/views/doctors/doctor-view.html',
        controller: 'DoctorCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('DoctorCtrl');
          }]

        }
      })
      .state('doctor-edit', {
        url: '/doctors/edit/:doctorId',
        templateUrl: 'assets/views/doctors/doctor-edit.html',
        controller: 'DoctorCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('DoctorCtrl');
          }]

        }
      })
      .state('doctor-new', {
        url: '/doctors/new',
        templateUrl: 'assets/views/doctors/doctor-new.html',
        controller: 'DoctorCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('DoctorCtrl');
          }]
        }
      })
      .state('drivers', {
        url: '/drivers?request',
        templateUrl: 'assets/views/drivers/drivers-list.html',
        controller: 'DriversListCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('DriversListCtrl');
          }]

        }
      })
      .state('driver-view', {
        url: '/drivers/view/:driverId',
        templateUrl: 'assets/views/drivers/driver-view.html',
        controller: 'DriverCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('DriverCtrl');
          }]

        }
      })
      .state('driver-edit', {
        url: '/drivers/edit/:driverId',
        templateUrl: 'assets/views/drivers/driver-edit.html',
        controller: 'DriverCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('DriverCtrl');
          }]

        }
      })
      .state('delivery-orders-list', {
        url: '/delivery-orders?request',
        templateUrl: 'assets/views/deliveries/orders-list.html',
        controller: 'DeliveryOrdersListCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('DeliveryOrdersListCtrl');
          }]
        }
      })
      .state('delivery-order-new', {
        url: '/delivery-orders/new/:rxOrderId',
        templateUrl: 'assets/views/deliveries/order-new.html',
        controller: 'DeliveryOrderCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('DeliveryOrderCtrl');
          }],

          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              insertBefore: '#css-bootstrap',
              serie: true,
              files: [
                'assets/js/plugins/moment/moment.js',
                'assets/js/plugins/angular-bootstrap-datetimepicker/src/css/datetimepicker.css',
                'assets/js/plugins/angular-bootstrap-datetimepicker/src/js/datetimepicker.js',
                'assets/js/plugins/angular-bootstrap-datetimepicker/src/js/datetimepicker.templates.js',
                'assets/js/plugins/angular-date-time-input/src/dateTimeInput.js'
              ]
            });
          }]
        }
      })
      .state('delivery-orders-map', {
        url: '/delivery-orders-map',
        templateUrl: 'assets/views/deliveries/orders-map.html',
        controller: 'DeliveryOrdersMapCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('DeliveryOrdersMapCtrl');
          }],

          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              insertBefore: '#css-bootstrap',
              serie: true,
              files: [
                {
                  type: 'js',
                  path: '//maps.google.com/maps/api/js'
                },
                'assets/js/plugins/gmapsjs/gmaps.min.js'
              ]
            });
          }]
        }
      })
      .state('delivery-order-detail', {
        url: '/delivery-orders/view/:orderId',
        templateUrl: 'assets/views/deliveries/order-detail.html',
        controller: 'DeliveryOrderDetailCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('DeliveryOrderDetailCtrl');
          }]
        }
      })
      .state('delivery-order-edit', {
        url: '/delivery-orders/edit/:orderId',
        templateUrl: 'assets/views/deliveries/order-edit.html',
        controller: 'DeliveryOrderCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('DeliveryOrderCtrl');
          }],

          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              insertBefore: '#css-bootstrap',
              serie: true,
              files: [
                'assets/js/plugins/moment/moment.js',
                'assets/js/plugins/angular-bootstrap-datetimepicker/src/css/datetimepicker.css',
                'assets/js/plugins/angular-bootstrap-datetimepicker/src/js/datetimepicker.js',
                'assets/js/plugins/angular-bootstrap-datetimepicker/src/js/datetimepicker.templates.js',
                'assets/js/plugins/angular-date-time-input/src/dateTimeInput.js'
              ]
            });
          }]
        }
      })
      .state('orders', {
        url: '/orders?request',
        templateUrl: 'assets/views/orders/orders-list.html',
        controller: 'OrdersListCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('OrdersListCtrl');
          }]
        }
      })
      .state('order-new', {
        url: '/orders/new',
        templateUrl: 'assets/views/orders/order-new.html',
        controller: 'OrderCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('OrderCtrl');
          }],

          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              insertBefore: '#css-bootstrap',
              serie: true,
              files: [
                'assets/js/plugins/moment/moment.js',
                'assets/js/plugins/angular-bootstrap-datetimepicker/src/css/datetimepicker.css',
                'assets/js/plugins/angular-bootstrap-datetimepicker/src/js/datetimepicker.js',
                'assets/js/plugins/angular-bootstrap-datetimepicker/src/js/datetimepicker.templates.js',
                'assets/js/plugins/angular-date-time-input/src/dateTimeInput.js'
              ]
            });
          }]
        }
      })
      .state('order-detail', {
        url: '/orders/view/:orderId',
        templateUrl: 'assets/views/orders/order-detail.html',
        controller: 'OrderCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('OrderCtrl');
          }],

          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              insertBefore: '#css-bootstrap',
              serie: true,
              files: [
                'assets/js/plugins/signature_pad/signature_pad.js'
              ]
            });
          }]
        }
      })
      .state('facilities', {
        url: '/facilities?request',
        templateUrl: 'assets/views/facilities/facilities-list.html',
        controller: 'FacilitiesListCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('FacilitiesListCtrl');
          }]
        }
      })
      .state('facility-new', {
        url: '/facilities/new',
        templateUrl: 'assets/views/facilities/facility-new.html',
        controller: 'FacilityCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('FacilityCtrl');
          }]
        }
      })
      .state('facility-view', {
        url: '/facilities/view/:facilityId',
        templateUrl: 'assets/views/facilities/facility-view.html',
        controller: 'FacilityCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('FacilityCtrl');
          }]
        }
      })
      .state('facility-edit', {
        url: '/facilities/edit/:facilityId',
        templateUrl: 'assets/views/facilities/facility-edit.html',
        controller: 'FacilityCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('FacilityCtrl');
          }]
        }
      })
      .state('pharmacies', {
        url: '/pharmacies?request',
        templateUrl: 'assets/views/pharmacies/pharmacies-list.html',
        controller: 'PharmaciesListCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('PharmaciesListCtrl');
          }]
        }
      })
      .state('pharmacy-new', {
        url: '/pharmacies/new',
        templateUrl: 'assets/views/pharmacies/pharmacy-new.html',
        controller: 'PharmacyCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('PharmacyCtrl');
          }]
        }
      })
      .state('pharmacy-view', {
        url: '/pharmacies/view/:pharmacyId',
        templateUrl: 'assets/views/pharmacies/pharmacy-view.html',
        controller: 'PharmacyCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('PharmacyCtrl');
          }]
        }
      })
      .state('pharmacy-edit', {
        url: '/pharmacies/edit/:pharmacyId',
        templateUrl: 'assets/views/pharmacies/pharmacy-edit.html',
        controller: 'PharmacyCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('PharmacyCtrl');
          }]
        }
      })
      .state('pharmacy-invite', {
        url: '/pharmacies/view/:pharmacyId/invite',
        templateUrl: 'assets/views/pharmacies/pharmacy-invite.html',
        controller: 'PharmacyCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('PharmacyCtrl');
          }]
        }
      })
      .state('pharmacy-adduser', {
        url: '/pharmacies/view/:pharmacyId/adduser',
        templateUrl: 'assets/views/pharmacies/pharmacy-adduser.html',
        controller: 'PharmacyCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('PharmacyCtrl');
          }]
        }
      })
      .state('drugs', {
        url: '/drugs?request',
        templateUrl: 'assets/views/drugs/drugs-list.html',
        controller: 'DrugsListCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('DrugsListCtrl');
          }]
        }
      })
      .state('drug-edit', {
        url: '/drugs/edit',
        templateUrl: 'assets/views/drugs/drug-edit.html',
        controller: 'DrugCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('DrugCtrl');
          }]
        }
      })
      .state('roles', {
        url: '/roles?request',
        templateUrl: 'assets/views/team/roles-list.html',
        controller: 'RolesCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('RolesCtrl');
          }]
        }
      })
      .state('role-new', {
        url: '/roles/new',
        templateUrl: 'assets/views/team/role-new.html',
        controller: 'RolesCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('RolesCtrl');
          }]
        }
      })
      .state('role-edit', {
        url: '/roles/edit/:roleId',
        templateUrl: 'assets/views/team/role-edit.html',
        controller: 'RolesCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('RolesCtrl');
          }]
        }
      })
      .state('users', {
        url: '/users?request',
        templateUrl: 'assets/views/team/users-list.html',
        controller: 'UsersCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('UsersCtrl');
          }]
        }
      })
      .state('user-detail', {
        url: '/users/edit/:userId',
        templateUrl: 'assets/views/team/user-edit.html',
        controller: 'UsersCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('UsersCtrl');
          }]
        }
      })
      .state('user-invite', {
        url: '/users/invite',
        templateUrl: 'assets/views/invites/invite-new.html',
        controller: 'InviteCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('InviteCtrl');
          }]
        }
      })
      .state('accept-invite', {
        url: '/accept-invite',
        templateUrl: 'assets/views/invites/invite-accept.html',
        controller: 'InviteCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('InviteCtrl');
          }],
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              insertBefore: '#css-bootstrap',
              serie: true,
              files: [
                'assets/js/plugins/bootstrap-datepicker/bootstrap-datepicker3.min.css',
                'assets/js/plugins/bootstrap-datepicker/bootstrap-datepicker.min.js'
              ]
            });
          }]
        }
      })
      .state('accept-invite-auth', {
        url: '/accept-invite/auth',
        templateUrl: 'assets/views/invites/invite-auth.html',
        controller: 'InviteCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('InviteCtrl');
          }]
        }
      })
      .state('docs', {
        url: '/docs/folder/*folder',
        templateUrl: 'assets/views/docs/folders-list.html',
        controller: 'DocumentsCtrl',
        resolve: {
          /*
          loadMyCtrl: ['$ocLazyLoad', function($ocLazyLoad){
            return $ocLazyLoad.load('DocumentsCtrl');
          }],
           */
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              insertBefore: '#css-bootstrap',
              serie: true,
              files: [
                'assets/js/core/ng-file-upload.min.js'
              ]
            });
          }]
        }
      })
      .state('mydocs', {
        url: '/mydocs/folder/*folder',
        templateUrl: 'assets/views/docs/folders-list.html',
        controller: 'DocumentsCtrl',
        resolve: {
          /*
          loadMyCtrl: ['$ocLazyLoad', function($ocLazyLoad){
              return $ocLazyLoad.load('DocumentsCtrl');
          }],
          */
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              insertBefore: '#css-bootstrap',
              serie: true,
              files: [
                'assets/js/core/ng-file-upload.min.js'
              ]
            });
          }]
        }
      })
      .state('file', {
        url: '/file/*node_ref?file_name&from',
        templateUrl: 'assets/views/docs/file-view.html',
        controller: 'FilesCtrl',
        resolve: {
          /*
          loadMyCtrl: ['$ocLazyLoad', function($ocLazyLoad){
              return $ocLazyLoad.load('FilesCtrl');
          }],
          */
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              insertBefore: '#css-bootstrap',
              serie: true,
              files: [
                'assets/js/core/ng-file-upload.min.js'
              ]
            });
          }]
        }
      })
      .state('tasks', {
        url: '/tasks',
        templateUrl: 'assets/views/docs/tasks-list.html',
        controller: 'WaitingDocumentsCtrl',
        resolve: {
          // loadMyCtrl: ['$ocLazyLoad', function($ocLazyLoad){
          //     return $ocLazyLoad.load('WaitingDocumentsCtrl');
          // }],
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              insertBefore: '#css-bootstrap',
              serie: true,
              files: [
                'assets/js/core/ng-file-upload.min.js'
              ]
            });
          }]
        }
      })
      .state('searchdocs', {
        url: '/searchdocs?request',
        templateUrl: 'assets/views/search/search-page.html',
        controller: 'SearchDocsCtrl',
        resolve: {
          // loadMyCtrl: ['$ocLazyLoad', function($ocLazyLoad){
          //     return $ocLazyLoad.load('SearchCtrl');
          // }],
        }
      })
      .state('emar-patients', {
        url: '/emar-patients?request',
        templateUrl: 'assets/views/emar/patients-list.html',
        controller: 'EMARPatientsListCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('EMARPatientsListCtrl');
          }]
        }
      })
      .state('emar-patient-view', {
        url: '/emar-patients/view/:patientId',
        templateUrl: 'assets/views/emar/patient-view.html',
        controller: 'EMARPatientCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('EMARPatientCtrl');
          }],
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              insertBefore: '#css-bootstrap',
              serie: true,
              files: [
                'assets/js/plugins/signature_pad/signature_pad.js'
              ]
            });
          }]
        }
      })
      .state('emar-patient-edit', {
        url: '/emar-patients/edit/:patientId',
        templateUrl: 'assets/views/emar/patient-edit.html',
        controller: 'EMARPatientCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('EMARPatientCtrl');
          }],
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              insertBefore: '#css-bootstrap',
              serie: true,
              files: [
                'assets/js/plugins/bootstrap-datepicker/bootstrap-datepicker3.min.css',
                'assets/js/plugins/bootstrap-datepicker/bootstrap-datepicker.min.js'
              ]
            });
          }]
        }
      })
      .state('emar-patient-new', {
        url: '/emar-patients/new',
        templateUrl: 'assets/views/emar/patient-new.html',
        controller: 'EMARPatientCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('EMARPatientCtrl');
          }],
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              insertBefore: '#css-bootstrap',
              serie: true,
              files: [
                'assets/js/plugins/bootstrap-datepicker/bootstrap-datepicker3.min.css',
                'assets/js/plugins/bootstrap-datepicker/bootstrap-datepicker.min.js'
              ]
            });
          }]
        }
      })

      .state('alerts', {
        url: '/alerts?request',
        templateUrl: 'assets/views/emar/alerts.html',
        controller: 'EMARPatientsListCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('EMARPatientsListCtrl');
          }]
        }
      })
      .state('reminders', {
        url: '/reminders?request',
        templateUrl: 'assets/views/emar/reminders.html',
        controller: 'EMARPatientsListCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('EMARPatientsListCtrl');
          }]
        }
      })
      .state('reports', {
        url: '/reports?request',
        templateUrl: 'assets/views/emar/reports.html',
        controller: 'EMARPatientsListCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('EMARPatientsListCtrl');
          }]
        }
      })
      .state('doctor-scheduler', {
        url: '/doctors/scheduler',
        templateUrl: 'assets/views/doctors/doctor-scheduler.html',
        controller: 'DoctorScheduler',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('DoctorScheduler');
          }],
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              insertBefore: '#css-bootstrap',
              serie: true,
              files: [
                'assets/js/plugins/moment/moment.js',
                'assets/js/plugins/moment/moment-timezone-with-data-2012-2022.js',
                'assets/js/plugins/kendo/kendo.all.min.js',
                'assets/js/plugins/kendo/kendo.timezones.min.js',
                '//cdnjs.cloudflare.com/ajax/libs/mobile-detect/1.4.1/mobile-detect.min.js',
                'assets/js/Controllers/Doctors/KendoSchedule.js'
              ]
            });
          }]
        }
      })

      .state('patient-scheduler', {
        url: '/patients/scheduler',
        templateUrl: 'assets/views/patients/patient-scheduler.html',
        controller: 'PatientScheduler',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('PatientScheduler');
          }],
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              insertBefore: '#css-bootstrap',
              serie: true,
              files: [
                'assets/js/plugins/moment/moment.js',
                'assets/js/plugins/moment/moment-timezone-with-data-2012-2022.js',
                'assets/js/plugins/kendo/kendo.all.min.js',
                'assets/js/plugins/kendo/kendo.timezones.min.js',
                '//cdnjs.cloudflare.com/ajax/libs/mobile-detect/1.4.1/mobile-detect.min.js',
                'assets/js/Controllers/Patients/KendoSchedule.js',
              ]
            });
          }]
        }
      })

      .state('video', {
        url: '/video?name&session_id&second_video',
        templateUrl: 'assets/views/video/video.html',
        controller: 'VideoCtrl',
        resolve: {
          loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load('VideoCtrl');
          }]
        }
      })
  }
]);

// Tooltips and Popovers configuration
App.config(['$uibTooltipProvider',
  function ($uibTooltipProvider) {
    $uibTooltipProvider.options({
      appendToBody: true
    });
  }
]);


// Custom UI helper functions
App.factory('uiHelpers', function ($filter) {
  return {
    // Handles active color theme
    uiHandleColorTheme: function (themeName) {
      var colorTheme = jQuery('#css-theme');

      if (themeName) {
        if (colorTheme.length && (colorTheme.prop('href') !== 'assets/css/themes/' + themeName + '.min.css')) {
          jQuery('#css-theme').prop('href', 'assets/css/themes/' + themeName + '.min.css');
        } else if (!colorTheme.length) {
          jQuery('#css-main').after('<link rel="stylesheet" id="css-theme" href="assets/css/themes/' + themeName + '.min.css">');
        }
      } else {
        if (colorTheme.length) {
          colorTheme.remove();
        }
      }
    },
    // Handles #main-container height resize to push footer to the bottom of the page
    uiHandleMain: function () {
      var lMain = jQuery('#main-container');
      var hWindow = jQuery(window).height();
      var hHeader = jQuery('#header-navbar').outerHeight();
      var hFooter = jQuery('#page-footer').outerHeight();

      if (jQuery('#page-container').hasClass('header-navbar-fixed')) {
        lMain.css('min-height', hWindow - hFooter);
      } else {
        lMain.css('min-height', hWindow - (hHeader + hFooter));
      }
    },
    // Handles transparent header functionality (solid on scroll - used in frontend pages)
    uiHandleHeader: function () {
      var lPage = jQuery('#page-container');

      if (lPage.hasClass('header-navbar-fixed') && lPage.hasClass('header-navbar-transparent')) {
        jQuery(window).on('scroll', function () {
          if (jQuery(this).scrollTop() > 20) {
            lPage.addClass('header-navbar-scroll');
          } else {
            lPage.removeClass('header-navbar-scroll');
          }
        });
      }
    },
    // Handles sidebar and side overlay custom scrolling functionality
    uiHandleScroll: function (mode) {
      var windowW = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      var lPage = jQuery('#page-container');
      var lSidebar = jQuery('#sidebar');
      var lSidebarScroll = jQuery('#sidebar-scroll');
      var lSideOverlay = jQuery('#side-overlay');
      var lSideOverlayScroll = jQuery('#side-overlay-scroll');

      // Init scrolling
      if (mode === 'init') {
        // Init scrolling only if required the first time
        uiHandleScroll();
      } else {
        // If screen width is greater than 991 pixels and .side-scroll is added to #page-container
        if (windowW > 991 && lPage.hasClass('side-scroll') && (lSidebar.length || lSideOverlay.length)) {
          // If sidebar exists
          if (lSidebar.length) {
            // Turn sidebar's scroll lock off (slimScroll will take care of it)
            jQuery(lSidebar).scrollLock('off');

            // If sidebar scrolling does not exist init it..
            if (lSidebarScroll.length && (!lSidebarScroll.parent('.slimScrollDiv').length)) {
              lSidebarScroll.slimScroll({
                height: lSidebar.outerHeight(),
                color: '#fff',
                size: '5px',
                opacity: .35,
                wheelStep: 15,
                distance: '2px',
                railVisible: false,
                railOpacity: 1
              });
            }
            else { // ..else resize scrolling height
              lSidebarScroll
                .add(lSidebarScroll.parent())
                .css('height', lSidebar.outerHeight());
            }
          }

          // If side overlay exists
          if (lSideOverlay.length) {
            // Turn side overlay's scroll lock off (slimScroll will take care of it)
            jQuery(lSideOverlay).scrollLock('off');

            // If side overlay scrolling does not exist init it..
            if (lSideOverlayScroll.length && (!lSideOverlayScroll.parent('.slimScrollDiv').length)) {
              lSideOverlayScroll.slimScroll({
                height: lSideOverlay.outerHeight(),
                color: '#000',
                size: '5px',
                opacity: .35,
                wheelStep: 15,
                distance: '2px',
                railVisible: false,
                railOpacity: 1
              });
            }
            else { // ..else resize scrolling height
              lSideOverlayScroll
                .add(lSideOverlayScroll.parent())
                .css('height', lSideOverlay.outerHeight());
            }
          }
        } else {
          // If sidebar exists
          if (lSidebar.length) {
            // If sidebar scrolling exists destroy it..
            if (lSidebarScroll.length && lSidebarScroll.parent('.slimScrollDiv').length) {
              lSidebarScroll
                .slimScroll({destroy: true});
              lSidebarScroll
                .attr('style', '');
            }

            // Turn sidebars's scroll lock on
            jQuery(lSidebar).scrollLock();
          }

          // If side overlay exists
          if (lSideOverlay.length) {
            // If side overlay scrolling exists destroy it..
            if (lSideOverlayScroll.length && lSideOverlayScroll.parent('.slimScrollDiv').length) {
              lSideOverlayScroll
                .slimScroll({destroy: true});
              lSideOverlayScroll
                .attr('style', '');
            }

            // Turn side overlay's scroll lock on
            jQuery(lSideOverlay).scrollLock();
          }
        }
      }
    },
    // Handles page loader functionality
    uiLoader: function (mode) {
      var lBody = jQuery('body');
      var lpageLoader = jQuery('#page-loader');

      if (mode === 'show') {
        if (lpageLoader.length) {
          lpageLoader.fadeIn(250);
        } else {
          lBody.prepend('<div id="page-loader"></div>');
        }
      } else if (mode === 'hide') {
        if (lpageLoader.length) {
          lpageLoader.fadeOut(250);
        }
      }
    },
    // Handles blocks API functionality
    uiBlocks: function (block, mode, button) {
      // Set default icons for fullscreen and content toggle buttons
      var iconFullscreen = 'si si-size-fullscreen';
      var iconFullscreenActive = 'si si-size-actual';
      var iconContent = 'si si-arrow-up';
      var iconContentActive = 'si si-arrow-down';

      if (mode === 'init') {
        // Auto add the default toggle icons
        switch (button.data('action')) {
          case 'fullscreen_toggle':
            button.html('<i class="' + (button.closest('.block').hasClass('block-opt-fullscreen') ? iconFullscreenActive : iconFullscreen) + '"></i>');
            break;
          case 'content_toggle':
            button.html('<i class="' + (button.closest('.block').hasClass('block-opt-hidden') ? iconContentActive : iconContent) + '"></i>');
            break;
          default:
            return false;
        }
      } else {
        // Get block element
        var elBlock = (block instanceof jQuery) ? block : jQuery(block);

        // If element exists, procceed with blocks functionality
        if (elBlock.length) {
          // Get block option buttons if exist (need them to update their icons)
          var btnFullscreen = jQuery('[data-js-block-option][data-action="fullscreen_toggle"]', elBlock);
          var btnToggle = jQuery('[data-js-block-option][data-action="content_toggle"]', elBlock);

          // Mode selection
          switch (mode) {
            case 'fullscreen_toggle':
              elBlock.toggleClass('block-opt-fullscreen');

              // Enable/disable scroll lock to block
              elBlock.hasClass('block-opt-fullscreen') ? jQuery(elBlock).scrollLock() : jQuery(elBlock).scrollLock('off');

              // Update block option icon
              if (btnFullscreen.length) {
                if (elBlock.hasClass('block-opt-fullscreen')) {
                  jQuery('i', btnFullscreen)
                    .removeClass(iconFullscreen)
                    .addClass(iconFullscreenActive);
                } else {
                  jQuery('i', btnFullscreen)
                    .removeClass(iconFullscreenActive)
                    .addClass(iconFullscreen);
                }
              }
              break;
            case 'fullscreen_on':
              elBlock.addClass('block-opt-fullscreen');

              // Enable scroll lock to block
              jQuery(elBlock).scrollLock();

              // Update block option icon
              if (btnFullscreen.length) {
                jQuery('i', btnFullscreen)
                  .removeClass(iconFullscreen)
                  .addClass(iconFullscreenActive);
              }
              break;
            case 'fullscreen_off':
              elBlock.removeClass('block-opt-fullscreen');

              // Disable scroll lock to block
              jQuery(elBlock).scrollLock('off');

              // Update block option icon
              if (btnFullscreen.length) {
                jQuery('i', btnFullscreen)
                  .removeClass(iconFullscreenActive)
                  .addClass(iconFullscreen);
              }
              break;
            case 'content_toggle':
              elBlock.toggleClass('block-opt-hidden');

              // Update block option icon
              if (btnToggle.length) {
                if (elBlock.hasClass('block-opt-hidden')) {
                  jQuery('i', btnToggle)
                    .removeClass(iconContent)
                    .addClass(iconContentActive);
                } else {
                  jQuery('i', btnToggle)
                    .removeClass(iconContentActive)
                    .addClass(iconContent);
                }
              }
              break;
            case 'content_hide':
              elBlock.addClass('block-opt-hidden');

              // Update block option icon
              if (btnToggle.length) {
                jQuery('i', btnToggle)
                  .removeClass(iconContent)
                  .addClass(iconContentActive);
              }
              break;
            case 'content_show':
              elBlock.removeClass('block-opt-hidden');

              // Update block option icon
              if (btnToggle.length) {
                jQuery('i', btnToggle)
                  .removeClass(iconContentActive)
                  .addClass(iconContent);
              }
              break;
            case 'refresh_toggle':
              elBlock.toggleClass('block-opt-refresh');

              // Return block to normal state if the demostration mode is on in the refresh option button - data-action-mode="demo"
              if (jQuery('[data-js-block-option][data-action="refresh_toggle"][data-action-mode="demo"]', elBlock).length) {
                setTimeout(function () {
                  elBlock.removeClass('block-opt-refresh');
                }, 2000);
              }
              break;
            case 'state_loading':
              elBlock.addClass('block-opt-refresh');
              break;
            case 'state_normal':
              elBlock.removeClass('block-opt-refresh');
              break;
            case 'close':
              elBlock.hide();
              break;
            case 'open':
              elBlock.show();
              break;
            default:
              return false;
          }
        }
      }
    },
    showErrorModal: function (message, reload) {
      var message = $filter('etranslate')(message);

      var dialog = $("<div id='errorDialog'></div>");

      dialog.appendTo('body');
      dialog.kendoDialog({
        width: "400px",
        title: "Error!",
        closable: false,
        modal: true,
        content: "<p>" + message + "<p>",
        actions: [
          {text: 'OK', primary: true}
        ],
        close: function () {
          reload && location.reload();
        }
      });
      dialog.data("kendoDialog").open();
    }
  };
});

// Run our App
App.run(function ($rootScope, $state, $window, $location, AuthorizationService, uiHelpers) {
  // Access uiHelpers easily from all controllers
  $rootScope.helpers = uiHelpers;

  window.onbeforeunload = function () {
    // handle the exit event
    delete $window.localStorage.alf_folder_eventSource;
    delete $window.localStorage.alf_file_eventSource;
  };

  $rootScope.$on('$locationChangeStart', function (event, next, current) {

    var path = $location.$$path;
    var allowed = AuthorizationService.checkPath(path);
    if (!allowed) {
      event.preventDefault();
      console.log('You don\'t have permission to use this page.');
      $state.go('login');
      return false;
    }

    if ($window.localStorage.token) {
      $rootScope.isAuthenticated = true;
    } else {
      $rootScope.isAuthenticated = false;
    }

    var parser = document.createElement('a');
    parser.href = next;
    if ($rootScope.isAuthenticated === false) {
      if (!parser.hash.startsWith('#/login')
        && parser.hash != '#/logout'
        && parser.hash != '#/forgot'
        && !parser.hash.startsWith('#/reset-password')
        && !parser.hash.startsWith('#/register')
        && !parser.hash.startsWith('#/accept-invite')
        && !parser.hash.startsWith('#/patient-appointment-scheduler')
        && parser.hash != '#/settings') {
        event.preventDefault();
        // alert('Please log in to access the page.');

        $state.go('login');
        return false;
      }
    }
  });

  // On window resize or orientation change resize #main-container & Handle scrolling
  var resizeTimeout;

  jQuery(window).on('resize orientationchange', function () {
    clearTimeout(resizeTimeout);

    resizeTimeout = setTimeout(function () {
      $rootScope.helpers.uiHandleScroll();
      $rootScope.helpers.uiHandleMain();
    }, 150);
  });

  $.notifyDefaults({
    type: 'success',
    allow_dismiss: true,
    placement: {
      from: "top",
      align: "center"
    }
  });

});

if (!String.prototype.startsWith) {
  String.prototype.startsWith = function (searchString, position) {
    position = position || 0;
    return this.substr(position, searchString.length) === searchString;
  };
}
