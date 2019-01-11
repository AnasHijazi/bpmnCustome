import inherits from 'inherits';

import PropertiesActivator from 'bpmn-js-properties-panel/lib/PropertiesActivator';

import CamundaPropertiesProvider from 'bpmn-js-properties-panel/lib/provider/camunda/CamundaPropertiesProvider'

var mappingProps = require('./parts/mappingProps');

var formProps = require('./parts/FormProps');

// Create the custom mapping tab
function createMappingTabGroups(element, elementRegistry, moddle, modeling) {
    // Create a group called "Mapping".
    var mappingGroup = {
        id: 'custom-mapping',
        label: 'Custom Mapping',
        entries: []
    };

    // Add the spell props to the Mapping group.
    mappingProps(mappingGroup, element, elementRegistry, moddle, modeling);

    return [
        mappingGroup
    ];
}

export default function SharedPropertiesProvider(eventBus, bpmnFactory, elementRegistry, elementTemplates, translate, moddle, modeling) {
    PropertiesActivator.call(this, eventBus);
	
	console.log(">> >>> >>>> >>"+formProps);
    var camunda = new CamundaPropertiesProvider(eventBus, bpmnFactory, elementRegistry, elementTemplates, translate);
    this.getTabs = function(element) {
         // The "mapping" tab
        var mappingTab = {
            id: 'mapping',
            label: 'Mapping',
            groups: createMappingTabGroups(element, elementRegistry, moddle, modeling)
        };

        var array =[];
		camunda.getTabs(element).forEach(function(element) {
			
		   //check if forms tab
		   if(element.id=='forms'){
				if(element.groups[0].entries !=null && element.groups[0].entries.length>=1){
				
				//remove text filed form key
				element.groups[0].entries.shift();
				
				//add dropdownlist
				formProps(element.groups,element)
				}
		   }
		   array.push(element);
		});
		
        array.push(mappingTab);
        return array;
    }
}

SharedPropertiesProvider.$inject = [
    'eventBus', 'bpmnFactory', 'elementRegistry', 'elementTemplates', 'translate', 'moddle', 'modeling'
];
  
inherits(SharedPropertiesProvider, PropertiesActivator);