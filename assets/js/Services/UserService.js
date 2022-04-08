
App.service('UserService', function ($window) {

    var currentUser;

    this.setCurrentUser = function(user) {
        currentUser = user;
    };

    this.getCurrentUser = function() {

        if(currentUser==null) {
            if($window.localStorage.person_userName!=null) {
                currentUser = $window.localStorage.person_userName;
            } else {
                console.log("Can't read current user");
            }
        }

        return currentUser;
    }
});
