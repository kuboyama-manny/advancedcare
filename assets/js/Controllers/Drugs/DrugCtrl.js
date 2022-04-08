
// Drugs List Controller
angular.module('app').controller('DrugCtrl', ['$scope', 'APIService',
    function ($scope, APIService) {

        $scope.formulary_id = "";
        $scope.drug_key = "";
        $scope.formulary_list = [];

        $scope.searchDrugs = function () {
            APIService.get('/drug?q=' + $scope.drug_key + '&formulary_id=' + $scope.formulary_id).then(function (response) {
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return false;
                }
                $scope.drugs_list = response.result.history ? response.result.history : response.result;
                if (response.result.formularies !== undefined && $scope.formulary_list.length == 0)
                    $scope.formulary_list = response.result.formularies;
            });
        };
        $scope.searchDrugs();

        $scope.changeFormulary = function () {
            if ($scope.formulary_id) {
                $scope.searchDrugs();
            }
        };

        $scope.searchDrugProducts = function () {
            $scope.drug_products_list = [];
            $scope.drugFormSubmitted = false;
            $scope.editing_drug_product = {};
            $scope.saveFailed = false;
            $scope.saveSuccess = false;

            if (!$scope.drug_id) return;
            APIService.get('/drug?id=' + $scope.drug_id).then(function (response) {
                if (response === undefined) return;
                if (response.s && response.s === 'f') {
                    return false;
                }
                $scope.drug_products_list = response.result.products;
            });
        };

        $scope.drugProductChosen = function () {
            if ($scope.drug_product) {
                $scope.editing_drug_product = angular.copy($scope.drug_product);
            }
        }

        $scope.save = function (isValid) {

            if (!isValid) {
                $scope.saveFailed = true;
                $scope.drugFormSubmitted = true;
                $scope.error_m = 'required_fields_missing';
                return false;
            }

            $scope.saveFailed = false;
            $scope.saveSuccess = false;

            if ($scope.editing_drug_product) {
                // Update Patient
                $scope.helpers.uiBlocks('#drug-block', 'state_loading');
                APIService.put('/drug?id=' + $scope.editing_drug_product.id, $scope.editing_drug_product).then(function (response) {
                    $scope.helpers.uiBlocks('#drug-block', 'state_normal');
                    if (response === undefined) return;
                    if (response.s === 'f') {
                        $scope.saveFailed = true;
                        $scope.error_m = response.m;
                        return;

                    } else {
                        $scope.saveSuccess = true;
                        return;
                    }
                });
            }
        };
    }
]);
