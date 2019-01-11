import entryFactory from 'bpmn-js-properties-panel/lib/factory/EntryFactory';
var getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;
var cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper');
import $ from 'jquery';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';


module.exports = function(group, element) {

  //[FormKey] form key text input field
  group[0].entries.unshift(entryFactory.selectBox({
    id: 'form-key',
    label: 'Form Key',
    selectOptions: function selectOptions(element, node) {
      var arrValues = [];
	   arrValues.push({ name: "--Select--", value: "" });
      $.ajax({
        url: ipURLForms+"/forms/formsname",
        method: "GET",
        success: function success(data) {

          data.result.forEach(function (formName) {
            arrValues.push({ name: formName, value: formName });
          });
        },
        async: false
      });
      return arrValues;
    },
    setControlValue: true,
    modelProperty: 'formKey',
    emptyParameter: false,

    get: function get(element, node) {
      var bo = getBusinessObject(element);

      return {
        formKey: bo.get('camunda:formKey')
      };
    },

    set: function set(element, values, node) {
      var bo = getBusinessObject(element),
          formKey = values.formKey || undefined;

      return cmdHelper.updateBusinessObject(element, bo, { 'camunda:formKey': formKey });
    },

    disabled: function disabled(element, node) {
      //TODO Disabled condition
    }
  }));
  
  var linkEntry = entryFactory.link({
  id: 'createform',
  label:'Create Form',
  getClickableElement: function(element, node, event) { 
	console.log("^^^^");
	window.open(ipURLFormBuilder, '_blank');
  },
  showLink: function(element, node) {
  }
});

group[0].entries.push(linkEntry);

}