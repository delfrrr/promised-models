/**
 * Nested model attribute
 */
var Attribute = require('../attribute'), ModelAttribute, ModelAttributeStatic;

/**
 * Attribute with nested model
 * @class {Attribute}
 */
ModelAttribute = Attribute.inherit({

    /**
     * @override {Attribute}
     */
    __constructor: function () {
        this.LISTEN_BRANCH = 'LISTEN_BRANCH';
        this.__base.apply(this, arguments);
        this._initModel();
    },

    /**
     * @override {Attribute}
     */
    isSet: function () {
        throw new Error('.isSet is not implemented for nested models');
    },

    /**
     * @override {Attribute}
     */
    unset: function () {
        throw new Error('.unset is not implemented for nested models');
    },

    /**
     * nested model ready
     * @return {Promise}
     */
    ready: function () {
        return this.value.ready();
    },

    /**
     * @override {Attribute}
     */
    validate: function () {
        return this.value.validate();
    },

    /**
     * @override {Attribute}
     */
    isChanged: function (branch) {
        return this.value.isChanged(branch);
    },

    /**
     * @override {Attribute}
     */
    commit: function (branch) {
        return this.value.commit(branch);
    },

    /**
     * @override {Attribute}
     */
    revert: function (branch) {
        return this.value.revert(branch);
    },

    /**
     * @abstarct
     * @type {Model}
     */
    modelType: null,

    /**
     * @override {Attribute}
     */
    toJSON: function () {
        return this.value.toJSON();
    },
    
    /**
     * @override {Attribute}
     */
    isEqual: function (value) {                                                                                         
        return this.value === value;                                                                                    
    },                                                                                                                  
                                                                                                                        
    /**                                                                                                                 
     * @override {Attribute}
     * set attribute value                                                                                              
     * @param {*} value                                                                                                 
     */                                                                                                                 
    set: function (value) {                                                                                             
        if (value === null) {                                                                                           
            this.unset();                                                                                               
        } else if (!this.isEqual(value)) {                                                                              
            if (value instanceof this.modelType) {                                                                      
                this.value = value;                                                                                     
            } else {                                                                                                    
                this.value.set(value);                                                                                  
            }                                                                                                           
            this._isSet = true;                                                                                         
            this._emitChange();                                                                                         
        }                                                                                                               
    },                                   

    /**
     * @override {Attribute}
     */
    parse: function (value) {
        if (value instanceof this.modelType) {
            return value;
        } else {
            return new this.modelType(value);
        }
    },

    _onModelChange: function () {
        this._emitChange(true);
    },

    /**
     * @override
     * @param  {Boolean} [fromNestedModel=true] do not init listeners
     */
    _emitChange: function (fromNestedModel) {
        if (!fromNestedModel) {
            //model changed we need to subscribe again
            this._initModel();
        }
        this.__base();
    },

    /**
     * bind to model events
     */
    _initModel: function () {
        var prevValue = this._cachBranches[this.LISTEN_BRANCH];
        if (prevValue) {
            //unsubscribing
            prevValue.un('calculate', this._onModelChange, this);
        }
        this.value.on('calculate', this._onModelChange, this);
        this.commit(this.LISTEN_BRANCH);
    }

});

/**
 * Static constructor for ModelAttribute
 * @class
 */
ModelAttributeStatic = function (value) {
    if (this instanceof ModelAttributeStatic) {
        return new ModelAttribute(value);
    } else {
        return ModelAttribute.inherit({
            modelType: value
        });
    }
};
ModelAttributeStatic.inherit = ModelAttribute.inherit.bind(ModelAttribute);
module.exports = ModelAttributeStatic;
