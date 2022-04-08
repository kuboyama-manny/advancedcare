
// Documents Main Page Controller
angular.module('app').controller('DocumentsCtrl', ['$scope', '$stateParams', '$state', '$location', '$window', '$interval', '$timeout', 'AlfrescoService', 'AuthorizationService', 'APIService', 'TimeFormatService',
    function ($scope, $stateParams, $state, $location, $window, $interval, $timeout, AlfrescoService, AuthorizationService, APIService, TimeFormatService) {

        $scope.current_page = 1;
        $scope.page_size = undefined === $window.localStorage.pageSize ? 5 : parseInt($window.localStorage.pageSize);
        $scope.page_sizes = [5, 10, 15, 20, 50];
        $scope.page_total = 1;

        $scope.sortField = 'cm:modified';
        $scope.sortAsc = false;

        $scope.root_directories = [];
        $scope.current_files = [];
        $scope.show_folders = true;
        $scope.split_fileview = false;
        $scope.current_nodeRef;
        $scope.file_attachments = [];
        $scope.uploadInProgress = false;
        $scope.refreshingEnable = true;

        $scope.server_error;
        $scope.error_message;
        // $scope.main_path = null;

        $scope.initial_folder = $stateParams.folder;

        $scope.is_admin = $window.localStorage.role == 'admin';
        $scope.is_pharmacist = $window.localStorage.role == 'pharmacist';
        $scope.is_facility = $window.localStorage.role === 'facility';

        $scope.total_documents = 0;
        $scope.total_folders = 0;
        $scope.orderby = ['node.isContainer', 'node.unixTimeModified', 'node.name'];
        $scope.reverse = true;

        $scope.actionSuccess = false;
        $scope.actionFailed = false;
        $scope.actionMessage = '';

        AlfrescoService.setAuthFailureHandler(function(){
            $scope.stopRefreshFolder();
            $state.go('logout');
        });

        // register alfresco notification
        $scope.register_sse = function() {
            var eventSource = AlfrescoService.register_sse('folder');
            console.log("eventSource:", eventSource, "$scope.current_path:", $scope.current_path);

            if (null !== eventSource) {
                eventSource.addEventListener("nodeEvent", function(message) {
                    try {
                        var msgData = JSON.parse(message.data);
                        var nodeName = msgData.nodeName;
                        console.log("received nodeEvent, nodeName", nodeName);
                        // nodeName is null or undefined means the node is deleted
                        // nodeName is doclib means the the node is alfresco meta file
                        // we need to refresh folder if node is deleted, but no need refresh if
                        // alfresco meta file created.
                        if (!nodeName || nodeName !== "doclib") {
                            // check current path from location, only refresh current path
                            var curPath = $location.$$path.split('/docs/folder')[1] + '/';
                            curPath = curPath.replace('~2F', '/').replace('//', '/');
                            $scope.openDirectory(curPath);
                            console.log("folder refreshed:", curPath);
                        }
                    } catch(error) {}
                });
            }
        }

        $scope.prevPage = function () {
            if ($scope.current_page > 1) {
                $scope.current_page -= 1;
                $scope.loadData();
            }
        };

        $scope.nextPage = function () {
            if ($scope.current_page * $scope.page_size < $scope.page_total) {
                $scope.current_page += 1;
                $scope.loadData();
            }
        };

        $scope.loadData = function() {
            $window.localStorage.pageSize = $scope.page_size;
            if (!!$scope.current_path) {
                if ('name' === $scope.orderby) {
                    $scope.sortField = 'cm:name';
                } else if ('node.size' === $scope.orderby) {
                    $scope.sortField = 'size';
                } else if ('node.mimetypeFileType' === $scope.orderby) {
                    $scope.sortField = 'mimetypeDisplayName';
                } else if ('node.unixTimeModified' === $scope.orderby) {
                    $scope.sortField = 'cm:modified';
                } else {
                    $scope.sortField = 'cm:modified';
                }
                $scope.sortAsc = !$scope.reverse;
                $scope.openDirectory($scope.current_path);
            }
        }

        $scope.init = function () {

            var initialPath = '/';
            var allowedRootFolder = '';

            // open facility root folder if facility logged in.
            if ($scope.is_facility) {
                allowedRootFolder = $window.localStorage.person_userName.split('@')[0];
            } else if ($scope.is_pharmacist) {
                // get pharmacy name
                if (!$window.localStorage.current_pharmacy_name) {
                    $scope.helpers.uiBlocks('#treeBlock', 'state_loading');
                    APIService.get('/pharmacy?count=1').then(function (response) {
                        $scope.helpers.uiBlocks('.block', 'state_normal');

                        if (response === undefined) return;
                        if (response.s && response.s === 'f') {
                            return;
                        }
                        var pharmacies = response.result;
                        if (pharmacies.length === 1 && !!pharmacies[0].name) {
                            $window.localStorage.current_pharmacy_name = pharmacies[0].name;
                            allowedRootFolder = pharmacies[0].name;
                        }
                    });
                } else {
                    allowedRootFolder = $window.localStorage.current_pharmacy_name;
                }
            }

            allowedRootFolder = allowedRootFolder.toLowerCase().split(' ')[0];

            if ($scope.initial_folder === null || $scope.initial_folder === '/' || $scope.initial_folder === '') {
                $scope.initial_folder = allowedRootFolder;
            }

            if ($scope.initial_folder && $scope.initial_folder != '/') {
                initialPath = '/' + $scope.initial_folder + '/';
            }
            var pathRemovedFirstSlash = $location.$$path.substring(1, $location.$$path.length);
            $scope.main_path = pathRemovedFirstSlash.substring(0, pathRemovedFirstSlash.indexOf('/'));

            AlfrescoService.loadDirectory('/', $scope.main_path, $scope.page_size, $scope.current_page,
                                          $scope.sortField, $scope.sortAsc).then(function (response) {
                $scope.root_directories = response.data;

                if (!$scope.is_admin) {
                    // if not admin login, limit documents folders.
                    $scope.root_directories.items = [];

                    if ('' !== allowedRootFolder) {
                        // only show docs that allowed to view for the user.
                        for (f in response.data.items) {
                            var item = response.data.items[f];
                            if (item.location.file === allowedRootFolder) {
                                $scope.root_directories.items = [item];
                                break;
                            }
                        }
                    }

                }
                $scope.openDirectory(initialPath);

                var eventSource = $window.localStorage.alf_folder_eventSource;
                if (!eventSource) {
                    $scope.register_sse();
                }

            });

            // still refresh page as sometimes folders not updated during path toggle.
            $scope.refreshFolder();
        };

        $scope.$watch('files_manual_upload', function () {
            $scope.upload($scope.files_manual_upload);
            $scope.files_manual_upload = null;
        });

        $scope.$watch('files', function () {
            $scope.upload($scope.files);
            $scope.files = null;
        });

        $scope.upload = function (files) {
            if (!this.current_files.metadata) return;
            var destination = this.current_files.metadata.parent.nodeRef;
            if (files && files.length) {
              $scope.uploadInProgress = true;
              var me = this;
              AlfrescoService.uploadFile(files, destination).then(function () {
                  me.uploadInProgress = false;
                  me.openDirectory(me.current_path);
              }, function(response) {
                  me.uploadInProgress = false;
                  alert("Upload failed. " + response.statusText);
              });
            }

        };

        $scope.openDirectory = function (path, abs) {
            if (abs === undefined) abs = true;
            $scope.current_path = path;

            if (!$scope.main_path) {
                return;
            }

            if ($scope.page_total <= ($scope.current_page - 1) * $scope.page_size) $scope.current_page = 1;

            AlfrescoService.loadDirectory(path, $scope.main_path, $scope.page_size, $scope.current_page,
                                          $scope.sortField, $scope.sortAsc).then(function (response) {
                $scope.helpers.uiBlocks('#treeBlock', 'state_normal');
                if (!!response && !!response.data) {
                    var directoryFiles = [];
                    var documentFiles = [];
                    $scope.page_total = response.data.totalRecords;

                    var page_numbers = [];
                    var i = 0;
                    do {
                        i += 1;
                        page_numbers.push(i);
                    } while ($scope.page_size * i < $scope.page_total);
                    $scope.page_numbers = page_numbers;

                    for (var i = 0; i < response.data.items.length; i++) {
                        response.data.items[i].node.mimetypeFileType = AlfrescoService.getMimetypeFileType(response.data.items[i].node);
                        response.data.items[i].node.displayTime = TimeFormatService.formatUtc(response.data.items[i].node.properties["cm:modified"].iso8601);
                        response.data.items[i].node.unixTimeModified = TimeFormatService.timeUtc(response.data.items[i].node.properties["cm:modified"].iso8601);
                        response.data.items[i].node.displayCreatedOn = TimeFormatService.formatUtc(response.data.items[i].node.properties["cm:created"].iso8601);
                        response.data.items[i].node.unixTime = TimeFormatService.timeUtc(response.data.items[i].node.properties["cm:created"].iso8601);

                        var node_size = parseInt(response.data.items[i].node.size.split(',').join(''))
                        if (node_size < 1000) {
                            response.data.items[i].node.sizeStr = node_size.toString() + " bytes";
                        } else if (node_size < 1000000) {
                            response.data.items[i].node.sizeStr = Math.round(node_size / 1000).toString() + " KB";
                        } else if (node_size < 1000000000) {
                            response.data.items[i].node.sizeStr = Math.round(node_size / 1000000).toString() + " MB";
                        } else {
                            response.data.items[i].node.sizeStr = Math.round(node_size / 1000000000).toString() + " GB";
                        }

                        if ($scope.show_raw || 'raw' !== response.data.items[i].node.properties["cm:israw"]) {
                            documentFiles.push(response.data.items[i]);
                        }
                        if (!response.data.items[i].node.isContainer) directoryFiles.push(response.data.items[i]);
                    }
                    directoryFiles.sort(function(a, b) {
                        var date1 = new Date(a.node.properties['cm:modified'].iso8601);
                        var date2 = new Date(b.node.properties['cm:modified'].iso8601);
                        if (date1.getTime() > date2.getTime()) return 1;
                        if (date1.getTime() < date2.getTime()) return -1;
                        return 0;
                    });
                    $scope.current_files = response.data;
                    $scope.current_files.items = documentFiles;
                    $scope.total_documents = $scope.current_files.metadata.itemCounts.documents;
                    $scope.total_folders = $scope.current_files.metadata.itemCounts.folders;
                    $window.localStorage.directoryFiles = JSON.stringify(directoryFiles);
                }
            });
        };

        var stop;
        $scope.refreshFolder = function () {
            if (angular.isDefined(stop)) return;
            stop = $interval(function () {
                if ($scope.refreshingEnable && !!$scope.current_path){
                    // somehow $scope.current_path saved all visit histories and
                    // tried to refresh them all.
                    // we only want to refresh last loaded folder.
                    var last_loaded_folder = AlfrescoService.get_last_loaded_folder();
                    if (last_loaded_folder == $scope.current_path) {
                        $scope.openDirectory($scope.current_path);
                    }
                }
            }, 30000);
        };

        $scope.stopRefreshFolder = function () {
            if (angular.isDefined(stop)) {
                $interval.cancel(stop);
                stop = undefined;
            }
        };

        $scope.setRefreshing = function (isRefresh) {
            $scope.refreshingEnable = isRefresh;
        };

        $scope.$on('$destroy', function () {
            // Make sure that the interval is destroyed too
            $scope.stopRefreshFolder();
        });

        $scope.goBack = function (current_path, mainPath) {
            var arr = current_path.split("/");
            arr.splice(arr.length - 2, 2);
            var parentFolder = arr.join("/");
            var path = parentFolder.substring(1, parentFolder.length);
            $state.go(mainPath, {folder: path});
        };

        $scope.goIntoDirectory = function (node) {
            if (node.node.isContainer) {
                var path = $scope.current_path + node.location.file;
                path = path.substring(1, path.length);
                $state.go($scope.main_path, {folder: path});
             } else {
                console.log("goIntoDirectory. node", node);
                var nodeRef = node.node.nodeRef;
                var fileName = node.location.file;
                var backPoint = $scope.main_path + ':' + $scope.current_path;
                $state.go('file', {node_ref: nodeRef, file_name: fileName, from: backPoint});
            }
        };

        $scope.changeRootDirectory = function (directory) {
            $state.go($scope.main_path, {folder: directory.location.file});
        };

        $scope.createFolder = function (folderName) {
            var parentFolder = this.current_files.metadata.parent.nodeRef;
            var me = this;
            AlfrescoService.createFolder(folderName, parentFolder).then(function (response) {
                if (response.status != 200) {
                    me.server_error = true;
                    if (response.message.indexOf("Duplicate child name") > -1) {
                        me.error_message = "A folder with the same name already exists"
                    } else {
                        me.error_message = response.message.substring(response.message.indexOf(":") + 1);
                    }
                    $scope.showCreateForm = true;
                    $scope.newFolderForm.$setPristine();
                } else {
                    $scope.destroyCreateFolderForm();
                }
            });
        };

        $scope.destroyCreateFolderForm = function () {
            $scope.newFolderForm.$setPristine();
            $scope.folderName = null;
            $scope.server_error = false;
            $scope.showCreateForm = false;
            $scope.openDirectory($scope.current_path);
        };

        $scope.showRenameDialog = function (file) {

            $scope.fileToRename = file;
            if(file.node.isContainer || file.node.properties["cm:name"].lastIndexOf('.') === -1)
            {
                $scope.fileToRename.name = file.node.properties['cm:name'];
            } else {
                $scope.fileToRename.name = file.node.properties["cm:name"].substring(0,file.node.properties["cm:name"].lastIndexOf('.'));
            }

            $('#rename-modal').modal('toggle');
        };

        $scope.renameNode = function (fileToRename) {

            $scope.actionSuccess = false;
            $scope.actionFailed = false;
            $scope.actionMessage = '';

            var newName = fileToRename.name;

            var fullName = fileToRename.node.properties['cm:name'];

            if(!fileToRename.node.isContainer &&  fullName.lastIndexOf('.') > -1){

                var ext = fullName.substring(fullName.lastIndexOf('.'), fullName.length);

                newName = fileToRename.name + ext;
            }

            AlfrescoService.renameNode(fileToRename.node.nodeRef, newName).then(function (response) {

                if (response.status != 200){

                    $scope.error_message = 'Can not rename to "' + newName + '", ';

                    if (response.message.indexOf("Invalid property value") > -1){
                        $scope.error_message += "Invalid file or folder name";
                    } else {
                        $scope.error_message += response.message.substring(response.message.indexOf(":") + 1);
                    }
                    $scope.server_error = true;
                    $scope.renameFormForm.$setPristine();

                } else {
                    $scope.server_error = false;
                    $scope.actionSuccess = true;

                    $scope.actionMessage = 'Successfully renamed to "' + newName + '"';

                    window.scrollTo(0, 0);
                    $scope.openDirectory($scope.current_path);
                    $('#rename-modal').modal('hide');
                }
            });
        };

        $scope.showDeleteDialog = function (file) {

            $scope.nodeToRemove = file;
            $('#remove-modal').modal('toggle');
        };

        $scope.removeNode = function (nodeToRemove) {

            $scope.actionSuccess = false;
            $scope.actionFailed = false;
            $scope.actionMessage = '';

            if (nodeToRemove === null || typeof(nodeToRemove) === 'undefined') return;

            $('#remove-modal').modal('toggle');

            var name = nodeToRemove.node.properties['cm:name'];

            AlfrescoService.deleteNode(nodeToRemove.node.nodeRef).then(function (response) {

                if (response.status == 200){
                    $scope.actionSuccess = true;

                    $scope.actionMessage = 'Successfully deleted "' + name + '".';
                    nodeToRemove = null;
                } else {

                    $scope.actionFailed = true;
                    $scope.actionMessage = 'Can not delete "' + name + '".';
                }
                window.scrollTo(0, 0);
                $scope.openDirectory($scope.current_path);
            });
        };

        $scope.showMoveDialog = function (file) {
            $scope.fileToMove = file;
            $scope.moveToFolder = null;
            $scope.currentMoveDialoguePath = "/";
            $('#move-modal').on('shown.bs.modal', function () {
                $scope.loadFolderList();
            });
            $('#move-modal').modal('toggle');
        };

        $scope.loadFolderList = function (node) {
            $scope.moveToFolder = null;
            $scope.foldersToMove = [];
            var currentMoveToDirectory = '/';
            if (node){
                currentMoveToDirectory = $scope.currentMoveDialoguePath + node.location.file + "/";
            }

            AlfrescoService.loadDirectory(currentMoveToDirectory, $scope.main_path, $scope.page_size, $scope.current_page,
                                          $scope.sortField, $scope.sortAsc).then(function (response) {
                $scope.foldersToMoveData = response.data;
                $scope.currentMoveDialoguePath = currentMoveToDirectory;
                $scope.clearSelectedFolder();
            });
        };

        $scope.selectFolder = function (folder) {
            $scope.moveToFolder = folder;
        };

        $scope.clearSelectedFolder = function () {
            $scope.moveToFolder = $scope.foldersToMoveData.metadata.parent;
        };

        $scope.moveNode = function (selectedFolder) {

            var destinationFolderName = selectedFolder.properties["cm:name"];
            var originName = $scope.fileToMove.node.properties["cm:name"];

            $scope.actionSuccess = false;
            $scope.actionFailed = false;
            $scope.actionMessage = '';

            AlfrescoService.moveNode($scope.fileToMove.node.nodeRef, selectedFolder.nodeRef).then(function (response) {

                if (response.status == 200){

                    if (response.data.overallSuccess){
                        $scope.actionSuccess = true;

                        $scope.actionMessage = 'Successfully moved "' + originName + '" to "' + destinationFolderName + '".';
                    } else {

                        var message = '';

                        if(!response.data.results[0].success){

                            message = "Folder or File with the same name is already exist"
                        }

                        $scope.actionFailed = true;

                        $scope.actionMessage = 'Can not move "' + originName + '" ' + '" to "' + destinationFolderName + '", ' + message;
                    }

                } else {
                    $scope.actionFailed = true;

                    $scope.actionMessage = 'Can not move "' + originName + '" ' + '" to "' + destinationFolderName + '", ' + response.status.description;
                }

                window.scrollTo(0, 0);
                $scope.openDirectory($scope.current_path);
            });

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
]).directive('nodeName', function () {
    return {
        require: 'ngModel',
        link: function (scope, element, attr, mCtrl) {
            var folderNameValidation = function (value) {
                var illegalCharacters = new RegExp("[*:?\\/|<>\"]");
                if (illegalCharacters.test(value)) {
                    mCtrl.$setValidity('illegalCharacters', false);
                } else {
                    mCtrl.$setValidity('illegalCharacters', true);
                }
                return value;
            };
            mCtrl.$parsers.push(folderNameValidation);
        },
        controller: "DocumentsCtrl"
    };
});
