
var Inheritable = require('./inheritable'),
    Vow = require('vow'),
    fulfill = require('./fulfill');

/**
 * Model attribute
 * @class Attribute
 * @extends Inheritable
 */
var Attribute = Inheritable.inherit(/** @lends Attribute.prototype */{

    /**
     * @param {*} initValue
     */
    __constructor: function (initValue) {
        var setValue;
        this._cachBranches = {};
        this._cachIsSetBranches = {};
        this.DEFAULT_BRANCH = 'DEFAULT_BRANCH';
        this.PREVIOUS_BRANCH = 'PREVIOUS_BRANCH';
        if (initValue === undefined || initValue === null) {
            this._isSet = false;
            setValue = this._callOrGetDefault();
        } else {
            this._isSet = true;
            setValue = initValue;
        }
        this.value = this._toAttributeValue(setValue);
        this.commit();
    },

    /**
     * check if attribute was set
     * @param  {string} attributeName
     * @return {Boolean}
     */
    isSet: function () {
        return this._isSet;
    },

    /**
     * set attribute to default value
     * @param  {string} attributeName
     */
    unset: function () {
        this.set(this._callOrGetDefault());
        this._isSet = false;
    },

    /**
     * check if attribute is valid
     * @abstract
     * @return {Promise}
     */
    validate: function () {
        var error = this.getValidationError();
        if (!error) {
            return fulfill(true);
        } else {
            return Vow.reject(error);
        }
    },

    /**
     * Helper method for attribute validation.
     * Attribute is not valid if it will return non-falsy value
     * @abstract
     * @returns {*}
     */
    getValidationError: function () { },

    /**
     * return serializable value of attribute
     * @return {*}
     */
    toJSON: function () {
        return this.get();
    },

    /**
     * check value to be equal to attribute value
     * @param  {*}  value
     * @return {Boolean}
     */
    isEqual: function (value) {
        return this.value === this._toAttributeValue(value);
    },

    /**
     * check if attribute was changed after last commit
     * @prop {string} [branch=DEFAULT_BRANCH]
     * @return {Boolean}
     */
    isChanged: function (branch) {
        branch = branch || this.DEFAULT_BRANCH;
        return !this.isEqual(this._cachBranches[branch]);
    },

    /**
     * revert attribute value to initial or last commited
     * @prop {string} [branch=DEFAULT_BRANCH]
     */
    revert: function (branch) {
        branch = branch || this.DEFAULT_BRANCH;
        if (!this.isEqual(this._cachBranches[branch])) {
            this.commit(this.PREVIOUS_BRANCH);
            this.value = this._cachBranches[branch];
            this._isSet = this._cachIsSetBranches[branch];
            this._emitChange();
        }
    },

    /**
     * prevent current value to be rolled back
     * @prop {string} [branch=DEFAULT_BRANCH]
     * @return {boolean}
     */
    commit: function (branch) {
        var changed;
        branch = branch || this.DEFAULT_BRANCH;
        changed = !this.isEqual(this._cachBranches[branch]);

        if (changed) {
            this._cachBranches[branch] = this.value;
            this._cachIsSetBranches[branch] = this._isSet;
            this._emitCommit(branch);
        }

        return changed;
    },

    /**
     * @param {string} [branch=DEFAULT_BRANCH]
     * @returns {*}
     */
    getLastCommitted: function (branch) {
        branch = branch || this.DEFAULT_BRANCH;
        return this._fromAttributeValue(this._cachBranches[branch]);
    },

    /**
     * @returns {*}
     */
    previous: function () {
        return this.getLastCommitted(this.PREVIOUS_BRANCH);
    },

    /**
     * set attribute value
     * @param {*} value
     */
    set: function (value) {
        if (!this.isEqual(value)) {
            if (value === null) {
                this.unset();
            } else {
                this.commit(this.PREVIOUS_BRANCH);
                this.value = this._toAttributeValue(value);
                this._isSet = true;
                this._emitChange();
            }
        }
    },

    /**
     * get attribute value
     * @return {*}
     */
    get: function () {
        if (arguments.length > 0) {
            throw new Error('Attribute.get() supports no arguments');
        }
        return this._fromAttributeValue(this.value);
    },

    /**
     * Convert value to attribute type
     * @abstract
     * @prop {*} value
     * @return {*}
     */
    _toAttributeValue: function () {
        throw new Error('Not implemented');
    },

    /**
     * @deprecated
     * @returns {*}
     */
    parse: function () {
        return this._toAttributeValue.apply(this, arguments);
    },

    /**
     * @param {*} value
     * @returns {*}
     */
    _fromAttributeValue: function (value) {
        return value;
    },

    /**
     * Calculate new attribute value
     * @function
     * @name Attribute#calculate
     * @return {Promise<{*}>|*} attribute value
     */

    /**
     * Change other attributes value from  current attribute
     * @function
     * @name Attribute#amend
     */
    _emitChange: function () {
        this.model.calculate();
    },

    /**
     * @param {String} [branch=DEFAULT_BRANCH]
     */
    _emitCommit: function (branch) {
        branch = branch || this.DEFAULT_BRANCH;
        var eventString = (branch !== this.DEFAULT_BRANCH ? branch + ':' : '') + 'commit:' + this.name;
        this.model.trigger(eventString);

    },

    _callOrGetDefault: function () {
        return typeof this.default === 'function' ? this.default() : this.default;
    }

}, {

    ValidationError: (function () {

        /**
         * @param {String} message
         */
        var ValidationError = function (message) {
            this.name = 'AttributeValidationError';
            this.message = message;
            Error.call(this);
            if (Error.captureStackTrace) {
                Error.captureStackTrace(this, this.constructor);
            } else {
                this.stack = (new Error()).stack;
            }
        };
        ValidationError.prototype = Object.create(Error.prototype);
        ValidationError.prototype.constructor = ValidationError;
        return ValidationError;
    })()
});

module.exports = Attribute;
