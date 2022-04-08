(function() {

    $('#pageNumberBox').keypress(function (e) {
        if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
            return false;
        }
    });

    var initAnnot = Tools.SignatureCreateTool.prototype.initAnnot;
    Tools.SignatureCreateTool.prototype.initAnnot = function() {
        // changes the signature's stroke color to orange
        initAnnot.apply(this, arguments);
        this.freeHandAnnot.StrokeColor = new Annotations.Color(255, 165, 0);
    };

    $(document).on('viewerLoaded', function() {
        // an example of storing the default signature information in localStorage
        // if you store a signature as default and then refresh the sample the signature you saved will exist as the default
        var signatureTool = readerControl.toolModeMap['AnnotationCreateSignature'];
        if (localStorage.defaultSignature) {
            signatureTool.initDefaultSignature(JSON.parse(localStorage.defaultSignature));
        }

        signatureTool.on('saveDefault', function(e, paths) {
            // when the user saves a signature as the default persist the information to localStorage
            localStorage.defaultSignature = JSON.stringify(paths);
        });
    });

    $(document).on('documentLoaded', function() {
        readerControl.setToolMode('Pan');
    });

})();
