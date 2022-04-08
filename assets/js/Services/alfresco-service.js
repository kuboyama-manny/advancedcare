App.service('AlfrescoService', function (
    $http, $window, $location, AuthorizationService, UserService, Upload, SharedVariablesService, APIService
) {

    this.HOST = window.ALFRESCO_URL;
    this.API_URL = this.HOST + '/alfresco/s/api';

    // save this for pdfnetjs read it. pdfnetjs is lazy loaded, somehow it cannot ready global variables.
    $window.localStorage.alfresco_url = window.ALFRESCO_URL;

    /**
     * {url: path}
     */
    this.URL_MAP = {
        "docs" : this.HOST + '/alfresco/s/rest/doclib2/doclist/node/site/fax/documentLibrary', // shared "fax" site
        "mydocs" : this.HOST + '/alfresco/s/rest/doclib2/doclist/content/node/alfresco/user/home' // private user home
    };
    this.FILE_PATH = this.HOST + '/alfresco/s';
    this.UPLOAD_PATH = this.FILE_PATH + '/miqare/upload';
    this.GET_ATTACHMENTS_URL = this.FILE_PATH + '/miqare/attachments/nodeRef/';
    this.GET_ASSIGNED_DOCUMENTS = this.FILE_PATH + "/miqare/user/" + $window.localStorage.person_userName + "/assigned-workflow";
    this.GET_PEOPLE = this.API_URL + "/people";
    this.ASSIGN_FILE = this.FILE_PATH + "/miqare/user/" + $window.localStorage.person_userName + "/assign-workflow";
    this.SEARCH_URL = this.FILE_PATH + '/miqare/search';
    this.STATISTICS_URL = this.FILE_PATH + '/miqare/statistics';
    this.GET_METADATA_URL = this.FILE_PATH + "/miqare/metadata/nodeRef/";
    this.GET_FILE_ATTACHMENTS_URL = this.FILE_PATH + '/api/forms/picker/node/';
    this.SAVE_FILE_ATTACHMENTS_URL = this.FILE_PATH + '/miqare/attach/userhome';
    this.METADATA_URL = this.API_URL + "/metadata/node";

    this.handleError = function (response) {
        if (response.status == 401) {
            delete $window.localStorage.alfTicket;
            delete $window.localStorage.alf_folder_eventSource;
            delete $window.localStorage.alf_file_eventSource;
        } else if (response.status == 403) {
            return response.data;
        } else {
            return response.data;
        }
    };

    this.register_sse = function (sse_type) {
        var ticket = AuthorizationService.getAlfrescoTicket();
        if (ticket !== null && ticket !== undefined) {
            var eventSource = new EventSource(this.FILE_PATH + "/miqare/events" + '?alf_ticket=' + ticket);
            if ('folder' === sse_type) {
                $window.localStorage.alf_folder_eventSource = eventSource;
            } else if ('file' === sse_type) {
                $window.localStorage.alf_file_eventSource = eventSource;
            }
            return eventSource;
        } else {
            return null;
        }
    }

    var authFailureHandler
    this.setAuthFailureHandler = function(func) {
        authFailureHandler = func;
    }

    this.login = function(username, password) {

        if (!window.ENABLE_LDAP) {
            var username = window.ALFRESCO_USER1;
            var password = window.ALFRESCO_PASS1;

            // we did not sync users from alfresco yet, need hack some alfresco users for Nick demo only.
            if ($window.localStorage.person_id == 621) {
                username = window.ALFRESCO_USER2;
                password = window.ALFRESCO_PASS2;
            } else {
                var demo_users = window.ALFRESCO_USER2.split(",");
                demo_users.forEach(function (user, index, array) {
                    if (user === $window.localStorage.person_userName) {
                        username = user;
                        password = window.ALFRESCO_PASS2;
                        return;
                    }
                });
            }

        }

        if (!username || !password) {
            return;
        }

        var payload = {
            username: username,
            password: password
        };

        var promise = $http.post(this.API_URL + '/login', payload).then(
            function(response) {
              AuthorizationService.setAlfrescoTicket(response.data.data.ticket);
              AuthorizationService.setAlfrescoTicketValidateStatus(response.data.status);
              AuthorizationService.setAlfrescoTicketUpdateTime(new Date());
              return response.data;
            },
            this.handleError
        );

        return promise;
    };

    this.validate_ticket = function() {
        var ticket = AuthorizationService.getAlfrescoTicket();
        var statusCode = AuthorizationService.getAlfrescoTicketValidateStatus();
        var updatedAt = new Date(AuthorizationService.getAlfrescoTicketUpdateTime());
        var tt1 = new Date();

        if (tt1 - updatedAt > 30000 || statusCode != 200 || !ticket) {
            AuthorizationService.setAlfrescoTicketUpdateTime(tt1);

            var url = this.HOST + '/alfresco/service/api/login/ticket/';
            var payload = {
                auth_for: 'alf',
                auth_url: url,
                auth_ticket: ticket || ''
            }
            return APIService.post('/external/auth/validate', payload).then(
                function (response) {
                    // console.log("validate alfresco ticket spend: " + (new Date() - tt1) / 1000 + "s.");
                    AuthorizationService.setAlfrescoTicketValidateStatus(response.statusCode);
                    if (!response || response.statusCode != 200) {
                        authFailureHandler();
                    }
                    return response.statusCode == 200;
                },
                this.handleError
            );
        }
    }

    this.need_validate_ticket = function () {
        if (!AuthorizationService.getAlfrescoTicket()) {
            console.log('invalid ticket!');
            return true;
        }
        var statusCode = AuthorizationService.getAlfrescoTicketValidateStatus();
        var updatedAt = new Date(AuthorizationService.getAlfrescoTicketUpdateTime());
        var tt1 = new Date();

        if (tt1 - updatedAt > 30000 || statusCode != 200) {
            return true;
        }
        return false;
    }

    var last_loaded_folder;
    this.get_last_loaded_folder = function () {
        return last_loaded_folder;
    }

    this.loadDirectory = function (folderPath, mainPath, pageSize, pageIndex, sortField, sortAsc) {

        if (!folderPath) {
            console.log('invalid folderPath!');
            return;
        }

        folderPath = folderPath.replace('//', '/');

        var getUrl = this.URL_MAP[mainPath];

        if (!getUrl){
            console.error("not found mapping in config object for urlPath [" + mainPath + "], check config");
            return;
        }

        last_loaded_folder = folderPath;

        pageSize = !pageSize ? 50 : pageSize;
        pageIndex = !pageIndex ? 1 : pageIndex;

        var url = getUrl + folderPath + '?size=' + pageSize + '&pos=' + pageIndex;
        if (!!sortField) {
            url += '&sortField=' + encodeURIComponent(sortField);
        }
        if (!!sortAsc) {
            url += '&sortAsc=' + sortAsc;
        }
        url += '&alf_ticket=' + AuthorizationService.getAlfrescoTicket();

        // var tt1 = new Date();
        var promise = $http.get(url).then(
            function (response) {
                // console.log("loadDirectory " + folderPath + " spend: " + (new Date() - tt1) / 1000 + "s.");
                return response;
            },
            this.handleError
        );

        if (this.need_validate_ticket()) {
            return this.validate_ticket().then(function (response) {
                return promise;
                });
        } else {
            return promise;
        }
    };

    this.getFileURL = function (contentURL) {
        var ticket = AuthorizationService.getAlfrescoTicket();
        return this.FILE_PATH + contentURL + '?alf_ticket=' + ticket;
    };

    this.getFileContentUrlFromNodeRef = function (nodeRef, name) {
        var nodeId = nodeRef.split("SpacesStore")[1];
        var url = this.API_URL + "/node/content/workspace/SpacesStore" + nodeId + "/" + name;
        url += '?alf_ticket=' + AuthorizationService.getAlfrescoTicket();
        return url;
    }

    this.getFileURLFromNodeRef = function (nodeRef, name) {
        var nodeId = nodeRef.substring(nodeRef.lastIndexOf('/') + 1, nodeRef.length);
        var url = this.FILE_PATH + "/slingshot/node/content/workspace/SpacesStore/" + nodeId + "/" + name;
        url += '?alf_ticket=' + AuthorizationService.getAlfrescoTicket();
        return url;
    };

    this.uploadFile = function (file, destination) {
        var payload = {
            'filedata': file,
            'destination': destination
        };
        var url = this.UPLOAD_PATH + '?alf_ticket=' + AuthorizationService.getAlfrescoTicket();

        console.log('uploadFile', payload, url);

        var promise = Upload.upload({
            url: url,
            data: payload
        });

        if (this.need_validate_ticket()) {
            return this.validate_ticket().then(function (response) {
                return promise;
                });
        } else {
            return promise;
        }
    };

    this.uploadAttachments = function (attachments, destination, attachmentAssociation) {
        var payload = {
            'filedata': attachments,
            'destination': destination,
            'attachment': attachmentAssociation
        };
        var promise = Upload.upload({
            url: this.UPLOAD_PATH + '?alf_ticket=' + AuthorizationService.getAlfrescoTicket(),
            data: payload
        });

        if (this.need_validate_ticket()) {
            return this.validate_ticket().then(function (response) {
                return promise;
                });
        } else {
            return promise;
        }
    };

    /**
     * @Deprecated use {@link uploadAttachments} instead
     */
    this.addAttachment = function (file, attachment) {
        var nodeId = file.substring(file.lastIndexOf("/") + 1);
        var uri = this.API_URL + "/node/workspace/SpacesStore/" + nodeId + "/formprocessor?alf_ticket=" + AuthorizationService.getAlfrescoTicket();
        var payload = {
            assoc_fs_attachments_added: attachment
        };

        var promise = $http.post(uri, payload).then(
            function (response) {
                return response.data;
            },
            this.handleError
        );

        if (this.need_validate_ticket()) {
            return this.validate_ticket().then(function (response) {
                return promise;
                });
        } else {
            return promise;
        }
    };

    this.getAttachments = function (nodeRef) {
        var promise = $http.get(this.GET_ATTACHMENTS_URL + nodeRef + "?alf_ticket=" + AuthorizationService.getAlfrescoTicket()).then(
            function (response) {
                return response;
            },
            this.handleError
        );

        if (this.need_validate_ticket()) {
            return this.validate_ticket().then(function (response) {
                return promise;
                });
        } else {
            return promise;
        }
    };

    this.getLinkedDocuments = function (barcodes) {
        // search for documents that include same barcode.
        var searchTerm = "";
        for (var i in barcodes) {
            searchTerm += "fs:barcodes:" + barcodes[i].barcode;
            if (i < barcodes.length - 1) {
                searchTerm += " OR ";
            }
        }
        if (searchTerm !== "") {
            var encodedType = encodeURI ('TYPE|{http://www.alfresco.org/model/content/1.0}content');
            var encodedRequest = encodeURIComponent(searchTerm);

            var uri = this.SEARCH_URL +
                "?term=" + encodedRequest +
                "&site=fax&filters=" + encodedType +
                "&sort=cm:modified|false" +
                "&alf_ticket=" + AuthorizationService.getAlfrescoTicket();

            var promise = $http.get(uri).then(
                function (response) {
                    return response;
                },
                this.handleError
            );

            if (this.need_validate_ticket()) {
                return this.validate_ticket().then(function (response) {
                    return promise;
                    });
            } else {
                return promise;
            }
        }
        return [];
    }

    this.getThumbnailLink = function (nodeRef) {
      var contentId = nodeRef.substring(nodeRef.lastIndexOf('/') + 1);
      return this.API_URL + '/node/workspace/SpacesStore/' + contentId + '/content/thumbnails/imgpreview?c=force&alf_ticket=' +  AuthorizationService.getAlfrescoTicket();
    };

    this.getAssignedFiles = function (status) {

        var url = this.FILE_PATH + "/miqare/user/" +  UserService.getCurrentUser() + "/assigned-workflow";

        var data = {
            "alf_ticket" : AuthorizationService.getAlfrescoTicket(),
            "status" : status||"*"
        };

        var promise = $http.get(url, {params  : data }).then(
            function (response) {
                if (response.data) {
                    var items = response.data.items;
                    SharedVariablesService.waitingForReviewFiles = 0;
                    for (var i in items) {
                        if ("Complete" !== items[i].workflow.status) {
                            SharedVariablesService.waitingForReviewFiles++;
                        }
                    }
                }
                return response;
            },
            this.handleError
        );

        if (this.need_validate_ticket()) {
            return this.validate_ticket().then(function (response) {
                return promise;
                });
        } else {
            return promise;
        }

    };

    this.getPeople = function () {
        var promise = $http.get(this.GET_PEOPLE + "?alf_ticket=" + AuthorizationService.getAlfrescoTicket()).then(
            function (response) {
                return response;
            },
            this.handleError
        );

        if (this.need_validate_ticket()) {
            return this.validate_ticket().then(function (response) {
                return promise;
                });
        } else {
            return promise;
        }
    };

    this.assignWorkflow = function (workflow) {
        var promise = $http.post(this.FILE_PATH + "/miqare/user/" + UserService.getCurrentUser() + "/assign-workflow?alf_ticket=" + AuthorizationService.getAlfrescoTicket(), workflow).then(
            function (response) {
                return response;
            },
            this.handleError
        );

        if (this.need_validate_ticket()) {
            return this.validate_ticket().then(function (response) {
                return promise;
                });
        } else {
            return promise;
        }
    };

    this.deleteNode = function(nodeRef) {
        var promise = $http.delete(this.FILE_PATH + "/slingshot/doclib/action/file/node/" + this.nodeToPath(nodeRef)
            + "?alf_ticket=" + AuthorizationService.getAlfrescoTicket()).then(function(response) {
                return response;
        },
        this.handleError);

        if (this.need_validate_ticket()) {
            return this.validate_ticket().then(function (response) {
                return promise;
                });
        } else {
            return promise;
        }
    };

    this.moveNode = function(nodeRef, destinationRef) {

        var payload = {
            nodeRefs:[nodeRef]
        };

        var url = this.FILE_PATH + "/slingshot/doclib/action/move-to/node/" + this.nodeToPath(destinationRef)
            + "?alf_ticket=" + AuthorizationService.getAlfrescoTicket();

        var promise = $http.post(url, payload).then(function(response) {
                return response;
            },
            this.handleError);

        if (this.need_validate_ticket()) {
            return this.validate_ticket().then(function (response) {
                return promise;
                });
        } else {
            return promise;
        }
    };

    this.renameNode = function(nodeRef, newName) {
        var nodeId = nodeRef.substring(nodeRef.lastIndexOf("/") + 1);
        var uri = this.API_URL + "/node/workspace/SpacesStore/" + nodeId + "/formprocessor?alf_ticket=" + AuthorizationService.getAlfrescoTicket();
        var payload = {
            prop_cm_name: newName
        };
        var promise = $http.post(uri, payload).then(
            function (response) {
                return response;
            },
            this.handleError
        );

        if (this.need_validate_ticket()) {
            return this.validate_ticket().then(function (response) {
                return promise;
                });
        } else {
            return promise;
        }
    };

    this.markNodeAsRead = function(nodeRef) {
        var nodeId = nodeRef.substring(nodeRef.lastIndexOf("/") + 1);
        var uri = this.METADATA_URL + "/workspace/SpacesStore/" + nodeId + "?alf_ticket=" + AuthorizationService.getAlfrescoTicket();
        var payload = {
            "properties":{
                'cm:status':'read'
            }
        };
        var headers = {
            headers: {
                "Content-Type": "application/json"
            }
        }
        var promise = $http.post(uri, payload, headers).then(
            function (response) {
                return response;
            },
            this.handleError
        );

        if (this.need_validate_ticket()) {
            return this.validate_ticket().then(function (response) {
                return promise;
                });
        } else {
            return promise;
        }
    };

    this.saveProperties = function(nodeRef, properties) {
        var nodeId = nodeRef.substring(nodeRef.lastIndexOf("/") + 1);
        var uri = this.METADATA_URL + "/workspace/SpacesStore/" + nodeId + "?alf_ticket=" + AuthorizationService.getAlfrescoTicket();
        var payload = {
            "properties": properties
        };
        var headers = {
            headers: {
                "Content-Type": "application/json"
            }
        }
        var promise = $http.post(uri, payload, headers).then(
            function (response) {
                return response;
            },
            this.handleError
        );

        if (this.need_validate_ticket()) {
            return this.validate_ticket().then(function (response) {
                return promise;
                });
        } else {
            return promise;
        }
    }

    this.buildNodeId = function (file_path) {
        return "workspace://" + file_path.substring(file_path.indexOf('SpacesStore'), file_path.lastIndexOf('/'));
    };

    this.getFileName = function(file_path) {
        var nodeId = file_path.substring(file_path.indexOf('SpacesStore'), file_path.lastIndexOf('/')) + '/';
        return file_path.substring(file_path.indexOf(nodeId) + nodeId.length, file_path.lastIndexOf('?'));
    };

    this.nodeToPath = function(nodeRef) {
        return nodeRef.replace(":/", "")
    };

    this.createFolder = function (folderName, parentFolder) {
        var uri = this.API_URL + "/type/cm:folder/formprocessor?alf_ticket=" + AuthorizationService.getAlfrescoTicket();
        var payload = {
            alf_destination: parentFolder,
            prop_cm_name: folderName
        };
        var promise = $http.post(uri, payload).then(
            function (response) {
                return response;
            },
            this.handleError
        );

        if (this.need_validate_ticket()) {
            return this.validate_ticket().then(function (response) {
                return promise;
                });
        } else {
            return promise;
        }
    };

    function formatDate(d, t) {
        return d.getFullYear().toString() + "\\-" + (d.getMonth() + 1).toString() + "\\-" + d.getDate().toString() + "T" + t;
    }

    function dateTerm(start, end) {
        var s = formatDate(start, "23:59:59");
        var e = formatDate(end, "23:59:59");
        return ' AND cm:created:["' + s + '" TO "' + e + '"]';
    }

    this.search = function (request, pageSize, startIndex, sortBy, ascending) {
        var encodedType = encodeURI ('TYPE|{http://www.alfresco.org/model/content/1.0}content');
        var exact_matched = false;

        // support search by barcode:xxxxxx
        if (request && request.toLowerCase().indexOf('barcode:') !== -1) {
            var pos = request.toLowerCase().indexOf('barcode:');
            var queryTerm = request.substring(pos + 8, request.length);
            request = 'fs:barcodes:' + queryTerm;
            exact_matched = true;
        }

        // support search by Rx:xxxxxxx
        if (request && request.toLowerCase().indexOf('rx:') !== -1) {
            var pos = request.toLowerCase().indexOf('rx:');
            var queryTerm = request.substring(pos + 3, request.length);
            request = 'fs:rxnumbers:' + queryTerm;
            exact_matched = true;
        }

        // support search by doctor:xxxxxxx
        if (request && request.toLowerCase().indexOf('doctor:') !== -1) {
            var pos = request.toLowerCase().indexOf('doctor:');
            var queryTerm = request.substring(pos + 7, request.length);
            request = 'fs:doctor:' + queryTerm;
            exact_matched = true;
        }

        // support search by patient:xxxxxxx
        if (request && request.toLowerCase().indexOf('patient:') !== -1) {
            var pos = request.toLowerCase().indexOf('patient:');
            var queryTerm = request.substring(pos + 8, request.length);
            request = 'fs:patient:' + queryTerm;
            exact_matched = true;
        }

        // support search by PHN:xxxxxxx
        if (request && request.toLowerCase().indexOf('phn:') !== -1) {
            var pos = request.toLowerCase().indexOf('phn:');
            var queryTerm = request.substring(pos + 4, request.length);
            request = 'fs:phn:' + queryTerm;
            exact_matched = true;
        }

        // support search by unscanned
        if (request && request.toLowerCase().indexOf('unscanned') !== -1) {
            // request = 'fs:unscanned:unscanned OR cm:name:unknown';
            var new_request = 'fs:unscanned:unscanned';

            if (request.toLowerCase().indexOf('&period=') !== -1) {
                period = request.split('&period=')[1];

                var today = new Date();
                var month = today.getMonth();
                var year = today.getFullYear();

                if ('today' == period) {
                    var start = new Date(new Date().setDate(today.getDate() - 1));
                    new_request += dateTerm(start, today)
                } else if ('week' == period) {
                    var week_day = today.getDay() > 0 ? today.getDay() : 7;
                    var start = new Date(new Date().setDate(today.getDate() - week_day));
                    new_request += dateTerm(start, today)
                } else if ('month' == period) {
                    var start = new Date(year, month, 1);
                    new_request += dateTerm(start, today)
                } else if ('year' == period) {
                    var start = new Date(year, 0, 1);
                    new_request += dateTerm(start, today)
                }
                request = new_request;
            }
            exact_matched = true;
        }

        if (!exact_matched) {
            // support universal search.
            var queryTerm = request.toLowerCase();
            request = 'fs:barcodes:' + queryTerm;
            request += ' OR fs:rxnumbers:' + queryTerm;
            request += ' OR fs:doctor:' + queryTerm;
            request += ' OR fs:patient:' + queryTerm;
            request += ' OR fs:phn:' + queryTerm;
            request += ' OR cm:name:' + queryTerm;
            request += ' OR cm:title:' + queryTerm;
            request += ' OR TEXT:' + queryTerm;
        }

        var encodedRequest = encodeURIComponent(request);

        var uri = this.SEARCH_URL +
            "?term=" + encodedRequest +
            "&site=fax&filters=" + encodedType +
            "&maxResults=0&pageSize=" + pageSize +
            "&startIndex=" + startIndex +
            "&sort=" + encodeURIComponent(sortBy + "|" + ascending)  +
            "&alf_ticket=" + AuthorizationService.getAlfrescoTicket();

        var promise = $http.get(uri).then(
            function (response) {
                return response.data;
            },
            this.handleError
        );

        if (this.need_validate_ticket()) {
            return this.validate_ticket().then(function (response) {
                return promise;
                });
        } else {
            return promise;
        }
    };

    this.getMetadataFromNodeRef = function (nodeRef) {
        var promise = $http.get(this.GET_METADATA_URL + nodeRef + "?alf_ticket=" + AuthorizationService.getAlfrescoTicket()).then(
            function (response) {
                return response;
            },
            this.handleError
        );

        if (this.need_validate_ticket()) {
            return this.validate_ticket().then(function (response) {
                return promise;
                });
        } else {
            return promise;
        }
    };

    this.fileInProcess = function (nodeRef) {
        return this.getMetadataFromNodeRef(nodeRef).then(
            function (response) {
                if (response.status === 200) {
                    var aspects = [];
                    for (var i = 0; i < response.data.aspects.length; i++) {
                        aspects.push(response.data.aspects[i].aspect);
                    }
                }
                return aspects.indexOf('fs:processing') > -1;
            },
            this.handleError
        );
    };

    this.getFileAttachments = function(nodeRef) {

      var promise = $http.get(this.GET_FILE_ATTACHMENTS_URL + nodeRef + '/children?selectableType=cm:content' + "&alf_ticket=" + AuthorizationService.getAlfrescoTicket()).then(
          function (response) {
              return response;
          },
          this.handleError
      );

        if (this.need_validate_ticket()) {
            return this.validate_ticket().then(function (response) {
                return promise;
                });
        } else {
            return promise;
        }
    };

    this.saveFileAttachments = function(targetFile, attachments) {

      var payload = {
        targetFile: targetFile,
        attachments: attachments
      };

      var promise = $http.post(this.SAVE_FILE_ATTACHMENTS_URL + "?alf_ticket=" + AuthorizationService.getAlfrescoTicket(), payload).then(
          function (response) {
              return response.data;
          },
          this.handleError
      );

        if (this.need_validate_ticket()) {
            return this.validate_ticket().then(function (response) {
                return promise;
                });
        } else {
            return promise;
        }
    };

    this.getMimetypeFileType = function (node) {

        if (!node.isContainer){
            if (node.mimetypeDisplayName){
                return node.mimetypeDisplayName;
            } else if (node.mimetype !== undefined){
                return node.mimetype.replace("application/","").toUpperCase();
            } else {
                return "";
            }
        }
    }

    this.getStats = function (period) {
        var encodedType = encodeURI ('TYPE|{http://www.alfresco.org/model/content/1.0}content');

        var uri = this.STATISTICS_URL +
            "?period=" + period +
            "&site=fax&filters=" + encodedType +
            "&alf_ticket=" + AuthorizationService.getAlfrescoTicket();

        var promise = $http.get(uri).then(
            function (response) {
                if ('year' === period) {
                    // somehow munro server got wrong month, patch here, need to debug on server.
                    var m = new Date().getMonth() + 1;
                    var num = response.data.list.length;
                    if (num > m) {
                        var list = [];
                        var offset = num - m;
                        for(var i=0; i<m; i++) {
                            list.push(response.data.list[offset + i]);
                        }
                        response.data.list = list;
                    }
                }
                return response;
            },
            this.handleError
        );

        if (this.need_validate_ticket()) {
            return this.validate_ticket().then(function (response) {
                return promise;
                });
        } else {
            return promise;
        }
    };

});
