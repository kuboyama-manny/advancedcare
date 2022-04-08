App.service('APIService', function ($http, $window, $location, $state, AuthorizationService) {
    this.API_URL = window.API_URL;

    this.handleError = function (response) {
        if (response.status == 401) {
            var needAuth = true;
            var path = $location.$$path.substring(1);
            //console.log('path', path == 'patient-appointment-scheduler');
            if (path == 'forgot'
                || path == 'reset-password'
                || path == 'register'
                || path == 'register/auth'
                || path == 'accept-invite'
                || path == 'accept-invite/auth'
            ) {
                needAuth = false;
            }

            if (needAuth) {
                alert('Error found authenticating. Please try to re-login.');
                delete $window.localStorage.token;
                $location.path('/login');
            }
        } else if (response.status == 403) {
            var is_patient = $window.localStorage.role === 'patient';
            if (is_patient) {
                $state.go('patient-scheduler');
            }
            // check if docs auth allowed.
            var allowed = AuthorizationService.checkPath('/docs');
            var is_doctor = $window.localStorage.role === 'doctor';
            if (allowed && !is_doctor) {
                // if facility user has not permission to view dashboard, just forward to documents.
                $state.go('docs');
            } else if (!is_doctor && !is_patient) {
                alert('You don\'t have access to this page.');
            }
        } else {
            //  response.status : 400 || 409 || 500;
            //  if (response.status == 400 || response.status == 409) {
            // alert('Save failed. Error code : ' + ((response.data && response.data.m ) || 'N/A'));
            return response.data;
            //  }
        }
    };

    this.get = function (endpoint) {
        $http.defaults.headers.common.Authorization = $window.localStorage.token;
        var promise = $http.get(this.API_URL + endpoint).then(
            function (response) {
                // success handler
                if (response.data.s === 's') {
                    return response.data;
                } else {
                    alert('API Call success, but data is not returned. Error: ' + response.data.m);
                    return response.data;
                }
            },
            this.handleError
        );
        // Return the promise to the controller
        return promise;
    };

    this.login = function (endpoint, payload) {
        var promise = $http.post(this.API_URL + endpoint, payload).then(
            function (response) {
                // success handler
                if (response.data.s === 's') {
                    return response.data;
                } else {
                    alert('API Call success, but data says fails');
                    return response.data;
                }
            },
            function (response) {
                return response.data;
            }
        );
        // Return the promise to the controller
        return promise;
    };

    this.post = function (endpoint, payload) {
        $http.defaults.headers.common.Authorization = $window.localStorage.token;

        var promise = $http.post(this.API_URL + endpoint, payload).then(
            function (response) {
                // success handler
                if (response.data.s === 's') {
                    return response.data;
                } else {
                    alert('API Call success, but data says fails');
                    return response.data;
                }
            },
            this.handleError
        );
        // Return the promise to the controller
        return promise;
    };

    this.put = function (endpoint, payload) {
        $http.defaults.headers.common.Authorization = $window.localStorage.token;
        var promise = $http.put(this.API_URL + endpoint, payload).then(
            function (response) {
                // success handler
                if (response.data.s === 's') {
                    return response.data;
                } else {
                    alert('API Call success, but data says fails');
                    return response.data;
                }
            },
            this.handleError
        );
        // Return the promise to the controller
        return promise;
    };

    this.delete = function (endpoint) {
        $http.defaults.headers.common.Authorization = $window.localStorage.token;
        var promise = $http.delete(this.API_URL + endpoint).then(
            function (response) {
                // success handler
                if (response.data.s === 's') {
                    return response.data;
                } else {
                    alert('API Call success, but data is not returned. Error: ' + response.data.m);
                    return response.data;
                }
            },
            this.handleError
        );
        // Return the promise to the controller
        return promise;
    };

    this.patch = function (endpoint, payload) {
        $http.defaults.headers.common.Authorization = $window.localStorage.token;
        var promise = $http.patch(this.API_URL + endpoint, payload).then(
            function (response) {
                // success handler
                if (response.data.s === 's') {
                    return response.data;
                } else {
                    alert('API Call success, but data says fails');
                    return response.data;
                }
            },
            this.handleError
        );
        // Return the promise to the controller
        return promise;
    };

    this.patch_b64 = function (endpoint, payload) {
        $http.defaults.headers.common.Authorization = $window.localStorage.token;
        payload = payload.substring(payload.indexOf(',') + 1);
        var promise = $http.patch(this.API_URL + endpoint, payload, {headers: {'Content-Type': 'application/base64'}}).then(
            function (response) {
                // success handler
                if (response.data.s === 's') {
                    return response.data;
                }
            },
            this.handleError
        );
        // Return the promise to the controller
        return promise;
    };
});
