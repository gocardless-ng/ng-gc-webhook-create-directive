(function(){ 'use strict';
'use strict';

angular.module('gc.webHookCreateController', [
  'ngRoute',
  'gc.webHookModel',
  'gc.alertService'
])
.controller('WebHookCreateController', [
  '$scope', '$route', 'AlertService', 'WebHookModel',
  function WebHookCreateController(
    $scope, $route, AlertService, WebHookModel) {

    $scope.webHookModel = WebHookModel.create();
    $scope.webHook = $scope.webHookModel.scope();

    // set defaults
    _.extend($scope.webHook.form, ($scope.getDefaults() || {}));

    function isSubmitting(value) {
      $scope.isSubmitting = value;
    }

    $scope.createWebHook = function createWebHook() {
      isSubmitting(true);

      var onCreatePromise = $scope.onCreate($scope.webHookModel.serialize());

      if (!onCreatePromise || !_.isFunction(onCreatePromise.then)) {
        throw new Error('onCreate must return a promise');
      }

      onCreatePromise
        .then(function resolve() {
          AlertService.success(
            'Sent web hook. Your web hook will be available soon.'
          );
          $route.reload();
        }, function reject(response) {
          isSubmitting(false);
          $scope.formErrors = response.data && response.data.errors;
          AlertService.error('Failed to send web hook. Please try again.');
        });
    };

  }
]);

'use strict';

angular.module('gc.webHookCreateDirective', [
  'gc.webHookCreateController',
  'gc.inputErrorDirective',
  'webhook-create-template.html'
]).directive('webHookCreate', [
  function webHookCreateDirective() {

    return {
      restrict: 'E',
      controller: 'WebHookCreateController',
      templateUrl: 'webhook-create-template.html',
      replace: true,
      scope: {
        getDefaults: '&form',
        onCreate: '&'
      }
    };

  }
]);

'use strict';

angular.module('gc.webHookModel', [
])
.factory('WebHookModel', [
  '$rootScope',
  function WebHookModelFactory($rootScope) {

    var RESOURCE_TYPES = {
      BILL: 'bill',
      SUBSCRIPTION: 'subscription',
      PRE_AUTHORIZATION: 'pre_authorization'
    },

    ACTIONS = {
      CREATED:  'created',
      FAILED: 'failed',
      PAID: 'paid',
      WITHDRAWN: 'withdrawn',
      CHARGEDBACK: 'chargedback',
      REFUNDED: 'refunded',
      RETRIED: 'retried',
      CANCELLED: 'cancelled',
      EXPIRED: 'expired'
    },

    NAMED_RESOURCE_TYPES = [
      { value: RESOURCE_TYPES.BILL, name: 'Bill' },
      { value: RESOURCE_TYPES.SUBSCRIPTION, name: 'Subscription' },
      { value: RESOURCE_TYPES.PRE_AUTHORIZATION, name: 'Pre-authorization' }
    ],

    NAMED_ACTIONS = [
      { value: ACTIONS.CREATED, name: 'Created' },
      { value: ACTIONS.FAILED, name: 'Failed' },
      { value: ACTIONS.PAID, name: 'Paid' },
      { value: ACTIONS.WITHDRAWN, name: 'Withdrawn' },
      { value: ACTIONS.CHARGEDBACK, name: 'Chargedback' },
      { value: ACTIONS.REFUNDED, name: 'Refunded' },
      { value: ACTIONS.RETRIED, name: 'Retried' }
    ],

    LIMIT_ACTIONS = [
      { value: ACTIONS.CANCELLED, name: 'Cancelled' },
      { value: ACTIONS.EXPIRED, name: 'Expired' }
    ];

    function WebHookModel(options) {
      this._scope = {
        RESOURCE_TYPES: RESOURCE_TYPES,
        ACTIONS: ACTIONS
      };
      this.options = options || {};
      this._scope.form = {};
      var _this = this;

      this._scope.isResourceType = function(resource) {
        return _this._scope.form.resource_type.value === resource;
      };

      this._scope.isAction = function(action) {
        return _this._scope.form.action.value === action;
      };

      this.setPristine();
      this._watchResourceType();
    }

    WebHookModel.prototype._watchResourceType = function _watchResourceType() {
      var _this = this;
      $rootScope.$watch(function() {
        return _this._scope.form.resource_type;
      }, function watchResourceType(resourceType, oldResourceType) {
        if (resourceType === oldResourceType) { return; }
        if (resourceType.value === RESOURCE_TYPES.SUBSCRIPTION ||
            resourceType.value === RESOURCE_TYPES.PRE_AUTHORIZATION) {
          _this._scope.actions = LIMIT_ACTIONS;
        } else {
          _this._scope.actions = NAMED_ACTIONS;
        }
        _this._scope.form.action = _this._scope.actions[0];
      });
    };

    WebHookModel.prototype.scope = function scope() {
      return this._scope;
    };

    WebHookModel.prototype.setPristine = function setPristine() {
      var _this = this;

      // should be default web_hook url
      this._scope.form.url = '';
      this._scope.form.resource_id = '';
      this._scope.form.source_id = '';

      this._scope.resourceTypes = NAMED_RESOURCE_TYPES.slice();
      this._scope.form.resource_type = this._scope.resourceTypes[0];

      this._scope.actions = NAMED_ACTIONS.slice();
      this._scope.form.action = _this._scope.actions[0];
    };

    WebHookModel.prototype.serialize = function serialize() {
      var form = _.cloneDeep(this._scope.form);

      var web_hook = {
        action: form.action.value,
        resource_type: form.resource_type.value,
        url: form.url
      };

      if (form.resource_id) {
        web_hook.resource_id = form.resource_id;
      }

      if (this._scope.isResourceType(RESOURCE_TYPES.BILL) && form.source_id) {
        web_hook.source_id = form.source_id;
      }

      return {
        web_hook: web_hook
      };
    };

    return {
      create: function create(options) {
        return new WebHookModel(options);
      }
    };
  }
]);

angular.module('webhook-create-template.html', []).run(['$templateCache', function($templateCache) {
  $templateCache.put('webhook-create-template.html',
    '<div><form ng-submit="createWebHook()" name="webHookForm" novalidate=""><div class="u-padding-Hm u-padding-Ts"><div class="label-meta u-margin-Bs">Web hooks alert your server of asynchronous events (e.g., when a bill is paid). You can find more details in our <a href="https://gocardless.com/docs">documentation</a>.</div><div class="control-group"><div class="control-group__label"><label for="url" class="label">Web hook URL:</label></div><div class="control-group__column"><input type="url" ng-model="webHook.form.url" name="url" id="url" class="input" placeholder="" required=""><div class="error-label" ng-show="form.url.$dirty && form.url.$invalid"><span ng-show="form.url.$error.required">Please specify a url</span></div><input-error errors="formErrors" field="url"></input-error></div></div><div class="control-group"><div class="control-group__label control-group__label--select"><label for="resource_type" class="label">Resource type:</label></div><div class="control-group__column"><select ng-model="webHook.form.resource_type" id="resource_type" name="resource_type" ng-options="i.name for i in webHook.resourceTypes" class="add-plan__select" required=""></select><input-error errors="formErrors" field="resource_type"></input-error></div></div><div class="control-group"><div class="control-group__label"><label for="resource_id" class="label">Resource ID:</label></div><div class="control-group__column"><input type="text" ng-model="webHook.form.resource_id" name="resource_id" id="resource_id" class="input" placeholder="" required=""><input-error errors="formErrors" field="resource_id"></input-error></div></div><div class="control-group" ng-show="webHook.isResourceType(webHook.RESOURCE_TYPES.BILL)"><div class="control-group__label"><label for="source_id" class="label">Source ID:</label></div><div class="control-group__column"><input type="text" ng-model="webHook.form.source_id" name="source_id" id="source_id" class="input" placeholder=""><input-error errors="formErrors" field="source_id"></input-error><div class="label-meta u-margin-Txxs">ID of the parent subscription or pre-authorization - leave blank for a one-off bill</div></div></div><div class="control-group"><div class="control-group__label control-group__label--select"><label for="action" class="label">Action:</label></div><div class="control-group__column"><select ng-model="webHook.form.action" id="action" name="action" ng-options="i.name for i in webHook.actions" class="add-plan__select" required=""></select><input-error errors="formErrors" field="action"></input-error><div class="label-meta u-margin-Txxs"><div ng-if="webHook.isAction(webHook.ACTIONS.CREATED)">This is fired when a bill is created automatically under a subscription. E.g., for a monthly subscription, you will receive this webHook once per month. The bill will be "pending" for several days until it is "paid" or has "failed"</div><div ng-if="webHook.isAction(webHook.ACTIONS.FAILED)">This is fired when a bill could not be debited from a customer\'s account. This is usually because insufficient funds are available. By default, GoCardless will not attempt to take the payment again.</div><div ng-if="webHook.isAction(webHook.ACTIONS.PAID)">This is fired when a bill has successfully been debited from a customer\'s account. It can take up to 5 business days if it\'s the first bill taken from a customer. The cash will be held by GoCardless for the duration of the Merchant\'s holding period, after which it will be "withdrawn" (i.e., paid out) directly into the Merchant\'s registered bank account.</div><div ng-if="webHook.isAction(webHook.ACTIONS.WITHDRAWN)">This is fired when a bill that is being held by GoCardless on behalf of a Merchant is withdrawn (i.e., paid out) into the Merchant\'s bank account. Money should appear in the account no later than 1 business day after the webHook is fired.</div><div ng-if="webHook.isAction(webHook.ACTIONS.CHARGEDBACK)"></div><div ng-if="webHook.isAction(webHook.ACTIONS.REFUNDED)">This is fired when a bill is refunded after having been paid as a result of a chargeback that a customer has filed with their bank under the Direct Debit Guarantee.</div><div ng-if="webHook.isAction(webHook.ACTIONS.RETRIED)"></div><div ng-if="webHook.isAction(webHook.ACTIONS.CANCELLED)"><div ng-if="webHook.isResourceType(webHook.RESOURCE_TYPES.SUBSCRIPTION)">This is fired when a subscription is cancelled by a customer. No further bills will be automatically created under the subscription</div><div ng-if="webHook.isResourceType(webHook.RESOURCE_TYPES.PRE_AUTHORIZATION)">This is fired when a pre-authorization is cancelled by a customer. No further bills can be created under this pre-authorization.</div></div><div ng-if="webHook.isAction(webHook.ACTIONS.EXPIRED)"><div ng-if="webHook.isResourceType(webHook.RESOURCE_TYPES.SUBSCRIPTION)">This is fired when a subscription reaches its expiry date. No further bills will be automatically created under the subscription.</div><div ng-if="webHook.isResourceType(webHook.RESOURCE_TYPES.PRE_AUTHORIZATION)">This is fired when a pre-authorization reaches its expiry date. No further bills can be created under this pre-authorization.</div></div></div></div></div></div><div class="u-padding-Am u-padding-Tn"><input type="submit" class="btn btn--info btn--block" ng-disabled="webHookForm.$invalid || isSubmitting" value="Send web hook"></div></form></div>');
}]);

})();