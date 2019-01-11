var entryFactory = require('bpmn-js-properties-panel/lib/factory/EntryFactory');

var is = require('bpmn-js/lib/util/ModelUtil').is;

module.exports = function(group, element, elementRegistry, moddle, modeling) {
  // only return an entry, if the currently selected element is a start event
  if (is(element, 'bpmn:ScriptTask')) {
    group.entries.push(entryFactory.link({
      id : 'mapping',
      label : 'Map objects',
      hideLink : false,
      description : 'Create the mapping between the task variables and the REST service object',
      getClickableElement: function(e) {
        // Get the task element
        var sequenceFlowElement = elementRegistry.get(e.id);
        // console.log(`Click on task with id: `, sequenceFlowElement.businessObject);
        // Open the modal to create the mapping object
        $("#myModal").modal('show');
        resetData(checkPreviousData);
        $('#save-event').unbind('click');

        function checkPreviousData() {
          $('#myModal').unbind('shown.bs.modal');
          // console.log(`Checking previous data`);
          // Check if there is already inputParameters for this task
          var sequenceFlow = sequenceFlowElement.businessObject;
          if(sequenceFlow.hasOwnProperty('extensionElements') && sequenceFlow.extensionElements) {
            var extensionElements = sequenceFlow.extensionElements;
            checkWholeObject:
            for(var i = 0; i < extensionElements.values.length; i++) {
              var value = extensionElements.values[i];
              if(value.$type === 'camunda:InputOutput') {
                for(var j = 0; j < value.inputParameters.length; j++) {
                  var inputParam = value.inputParameters[j];
                  if(inputParam.name === 'wholeObject') {
                    // console.log(`Reading input param: `, inputParam);
                    $('#myModal').on('shown.bs.modal', function (e) {
                      $.ajax({
                        type: 'GET',
                        url: camundaProxyURL + 'trySelect?id=' + inputParam.value,
                        async:false
                      }).done(function( data ) {
                        fillFlowchart(JSON.parse(data[0].value.replace(/&gt;/g, '>')))
                      });
                    })
                    break checkWholeObject;
                  }
                }
              }
            }
          }
        }

        // When the modal save button is clicked, fill the task business object with the generated mapping object, then close the modal
        $('#save-event').on('click', function(evt) {
          var sequenceFlowElement = elementRegistry.get(e.id);
          // Get the value and remove all white space characters from it
          var mappingJSON = $("#code-block").html().replace(/\r?\n|\r/g,'');
          var wholeObject = $("#whole-object").html().replace(/\r?\n|\r/g,'');

          // console.log(`Adding mapping object to `, e.id);
          var extensionElementsModdle = moddle.create('bpmn:ExtensionElements');

          // Create the input parameter that will contain the mapping JSON
          var inputParameter = moddle.create('camunda:InputParameter', {
            name: 'mappingJSON',
            value: mappingJSON
          });

          // JMH - 24-10-2018 - Commented out below lines to be used inside below ajax call
          // Create the input parameter that will contain the mapping JSON
          // var inputParameter2 = moddle.create('camunda:InputParameter', {
          //   name: 'wholeObject',
          //   value: wholeObject
          // });
          var inputParamsList = [];
          
          // Check if there is already inputParameters for this task
          var sequenceFlow = sequenceFlowElement.businessObject;
          if(sequenceFlow.hasOwnProperty('extensionElements') && sequenceFlow.extensionElements) {
            var extensionElements = sequenceFlow.extensionElements;
            for(var i = 0; i < extensionElements.values.length; i++) {
              var value = extensionElements.values[i];
              if(value.$type === 'camunda:InputOutput') {
                // inputParamsList = value.inputParameters;
                for(var j = value.inputParameters.length - 1; j > -1; j--) {
                  var inputParam = value.inputParameters[j];
                  if(inputParam.name === 'wholeObject' || inputParam.name === 'mappingJSON') {
                    value.inputParameters.splice(j, 1);
                  }
                }
                inputParamsList = value.inputParameters;
                break;
              }
            }
          }
          inputParamsList.push(inputParameter);


          $.ajax({
            type: 'POST',
            url: camundaProxyURL + 'tryInsert',
            data: {"data": wholeObject},
            async:false
          }).done(function( data ) {
            // Create the input parameter that will contain the mapping JSON
            var inputParameter2 = moddle.create('camunda:InputParameter', {
              name: 'wholeObject',
              value: '' + data
            });
            inputParamsList.push(inputParameter2);
          });
          // JMH - 24-10-2018 - Commented out below line to be used inside above ajax call
          // inputParamsList.push(inputParameter2);
  
          var inputOutput = moddle.create('camunda:InputOutput', {
            inputParameters: inputParamsList
          });
          extensionElementsModdle.get('values').push(inputOutput);
          sequenceFlowElement.businessObject['extensionElements'] = extensionElementsModdle;
  
          // Update the task with the new values
          modeling.updateProperties(sequenceFlowElement, {
            extensionElements: extensionElementsModdle
          });

          // Close the modal
          $("#myModal").modal('hide');
        });
        // var mappingJSON = prompt("Please enter the mapping json", "");
        // if (mappingJSON != null) {
        //   console.log(`Adding mapping object to `, e.id);
        //   var sequenceFlowElement = elementRegistry.get(e.id);
        //   var extensionElementsModdle = moddle.create('bpmn:ExtensionElements');
        //   var inputParameter = moddle.create('camunda:InputParameter', {
        //     name: 'mappingJSON',
        //     value: mappingJSON
        //   });
        //   var inputParamsList = [];
          
        //   //Check if there is already inputParameters
        //   var sequenceFlow = sequenceFlowElement.businessObject;
        //   if(sequenceFlow.hasOwnProperty('extensionElements') && sequenceFlow.extensionElements) {
        //     var extensionElements = sequenceFlow.extensionElements;
        //     for(var i = 0; i < extensionElements.values.length; i++) {
        //       var value = extensionElements.values[i];
        //       if(value.$type === 'camunda:InputOutput') {
        //         inputParamsList = value.inputParameters;
        //         break;
        //       }
        //     }
        //   }
        //   inputParamsList.push(inputParameter);
        //   //   var inputParams = sequenceFlow['extensionElements']['values'][0]['inputParameters'];
        //   //   console.log(inputParams);
        //   //   inputParams.push(inputParameter);
        //   //   var temp = inputParams;
        //   //   sequenceFlow['extensionElements'] = null;
        //   // } else {
        //   //   var temp = [];
        //   //   temp.push(inputParameter);
        //   // }
  
        //   var inputOutput = moddle.create('camunda:InputOutput', {
        //     // inputParameters: [inputParameter]
        //     inputParameters: inputParamsList
        //   });
        //   extensionElementsModdle.get('values').push(inputOutput);
        //   sequenceFlowElement.businessObject['extensionElements'] = extensionElementsModdle;
  
        //   modeling.updateProperties(sequenceFlowElement, {
        //     extensionElements: extensionElementsModdle
        //   });
  
        //   console.log(modeling);
        // }
        // console.log(`OUTSIDE PROMPT SCOPE`);
      }
    }));
  }
};