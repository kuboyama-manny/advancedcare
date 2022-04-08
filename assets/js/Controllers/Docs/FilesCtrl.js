// File View Controller
angular.module('app').controller('FilesCtrl', ['$scope', '$stateParams', '$state', '$location',
            '$window', '$interval', '$timeout', 'AlfrescoService', 'AuthorizationService',
            'APIService', 'TimeFormatService',
    function ($scope, $stateParams, $state, $location, $window, $interval, $timeout,
              AlfrescoService, AuthorizationService, APIService, TimeFormatService) {

        $scope.node_ref = $stateParams.node_ref;
        $scope.file_name = $stateParams.file_name;
        $scope.back_point = $stateParams.from;
        $scope.back_button_message;
        $scope.users = [];
        $scope.currentUser = $window.localStorage.person_userName;
        $scope.main_file_in_process = false;
        $scope.enable_pdf_editing = window.ENABLE_PDF_EDITING;
        $scope.edit_mode = false;

        // docutment details
        $scope.doctor_option = 'choose';
        $scope.patient_option = 'choose';
        $scope.doctor_key = '';
        $scope.patient_key = '';
        $scope.patient_phn = '';

        $scope.editorInitUrl = window.ENABLE_PDF_EDITING ? window.ANNOTATION_URL : "";
        $scope.mainFileLoaded = false;

        AlfrescoService.setAuthFailureHandler(function(){
            $state.go('logout');
        });

        // register alfresco notification
        $scope.register_sse = function() {
            var eventSource = AlfrescoService.register_sse('file');
            console.log("eventSource:", eventSource);

            if (null !== eventSource) {
                eventSource.addEventListener("propertyEvent", function(message) {
                    try {
                        var nodeRef = JSON.parse(message.data).nodeRef;
                        // console.log("received propertyEvent, nodeRef", nodeRef);
                        if (undefined !== $scope.node_ref && $scope.node_ref == nodeRef) {
                            $scope.updateFileMetadata($scope.node_ref);
                            $scope.updateLinkedFiles($scope.node_ref);
                            console.log("file property refreshed:", $scope.node_ref);
                        }
                    } catch(error) {}
                });
                eventSource.addEventListener("nodeEvent", function(message) {
                    try {
                        var nodeRef = JSON.parse(message.data).nodeRef;
                        // console.log("received nodeEvent, nodeRef", nodeRef);
                        if (undefined !== $scope.node_ref && undefined !== nodeRef) {
                            $scope.updateLinkedFiles($scope.node_ref);
                            $scope.updateAttachmentsPreview();
                            console.log("file property refreshed:", $scope.node_ref);
                        }
                    } catch(error) {}
                });
            }
        }

        // register message event from annotationeer
        $scope.registerMessage = function () {
            // Create IE + others compatible event handler
            var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
            var eventer = window[eventMethod];
            var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

            // Listen to message from child window
            eventer(messageEvent,function(e) {
                console.log('parent received message!:  ',e.data);
                if (e.data.msg == 'alfresco_save_ok') {
                    $scope.setSigned();
                } else if (e.data.msg == 'alfresco_save_failed' && e.data.statusCode == 401) {
                    alert('Sorry, please login again.');
                    $state.go('logout');
                } else if (e.data.msg == 'alfresco_save_failed' && e.data.statusCode == 403) {
                    alert('Sorry, you don’t have permission to process the document.');
                }
            },false);
        }

        if (window.ENABLE_PDF_EDITING) {
            $scope.registerMessage();
        }

        $scope.init = function () {
            $scope.loadMainFile();
            $scope.getPeople();
        };

        $scope.getPeople = function () {
            AlfrescoService.getPeople().then(function (response) {
                if (!response || !response.data || !response.data.people) return;
                response.data.people.forEach(function (user, index, array) {
                    if (user.userName !== 'guest' && user.userName !== 'System') {
                        $scope.users.push(user);
                    }
                });

                AlfrescoService.getAssignedFiles();
                $scope.initBackButton();

                var eventSource = $window.localStorage.alf_file_eventSource;
                if (!eventSource) {
                    $scope.register_sse();
                }

            });
        };

        var stop;
        $scope.loadMainFile = function () {
            $scope.openFile($scope.node_ref);

            if (angular.isDefined(stop)) return;

            if (!$scope.mainFileLoaded){
                stop = $interval(function () {
                    if (!$scope.mainFileLoaded){
                        $scope.openFile($scope.node_ref);
                    } else {
                        $interval.cancel(stop);
                        console.log("---- mainFileLoaded?", $scope.mainFileLoaded);
                    }
                }, 1000);
            }
        }

        $scope.$on('$destroy', function () {
            // Make sure that the interval is destroyed too
            if (angular.isDefined(stop)) {
                $interval.cancel(stop);
                stop = undefined;
            }
        });

        window.iFrameLoaded = function (viewer) {
            var viewerFrame = document.getElementById(viewer);
            if (viewerFrame && viewerFrame.src && '' != viewerFrame.src) {
                if (window.ENABLE_PDF_EDITING) {
                    var data = {
                        'mi_token': localStorage.token,
                        'mi_api_url': window.API_URL,
                        'alfresco_url': window.ALFRESCO_URL
                    }
                    viewerFrame.contentWindow.postMessage(data, window.HOME_URL);
                }
                console.log(viewer + ' loaded');
            }
        }

        $scope.searchDoctor = function () {
            if ($scope.doctor_key == '') {
                $scope.doctors_list = [];
                return;
            }
            APIService.get('/doctor?q=' + $scope.doctor_key).then(function (response) {
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.doctors_list = response.result;
            });
        };
        $scope.searchDoctor();

        $scope.doctorChosen = function (doctor_key) {
            if ($scope.doctor) {
                $scope.doctor_key = $scope.doctor.profile.first_name + ' ' + $scope.doctor.profile.last_name;
                doctor_key.$setPristine();
            }
        };

        $scope.searchPatient = function () {
            APIService.get('/patient?q=' + $scope.patient_key).then(function (response) {
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return;
                }
                $scope.patients_list = response.result.patients;

            });
        };

        $scope.patientChosen = function (patient_key) {
            if ($scope.patient) {
                $scope.patient_key = $scope.patient.first_name + ' ' + $scope.patient.last_name;
                patient_key.$setPristine();

                // get phn
                APIService.get('/patient?id=' + $scope.patient.id).then(function (response) {
                    $scope.helpers.uiBlocks('.block', 'state_normal');


                    if (response === undefined) return;
                    if (response.s && response.s === 'f') {
                        return;
                    }
                    $scope.patient_phn = response.result.phn;
                });
            }
        };

        $scope.saveProperties = function(isValid) {

            if (!isValid) {
                $scope.saveFailed = true;
                $scope.error_m = 'required_fields_missing';
                return false;
            }

            $scope.saveFailed = false;
            $scope.saveSuccess = false;

            // create new doctor
            if ($scope.doctor_option == 'create') {

                $scope.doctor_key = $scope.new_doctor.profile.first_name + ' ' + $scope.doctor.profile.last_name;

                APIService.post('/doctor', $scope.new_doctor).then(function (response) {
                    $scope.helpers.uiBlocks('.block', 'state_normal');
                    if (response === undefined) return;
                    if (response.s === 'f') {
                        $scope.saveFailed = true;
                        $scope.error_m = response.m;
                        return;
                    } else {
                        $scope.saveSuccess = true;
                        $scope.new_patient.primary_doctor = {
                            id: response.result.id
                        };
                    }
                });
            }

            // create new patient
            if ($scope.patient_option == 'create') {

                $scope.patient_key = $scope.new_patient.first_name + ' ' + $scope.new_patient.last_name;
                $scope.patient_phn = $scope.new_patient.phn;

                APIService.post('/patient', $scope.new_patient).then(function (response) {
                    $scope.helpers.uiBlocks('.block', 'state_normal');
                    if (response === undefined) return;
                    if (response.s === 'f') {
                        $scope.saveFailed = true;
                        $scope.error_m = response.m;
                        return;
                    } else {
                        $scope.saveSuccess = true;
                        var newPatientId = response.result.id;
                        return;
                    }
                });
            }

            // save to alfresco file as properties.
            var properties = {
                'fs:doctor': $scope.doctor_key,
                'fs:patient': $scope.patient_key,
                'fs:phn': $scope.patient_phn,
                'fs:notes': $scope.notes
            };

            AlfrescoService.saveProperties($scope.current_nodeRef.nodeRef, properties).then(function (response) {
                $scope.updateFileMetadata($scope.current_nodeRef.nodeRef);
            });

        }

        $scope.saveBarcodes = function(isValid) {
            if (!isValid) {
                $scope.saveFailed = true;
                $scope.error_m = 'required_fields_missing';
                return false;
            }

            $scope.saveFailed = false;
            $scope.saveSuccess = false;

            // rename file.
            var name = $scope.current_nodeRef.name;
            var flag = $scope.unscannedStr;

            if ('' !== $scope.rxnumbersStr || '' !== $scope.barcodesStr) {
                var rx = '' !== $scope.rxnumbersStr ? 'rx-' + $scope.rxnumbersStr : 'rx-unknown';
                var bc = '' !== $scope.barcodesStr ? '-barcode-' + $scope.barcodesStr : '-barcode-unknown';
                name = rx + bc;
                flag = 'scanned';
            }

            // save to alfresco file as properties.
            var properties = {
                'fs:barcodes': $scope.barcodesStr,
                'fs:rxnumbers': $scope.rxnumbersStr,
                'cm:name': name,
                'fs:unscanned': flag
           };

            AlfrescoService.saveProperties($scope.current_nodeRef.nodeRef, properties).then(function (response) {
                $scope.updateFileMetadata($scope.current_nodeRef.nodeRef);
                $scope.updateLinkedFiles($scope.current_nodeRef.nodeRef);
            });
        }

        function assignMetadataFromResponse(response) {
            $scope.current_nodeRef = response.data;
            $scope.current_nodeRef.displayTime = TimeFormatService.format($scope.current_nodeRef.modifiedOn);
            $scope.current_nodeRef.displayCreatedOn = TimeFormatService.format($scope.current_nodeRef.createdOn);

            var node_size = parseInt($scope.current_nodeRef.size.split(',').join(''))
            if (node_size < 1000) {
                $scope.current_nodeRef.sizeStr = node_size.toString() + " bytes";
            } else if (node_size < 1000000) {
                $scope.current_nodeRef.sizeStr = Math.round(node_size / 1000).toString() + " KB";
            } else if (node_size < 1000000000) {
                $scope.current_nodeRef.sizeStr = Math.round(node_size / 1000000).toString() + " MB";
            } else {
                $scope.current_nodeRef.sizeStr = Math.round(node_size / 1000000000).toString() + " GB";
            }

            $scope.barcodes = $scope.current_nodeRef.barcodes;
            $scope.rxnumbers = $scope.current_nodeRef.rxnumbers;
            $scope.unscanned = $scope.current_nodeRef.unscanned;
            $scope.workflow = $scope.current_nodeRef.workflow;
            $scope.current_nodeRef.mimetypeFileType = AlfrescoService.getMimetypeFileType($scope.current_nodeRef);

            $scope.barcodesStr = '';
            for(i in $scope.barcodes) {
                $scope.barcodesStr += $scope.barcodes[i].barcode + ',';
            }
            $scope.barcodesStr = $scope.barcodesStr.substring(0, $scope.barcodesStr.length-1);

            $scope.rxnumbersStr = '';
            for(i in $scope.rxnumbers) {
                $scope.rxnumbersStr += $scope.rxnumbers[i].rxnumber.replace('rx-', '') + ',';
            }
            $scope.rxnumbersStr = $scope.rxnumbersStr.substring(0, $scope.rxnumbersStr.length-1);

            $scope.unscannedStr = '';
            for(i in $scope.unscanned) {
                $scope.unscannedStr += $scope.unscanned[i] + ',';
            }
            $scope.unscannedStr = $scope.unscannedStr.substring(0, $scope.unscannedStr.length-1);
        }

        function assignLinkedFromResponse(response) {
            $scope.file_linked_documents = {
                items: []
            };

            if (response && response.data) {
                for (var i = 0; i < response.data.items.length; i++) {
                    response.data.items[i].thumbnailsLink = AlfrescoService.getThumbnailLink(response.data.items[i].nodeRef);
                }
                $scope.file_linked_documents = response.data;
            }
            $scope.helpers.uiBlocks('#attachments-block', 'state_normal');

            var file_thumb = {
                nodeRef: $scope.current_nodeRef.nodeRef,
                name: $scope.current_nodeRef.name,
                contentURL: $scope.current_nodeRef.contentURL,
                thumbnailsLink: AlfrescoService.getThumbnailLink($scope.current_nodeRef.nodeRef)
            };

            $scope.resetSplitView();
        }

        $scope.updateFileMetadata = function(node_ref) {
            AlfrescoService.getMetadataFromNodeRef(node_ref).then(function (response) {
                assignMetadataFromResponse(response);
            });
        };

        $scope.updateLinkedFiles = function(node_ref) {
            if ($scope.barcodes) {
                AlfrescoService.getLinkedDocuments($scope.barcodes).then(function (response) {
                    assignLinkedFromResponse(response);
                });
            }
        }

        $scope.updateAttachmentsPreview = function () {
            for ( i in $scope.file_attachments.items) {
                var file = $scope.file_attachments.items[i];
                var thumbnailsLink = AlfrescoService.getThumbnailLink(file.nodeRef);
                $scope.file_attachments.items[i].thumbnailsLink = thumbnailsLink + '&decache=' + Math.random();
            }
        };

        $scope.setSigned = function () {

            var username = window.ALFRESCO_USER1;
            var users = window.ALFRESCO_USER2.split(",");
            users.forEach(function (user, index, array) {
                if (user === $window.localStorage.person_userName) {
                    username = user;
                    return;
                }
            });

            // save to alfresco file as properties.
            var properties = {
                'fs:signedBy': username,
            };

            AlfrescoService.saveProperties($scope.current_nodeRef.nodeRef, properties).then(function (response) {
                // back to files list folder
                $scope.goBack();
            });

        }

        $scope.openFile = function (node_ref) {
            $scope.main_file_in_process = false;

            var fileLoaded = false;

            if (node_ref === $scope.node_ref) {
                // main file, we want to load it as early as possible.
                var file_path = AlfrescoService.getFileContentUrlFromNodeRef($scope.node_ref, $scope.file_name);
                var viewer_id = 'file_viewer';
                $scope.loadFile (viewer_id, file_path);
                fileLoaded = true;
            }

            AlfrescoService.getMetadataFromNodeRef(node_ref).then(function (response) {

                $scope.helpers.uiBlocks('#attachments-block', 'state_loading');
                assignMetadataFromResponse(response);

                AlfrescoService.getAttachments($scope.current_nodeRef.nodeRef).then(function (response) {
                    $scope.file_attachments = {
                        items: []
                    };

                    if (response && response.data) {
                        for (var i = 0; i < response.data.items.length; i++) {
                            response.data.items[i].thumbnailsLink = AlfrescoService.FILE_PATH + response.data.items[i].thumbnails + '&alf_ticket=' + AuthorizationService.getAlfrescoTicket();
                        }
                        $scope.file_attachments = response.data;
                    }
                    $scope.helpers.uiBlocks('#attachments-block', 'state_normal');

                    var file_thumb = {
                        nodeRef: $scope.current_nodeRef.nodeRef,
                        name: $scope.current_nodeRef.name,
                        contentURL: $scope.current_nodeRef.contentURL,
                        thumbnailsLink: AlfrescoService.getThumbnailLink($scope.current_nodeRef.nodeRef)
                    };

                    $scope.file_attachments.items.splice(0, 0, file_thumb);
                    $scope.resetSplitView();
                    $scope.openAttachment($scope.file_attachments.items[0], fileLoaded);

                    AlfrescoService.fileInProcess($scope.current_nodeRef.nodeRef).then(function (inProgress) {
                        if (inProgress) {
                            $scope.main_file_in_process = true;
                            $scope.checkMainFile();
                        }
                    });
                });

                AlfrescoService.markNodeAsRead($scope.current_nodeRef.nodeRef).then(function (response) {
                });

                if ($scope.barcodes) {
                    AlfrescoService.getLinkedDocuments($scope.barcodes).then(function (response) {
                        assignLinkedFromResponse(response);
                    });
                }
            });
        };

        $scope.resetSplitView = function () {
            $scope.openedFiles = 0;
            $scope.lastOpenedFile = undefined;
            $scope.leftFile = undefined;
            $scope.rightFile = undefined;
        };

        $scope.openAttachment = function (file, fileLoaded=false) {

            var path = AlfrescoService.getFileURL(file.contentURL);
            var viewer;

            if (!file.isChecked) {
                file.isChecked = true;
                if ($scope.openedFiles === 0) {
                    $scope.split_fileview = false;
                    viewer = 'file_viewer';
                    $scope.openedFiles++;
                } else if ($scope.openedFiles === 1) {
                    $scope.split_fileview = true;
                    viewer = 'file_viewer2';
                    $scope.rightFile = file;
                    $scope.openedFiles++;
                } else if ($scope.openedFiles === 2) {
                    $scope.split_fileview = true;
                    $scope.lastOpenedFile.isChecked = false;
                    $scope.rightFile = file;
                    viewer = 'file_viewer2';
                }
            } else {
                if ($scope.openedFiles === 2) {
                    file.isChecked = false;
                    $scope.openedFiles--;
                    $scope.split_fileview = false;
                    viewer = 'file_viewer';
                    if (file.$$hashKey === $scope.rightFile.$$hashKey) {
                        $scope.rightFile = undefined;
                        return;
                    } else {
                        file = $scope.rightFile;
                        path = AlfrescoService.getFileURL(file.contentURL);
                    }
                }
            }

            $scope.lastOpenedFile = file;

            if (!fileLoaded) {
                $scope.loadFile(viewer, path);
            }

            AlfrescoService.markNodeAsRead(file.nodeRef).then(function (response) {

            });

        };

        $scope.loadFile = function (viewer_id, file_path) {
            console.log('file_path:', file_path);

            $scope.file_viewer_in_process = false;
            $scope.file_viewer2_in_process = false;
            $scope.helpers.uiBlocks('#' + viewer_id + '_parent', 'state_normal');

            var docId = AlfrescoService.buildNodeId(file_path);
            var docName = AlfrescoService.getFileName(file_path);
            var viewerFrame = document.getElementById(viewer_id + "_frame");

            if (viewerFrame !== null) {
                if($scope.enable_pdf_editing && $scope.edit_mode) {
                    var anno_src = window.ANNOTATION_URL + "?doc_id=" + docId + "&doc_name=" + docName;
                    anno_src += "&file=" + encodeURIComponent(file_path);
                    viewerFrame.src = anno_src;
                } else {
                    // download or open file in browser directly
                    viewerFrame.src = file_path;
                }
                $scope.mainFileLoaded = true;
            }
        }

        $scope.editFile = function () {
            var file_path = AlfrescoService.getFileContentUrlFromNodeRef($scope.node_ref, $scope.file_name);
            var viewer_id = 'file_viewer';
            $scope.edit_mode = true;
            $scope.loadFile(viewer_id, file_path);
        }

        $scope.checkMainFile = function () {
            AlfrescoService.fileInProcess($scope.current_nodeRef.nodeRef).then(function (inProcess) {
                if (inProcess && $scope.main_file_in_process) {
                    setTimeout(function () {
                        $scope.checkMainFile()
                    }, 5000);
                } else {
                    $scope.main_file_in_process = false;
                }
            })
        };

        $scope.$watch('attachments', function () {
            $scope.addAttachments($scope.attachments);
            $scope.attachments = null;
        });

        $scope.addAttachments = function (attachments) {
            if (!$scope.current_nodeRef) return;
            var destination = $scope.current_nodeRef.metadata.parent.nodeRef;
            if (attachments && attachments.length) {
                $scope.uploadInProgress = true;
                AlfrescoService.uploadAttachments(attachments, destination, $scope.current_nodeRef.nodeRef).then(function (response) {
                    $scope.uploadInProgress = false;
                    if (response.status != 200) {
                        alert(response.status.description);
                        return;
                    }
                    if (response.status == 200) {
                        $scope.updateAttachmentsList(response.data.attachments);
                    }
                }, function (response) {
                    $scope.uploadInProgress = false;
                    alert("Add attachments failed. " + response.statusText);
                })
            }
        };

        $scope.updateAttachmentsList = function (attachments) {
            if (!$scope.file_attachments) return;
            for (var i = 0; i < attachments.items.length; i++) {
                attachments.items[i].thumbnailsLink = AlfrescoService.FILE_PATH + attachments.items[i].thumbnails + '&alf_ticket=' + AuthorizationService.getAlfrescoTicket();
            }
            var newAttachments = $scope.file_attachments.items.concat(attachments.items);
            $scope.file_attachments.items = newAttachments;
        };

        $scope.removeAttachment = function (file) {

            $scope.helpers.uiBlocks('#attachments-block', 'state_loading');

            AlfrescoService.deleteNode(file.nodeRef).then(function (response) {
                if (response.status === 200) {
                    var deletedNode = response.data.results[0].nodeRef;
                    for (var i = 1; i < $scope.file_attachments.items.length; i++) {
                        if ($scope.file_attachments.items[i].nodeRef === deletedNode) {
                            var deletedAttachment = $scope.file_attachments.items[i];
                            $scope.file_attachments.items.splice(i, 1);
                            if (deletedAttachment.isChecked) {
                                var fileToOpen = $scope.file_attachments.items[0];
                                $scope.openedFiles--;
                                if ($scope.openedFiles != 0) {
                                    for (var i = 1; i < $scope.file_attachments.items.length; i++) {
                                        if ($scope.file_attachments.items[i].isChecked) {
                                            fileToOpen = $scope.file_attachments.items[i];
                                            break;
                                        }
                                    }
                                }
                                $scope.resetSplitView();
                                fileToOpen.isChecked = false;
                                $scope.openAttachment(fileToOpen);
                            }
                            break;
                        }
                    }
                } else {
                    alert('Server error');
                }
                $scope.helpers.uiBlocks('#attachments-block', 'state_normal');
            });
        };

        $scope.showConfirmDialog = function (file) {

            $scope.fileToRemove = file;
            $('#confirm-removing-modal').modal('toggle');
        };


        $scope.assignWorkflow = function (file, user, workflow) {

            $scope.helpers.uiBlocks('#assignWorkflow', 'state_loading');

            workflow.nodeRef = file.nodeRef;

            AlfrescoService.assignWorkflow(workflow).then(function () {

                AlfrescoService.getAssignedFiles();

                $scope.helpers.uiBlocks('#assignWorkflow', 'state_normal');

                alert("State of workflow was changed successfully");
            });
        };

        $scope.goBack = function () {
            if (!$scope.back_point) {
                return
            }
            if ($scope.back_point === 'workflow') {
                $state.go('tasks');
            } else if ($scope.back_point.startsWith('request')) {
                var request = $scope.back_point.substring($scope.back_point.indexOf(':') + 1, $scope.back_point.length);
                $state.go('search', {request: request});
            } else if ($scope.back_point.startsWith('mydocs')) {
                var folder = $scope.back_point.substring($scope.back_point.indexOf(':') + 2, $scope.back_point.length - 1);
                $state.go('mydocs', {folder: folder});
            } else if ($scope.back_point.startsWith('docs')) {
                var folder = $scope.back_point.substring($scope.back_point.indexOf(':') + 2, $scope.back_point.length - 1);
                $state.go('docs', {folder: folder});
            }
        };

        $scope.report = {};
        $scope.reportDocument = function (isValid) {
            $scope.reportFormSubmitted = true;
            if (!isValid) return;
            $scope.report.type = "document";
            $scope.report.doc_url = $location.absUrl();
            $scope.report.doc_filename = $scope.current_nodeRef.name;

            $scope.reportFormSubmitting = true;
            APIService.post('/reporting', $scope.report).then(function (response) {
                $scope.reportFormSubmitting = false;
                if (response === undefined) return;
                if (response.s === 'f') {
                    $scope.reportFormFailed = true;
                    $scope.error_m = response.m;
                    return;
                }
                $scope.reportFormFailed = false;
                $scope.report.comment = '';
                jQuery('#report-document-modal').modal('hide');
            });
        };

        $scope.goToOlderFile = function() {
          var directoryFiles = JSON.parse($window.localStorage.directoryFiles);
          var currentNode = $scope.current_nodeRef;
          var currentFileIndex = directoryFiles.findIndex(function(element) {
            return currentNode.nodeRef == element.node.nodeRef;
          });
          if (currentFileIndex > 0) {
            $scope.openFile(directoryFiles[currentFileIndex - 1].node.nodeRef);
          }
        };

        $scope.goToNewerFile = function() {
          var directoryFiles = JSON.parse($window.localStorage.directoryFiles);
          var currentNode = $scope.current_nodeRef;
          var currentFileIndex = directoryFiles.findIndex(function(element) {
            return currentNode.nodeRef == element.node.nodeRef;
          });
          if (currentFileIndex < directoryFiles.length - 1) {
            $scope.openFile(directoryFiles[currentFileIndex + 1].node.nodeRef);
          }
        };

        $scope.initBackButton = function () {
            if (!$scope.back_point) {
                return
            }
            if ($scope.back_point === 'workflow') {
                $scope.back_button_message = 'Waiting for review';
            } else if ($scope.back_point.startsWith('request')) {
                $scope.back_button_message = 'Back to search results';
            } else if ($scope.back_point.startsWith('mydocs') || $scope.back_point.startsWith('docs')) {
                var path = $scope.back_point.substring($scope.back_point.indexOf(':') + 2, $scope.back_point.length - 1);
                var parentFolder = path.substring(path.lastIndexOf('/') + 1, path.length);
                if (parentFolder.length > 20){
                    parentFolder = parentFolder.substring(0, 17) + '...';
                }
                $scope.back_button_message = parentFolder;
            }
        };

        $scope.toggleFullScreen = function () {
            $scope.helpers.uiBlocks('#block_split_view', 'fullscreen_toggle');
        };

        $scope.openReportDocumentModal = function () {
            jQuery('#report-document-modal').modal('show');
        };

        $scope.currentFileAttachmentDirectory = 'alfresco/user/home';
        $scope.attachedFiles = [];
        $scope.loadFileAttachments = function(path) {

            $scope.currentFileAttachmentDirectory = path || 'alfresco/user/home';
            $scope.nodes = [];
            AlfrescoService.getFileAttachments($scope.currentFileAttachmentDirectory).then(function (results) {
                $scope.nodes = results.data.data.items;
                $scope.nodes.forEach(function (node, index, array) {
                  if ($.grep($scope.attachedFiles, function (e) {
                      return e.nodeRef == node.nodeRef;
                  }).length > 0) {
                      node.added = true;
                  } else {
                      node.added = false;
                  }
                });
            });
        };

        $scope.openAttachmentsModal = function() {
            if (!jQuery('#modal-file-attachments').data('loaded')) {
              jQuery('#modal-file-attachments').data('loaded', true);
              jQuery('#modal-file-attachments').on('hidden.bs.modal', function () {
                  // $scope.clearSignature();
              });
              jQuery('#modal-file-attachments').on('shown.bs.modal', function () {
                  $scope.loadFileAttachments();
              });
            }
            jQuery('#modal-file-attachments').modal('show');
        };

        $scope.chooseDirectory = function(node) {
          if (node.isContainer) {
            $scope.loadFileAttachments(node.nodeRef.replace(':/', ''));
          } else {
            $scope.attachFile(node);
          }
        };

        $scope.attachFile = function(file) {
          if ($scope.attachedFiles.indexOf(file) < 0) {
            $scope.attachedFiles.push(file);
            file.added = true;
          }
        };

        $scope.uncheckAttachment = function(file) {
            $scope.attachedFiles.splice($scope.attachedFiles.indexOf(file), 1);
            file.added = false;
        };

        $scope.saveAttachments = function() {
          var target = $scope.current_nodeRef.nodeRef;
          var attachments = $scope.attachedFiles.map(function (file) {
              return file.nodeRef;
          });
          $scope.uploadInProgress = true;
          AlfrescoService.saveFileAttachments(target, attachments).then(function(result) {
              $scope.uploadInProgress = false;
              if (result.status) {
                alert(result.status.description);
                return;
              }
              if (result.code == 200) {
                  $scope.attachedFiles = [];
                  $scope.updateAttachmentsList(result.attachments);
              }
          }, function(result) {
            $scope.uploadInProgress = false;

            alert("Save attachments failed.");
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

}]).directive("assignworkflow", function () {
    return {
        restrict: 'E',
        templateUrl: "assets/directive/workflow/assign-workflow.html"
    }
}).directive("properties", function () {
    return {
        restrict: 'E',
        templateUrl: "assets/directive/viewer/properties.html"
    }
}).directive("viewer", function () {
    return {
        restrict: 'E',
        templateUrl: "assets/directive/viewer/viewer.html"
    }
}).directive("attachments", function () {
    return {
        restrict: 'E',
        templateUrl: "assets/directive/attachments/attachments.html"
    }
});
