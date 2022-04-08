
App.service('AuthorizationService', function ($window) {

    this.saveAccess = function (access) {
        $window.localStorage.access = JSON.stringify(access);
    };

    this.loadAccess = function () {
        var access = $window.localStorage.access ? JSON.parse($window.localStorage.access) : false;
        return access;
    };

    this.setSignupSession = function (session) {
        $window.localStorage.signupSession = session;
    };

    this.getSignupSession = function () {
        return $window.localStorage.signupSession;
    };

    this.clearSignupSession = function () {
        delete $window.localStorage.signupSession;
    };

    this.setInviteSession = function (session) {
        $window.localStorage.inviteSession = session;
    };

    this.getInviteSession = function () {
        return $window.localStorage.inviteSession;
    };

    this.clearInviteSession = function () {
        delete $window.localStorage.inviteSession;
    };

    this.setAlfrescoTicket = function (ticket) {
        $window.localStorage.alfTicket = ticket;
    };

    this.getAlfrescoTicket = function () {
        return $window.localStorage.alfTicket;
    };

    this.clearAlfrescoTicket = function () {
        delete $window.localStorage.alfTicket;
    };

    this.setAlfrescoTicketValidateStatus = function (status) {
        $window.localStorage.alfTicketValidateStatus = status;
    }

    this.getAlfrescoTicketValidateStatus = function () {
        return $window.localStorage.alfTicketValidateStatus;
    }

    this.setAlfrescoTicketUpdateTime = function (dt) {
        $window.localStorage.alfTicketUpdateAt = dt;
    }

    this.getAlfrescoTicketUpdateTime = function () {
        return $window.localStorage.alfTicketUpdateAt;
    }

    this.checkPath = function (path) {
        path = path.substring(1);
        var is_patient = $window.localStorage.role === 'patient';

        //console.log('path', path == 'patient-appointment-scheduler');
        if (path == ''
            || path == 'login'
            || path == 'logout'
            || path == 'forgot'
            || path == 'reset-password'
            || path == 'settings'
            || path == 'register'
            || path == 'register/auth'
            || path == 'accept-invite'
            || path == 'accept-invite/auth'
            || (path.startsWith('docs') && !is_patient)
            || (path.startsWith('mydocs') && !is_patient)
            || (path.startsWith('file') && !is_patient)
            || path == 'tasks'
            || path.startsWith('searchdocs')
            || path.startsWith('video')
        ) {
            return true;
        }
        if (path.startsWith('patients')) {
            if (path == 'patients' || path.startsWith('patients/view')) {
                return this.check('patient', 'view');
            } else if (path.startsWith('patients/edit')) {
                return this.check('patient', 'edit');
            } else if (path.startsWith('patients/new')) {
                return this.check('patient', 'create');
            } else if(path.startsWith('patients/scheduler'))
            {
                return this.check('calendar', 'view') || this.check('calendar', 'create');
            }
        } else if (path.startsWith('facilities')) {
            if (path == 'facilities' || path.startsWith('facilities/view')) {
                return this.check('facility', 'view');
            } else if (path.startsWith('facilities/edit')) {
                return this.check('facility', 'edit');
            } else if (path.startsWith('facilities/new')) {
                return this.check('facility', 'create');
            }
        // } else if (path.startsWith('smartpens')) {
        //     if (path == 'smartpens' || path.startsWith('smartpens/view')) {
        //         return this.check('facility_device', 'view');
        //     } else if (path.startsWith('smartpens/edit')) {
        //         return this.check('facility_device', 'edit');
        //     } else if (path.startsWith('smartpens/new')) {
        //         return this.check('facility_device', 'create');
        //     }
        // } else if (path.startsWith('tablets')) {
        //     if (path == 'tablets' || path.startsWith('tablets/view')) {
        //         return this.check('facility_device', 'view');
        //     } else if (path.startsWith('tablets/edit')) {
        //         return this.check('facility_device', 'edit');
        //     } else if (path.startsWith('tablets/new')) {
        //         return this.check('facility_device', 'create');
        //     }
        } else if (path.startsWith('doctors')) {
            if (path == 'doctors' || path.startsWith('doctors/view')) {
                return this.check('doctor', 'view');
            } else if (path.startsWith('doctors/edit')) {
                return this.check('doctor', 'edit');
            } else if(path == 'doctors/new') {
                return this.check('doctor', 'create');
            } else if(path == 'doctors/scheduler')
            {
                return this.check('calendar', 'view') || this.check('calendar', 'create');
            }
        } else if (path.startsWith('drivers')) {
            if (path == 'drivers' || path.startsWith('drivers/view')) {
                return this.check('delivery', 'view');
            } else if (path.startsWith('drivers/edit')) {
                return this.check('delivery', 'edit');
            }
        } else if (path.startsWith('pharmacies')) {
            if (path == 'pharmacies' || path.startsWith('pharmacies/view')) {
                return this.check('pharmacy', 'view');
            } else if (path.startsWith('pharmacies/edit')) {
                return this.check('pharmacy', 'edit');
            } else if (path.startsWith('pharmacies/new')) {
                return this.check('pharmacy', 'create');
            }
        } else if (path.startsWith('drugs')) {
            if (path == 'drugs' || path.startsWith('drugs/view')) {
                return this.check('drug', 'view');
            } else if (path.startsWith('drugs/edit')) {
                return this.check('drug', 'edit');
            } else if (path.startsWith('drugs/new')) {
                return this.check('drug', 'create');
            }
        } else if (path.startsWith('orders')) {
            if (path == 'orders' || path.startsWith('orders/view')) {
                return this.check('order', 'view');
            } else if (path.startsWith('orders/edit')) {
                return this.check('order', 'edit');
            } else if (path.startsWith('orders/new')) {
                return this.check('order', 'create');
            }
        } else if (path.startsWith('delivery-orders')) {
            if (path == 'delivery-orders' || path.startsWith('delivery-orders/view') || path.startsWith('delivery-orders-map')) {
                return this.check('delivery_order', 'view');
            } else if (path.startsWith('delivery-orders/edit')) {
                return this.check('delivery_order', 'edit');
            } else if (path.startsWith('delivery-orders/new')) {
                return this.check('delivery_order', 'create');
            }
        } else if (path.startsWith('roles')) {
            if (path == 'roles') {
                return this.check('role', 'view');
            } else if (path.startsWith('roles/edit')) {
                return this.check('role', 'edit');
            } else if (path.startsWith('roles/new')) {
                return this.check('role', 'create');
            }
        } else if (path.startsWith('users')) {
            if (path == 'users') {
                return this.check('person', 'view');
            } else if (path.startsWith('users/edit')) {
                return this.check('person', 'process');
            } else if (path.startsWith('users/invite')) {
                return this.check('person_invite', 'create');
            }
        } else if (path.startsWith('docs') || path.startsWith('mydocs') || path.startsWith('file')) {
            return this.check('document', 'view');
        }else if (path.startsWith('emar-patients')) {
            if (path == 'emar-patients' || path.startsWith('emar-patients/view')) {
                return this.check('patient', 'view');
            } else if (path.startsWith('emar-patients/edit')) {
                return this.check('patient', 'edit');
            } else if (path.startsWith('emar-patients/new')) {
                return this.check('patient', 'create');
            }
        }else if (path.startsWith('video')) {
            return true;
            // return this.check('patient', 'view') || this.check('doctor', 'view');
        }
        return false;
    };

    this.check = function (resource, action) {
        var allowed = false;
        var access = this.loadAccess();
        if (!access) return false;
        var access_list = access.list;

        for (var i = 0; i < access_list.length; i++) {
            if (access_list[i].resource.toLowerCase() === resource.toLowerCase()) {
                allowed = access_list[i].access.indexOf(action) > -1;
                break;
            }
        }

        return allowed;
    }

    this.checkRole = function (role) {
        return $window.localStorage.role == role;
    }
});
