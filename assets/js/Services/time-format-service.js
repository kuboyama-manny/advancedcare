/*
 *  Document   : time-format-service.js
 *  Author     : Nikolaj Olejnik
 *  Description: Time Format Service
 *
 */

App.service('TimeFormatService', function () {

    this.locale = 'en-US';

    this.format = function (dateString) {

        var date = new Date(dateString);

        if (this.dateIsInvalid(date)) {
            return dateString;
        }

        //for current day
        if (this.isToday(date)) {
            return this.formatDifference(date);
        }

        //for previous days of current year
        if (this.isThisYearCurrent(date)) {
            return this.formatMonthly(date);
        }

        //for previous years
        return this.formatAnnual(date);
    };

    this.formatUtc = function (dateString) {
        return this.format(dateString + " UTC");
    }

    this.timeUtc = function(dateString) {
        var date = new Date(dateString + " UTC");
        return date.getTime();
    }

    this.dateIsInvalid = function (date) {
        if (Object.prototype.toString.call(date) === "[object Date]") {
            return isNaN(date.getTime());
        }
        return true;
    };

    this.isToday = function (date) {
        var currentDay = this.getCurrentDay();
        return date > currentDay;
    };

    this.getCurrentDay = function () {
        var currentDay = new Date();
        currentDay.setHours(0, 0, 0, 0);
        return currentDay;
    };

    this.isThisYearCurrent = function (date) {
        var firstDayOfYear = this.getFirstDayOfYear();
        return date > firstDayOfYear;
    };

    this.getFirstDayOfYear = function () {
        return new Date(new Date().getFullYear(), 0, 1);
    };

    this.formatDaily = function (date) {
        var options = {
            hour: 'numeric',
            minute: 'numeric'
        };
        return date.toLocaleString(this.locale, options);
    };

    this.formatDifference = function (date) {
        var now   = new Date();
        var seconds = (now.getTime() - date.getTime()) / 1000;

        if (seconds / 3600 > 2) {
            return Math.round(seconds / 3600) + " hours ago";
        } else if (seconds / 3600 > 1) {
            return "1 hour ago";
        } else if (seconds / 60 > 2) {
            return Math.round(seconds / 60) + " minutes ago";
        } else if (seconds / 60 > 1) {
            return "1 minute ago";
        } else {
            return "Just now";
        }
    }

    this.formatMonthly = function (date) {
        var options = {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        };
        return date.toLocaleString(this.locale, options);
    };

    this.formatAnnual = function (date) {
        var options = {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        };
        return date.toLocaleString(this.locale, options);
    };
});
