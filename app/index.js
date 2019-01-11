import $ from 'jquery';
import BpmnModeler from 'bpmn-js/lib/Modeler';

import propertiesPanelModule from 'bpmn-js-properties-panel';
import propertiesProviderModule from 'bpmn-js-properties-panel/lib/provider/camunda';
import camundaModdleDescriptor from 'camunda-bpmn-moddle/resources/camunda';
import sharedPropertiesProviderModule from './provider/mapping';
import mappingModdleDescriptor from './descriptors/mapping';


import templates from './elementTemplates/templates';

import {
  debounce
} from 'min-dash';

// import customTranslate from './customTranslate/customTranslate';

// Our custom translation module
// We need to use the array syntax that is used by bpmn-js internally
// 'value' tells bmpn-js to use the function instead of trying to instantiate it
// var customTranslateModule = {
//   translate: [ 'value', customTranslate ]
// };

import diagramXML from '../resources/newDiagram.bpmn';


var container = $('#js-drop-zone');

var canvas = $('#js-canvas');

var bpmnModeler = new BpmnModeler({
  container: '.canvas',
  propertiesPanel: {
    parent: '#js-properties-panel'
  },
  additionalModules: [
    // customTranslateModule,
    propertiesPanelModule,
    // propertiesProviderModule,
    sharedPropertiesProviderModule
  ],
  elementTemplates: templates,
  moddleExtensions: {
    camunda: camundaModdleDescriptor,
    mapping: mappingModdleDescriptor
  }
});

function createNewDiagram() {
  openDiagram(diagramXML);
}

function openDiagram(xml) {

  bpmnModeler.importXML(xml, function(err) {

    if (err) {
      container
        .removeClass('with-diagram')
        .addClass('with-error');

      container.find('.error pre').text(err.message);

      console.error(err);
    } else {
      container
        .removeClass('with-error')
        .addClass('with-diagram');
    }


  });
}

function saveSVG(done) {
  bpmnModeler.saveSVG(done);
}

function saveDiagram(done) {

  bpmnModeler.saveXML({ format: true }, function(err, xml) {
    done(err, xml);
  });
}

function deployDiagram(done) {
  bpmnModeler.saveXML({ format: true }, function (err, xml) {
    done(err, xml);
  });
}

function registerFileDrop(container, callback) {

  function handleFileSelect(e) {
    e.stopPropagation();
    e.preventDefault();

    var files = e.dataTransfer.files;

    var file = files[0];

    var reader = new FileReader();

    reader.onload = function(e) {

      var xml = e.target.result;

      callback(xml);
    };

    reader.readAsText(file);
  }

  function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();

    e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }

  container.get(0).addEventListener('dragover', handleDragOver, false);
  container.get(0).addEventListener('drop', handleFileSelect, false);
}


////// file drag / drop ///////////////////////

// check file api availability
if (!window.FileList || !window.FileReader) {
  window.alert(
    'Looks like you use an older browser that does not support drag and drop. ' +
    'Try using Chrome, Firefox or the Internet Explorer > 10.');
} else {
  registerFileDrop(container, openDiagram);
}

// bootstrap diagram functions

$(function() {

  var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
  };

  function loadDiagram(processId) {

    console.log( "ready!"+processId);
    if(processId!=null){
      var xml;
      $("#loader").show();
      $.ajax({
        url: ipURLProcess+'/process-definition/'+processId+'/xml',
        processData: false,
        contentType: false,
        type: 'GET',
        success: function ( data ) {
          xml=data.bpmn20Xml;
          console.log("xml >> >> >>"+xml);
          
          var reader = new FileReader();

          reader.onload = function (e) {
            var temp = e.target.result;
            openDiagram(temp);
          };
          
          var blob = new Blob([xml], {type: 'application/xml'});

          reader.readAsText(blob);
          $("#loader").hide();
        },
        error:function(){
          $("#js-drop-zone").hide();
          $("#loader").hide();
          $("#error").show();
        }
      });
    }
  }

  //Check if there is a processName query parameter
  var processName = getUrlParameter('processName');
  if(processName !== null) {
	  loadDiagram(processName);
  }

  $('#js-create-diagram').click(function(e) {
    e.stopPropagation();
    e.preventDefault();

    createNewDiagram();
  });

  var downloadLink = $('#js-download-diagram');
  var downloadSvgLink = $('#js-download-svg');
  var deployLink = $('#js-deploy-diagram');

  $('.buttons a').click(function(e) {
    if (!$(this).is('.active')) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  function setEncoded(link, name, data) {
    var encodedData = encodeURIComponent(data);

    if (data) {
      //JMH - 28-10-2018 - Modified exporting behaviour
      var xmlDoc = $.parseXML(data);
      $(xmlDoc.getElementsByTagName("bpmn2:scriptTask")).each(function(el) {
        var temp2 = this.attributes['camunda:resource'] ? this.attributes['camunda:resource'].value : null;
        $(this).removeAttr('camunda:resource');
      
       
        // Add the new bpmn2:script tag
        if (temp2) {
			
			// Remove any previous bpmn2:script tags
			var temp3 = this.getElementsByTagName("bpmn2:script");
			$(temp3).each(function(el) {
			  console.log(this.parentNode.removeChild(this));
			})
			
          var temp3 = document.createElement("bpmn2:script");
          temp3.innerHTML = temp2;
      
          this.appendChild(temp3);
        } else {
          //var temp3 = document.createElement("bpmn2:script");
          //temp3.innerHTML = '';
      
          //this.appendChild(temp3);
        }
      });

      function xmlToString(xmlData) { 
          var xmlString;
          //IE
          if (window.ActiveXObject){
              xmlString = xmlData.xml;
          }
          // code for Mozilla, Firefox, Opera, etc.
          else{
              xmlString = (new XMLSerializer()).serializeToString(xmlData);
          }
          return xmlString;
      }

      /*
      link.addClass('active').attr({
        'href': 'data:application/bpmn20-xml;charset=UTF-8,' + encodedData,
        'download': name
      });
      */
      encodedData = encodeURIComponent(xmlToString(xmlDoc));

      link.addClass('active').attr({
        'href': 'data:application/bpmn20-xml;charset=UTF-8,' + encodedData,
        'download': name
      });
    } else {
      link.removeClass('active');
    }
  }

  function showSnackbar() {
    let snackbar = $('#snackbar');
    snackbar.addClass('show');
    setTimeout(() => { snackbar.removeClass('show'); }, 3000);
  }

  function deployFile(link, name, data) {
    if (data) {
      //JMH - 28-10-2018 - Modified exporting behaviour
      var xmlDoc = $.parseXML(data);
      $(xmlDoc.getElementsByTagName("bpmn2:scriptTask")).each(function(el) {
        var temp2 = this.attributes['camunda:resource'] ? this.attributes['camunda:resource'].value : null;
        $(this).removeAttr('camunda:resource');
      
       
        // Add the new bpmn2:script tag
        if (temp2) {
			
		 // Remove any previous bpmn2:script tags
        var temp3 = this.getElementsByTagName("bpmn2:script");
        $(temp3).each(function(el) {
          console.log(this.parentNode.removeChild(this));
        })
		
          var temp3 = document.createElement("bpmn2:script");
          temp3.innerHTML = temp2;
      
          this.appendChild(temp3);
        } else {
          //var temp3 = document.createElement("bpmn2:script");
          //temp3.innerHTML = '';
      
          //this.appendChild(temp3);
        }
      });

      function xmlToString(xmlData) { 
          var xmlString;
          //IE
          if (window.ActiveXObject){
              xmlString = xmlData.xml;
          }
          // code for Mozilla, Firefox, Opera, etc.
          else{
              xmlString = (new XMLSerializer()).serializeToString(xmlData);
          }
          return xmlString;
      }

      /*
      link.addClass('active').attr({
        'href': 'data:application/bpmn20-xml;charset=UTF-8,' + encodedData,
        'download': name
      });
      */
      var xmlString = xmlToString(xmlDoc);

      link.addClass('active');
      link.unbind('click').click(function() {
        var bpmnName = prompt("Please enter bpmn file name");

        if (bpmnName != null) {
          var bpmn = new Blob([xmlString], {type: 'application/octet-stream'}, name);
          bpmn.name = name;
        
          var form = new FormData();
          form.append('deployment-name', bpmnName);
          form.append('enable-duplicate-filtering', true);
          form.append( 'deployment-source', 'local');
          form.append( 'data', new File([bpmn],"deployment.bpmn",{type: "application/xml"}));
          
          $.ajax({
            url: ipURLProcess+'/deployment/create',
            data: form,
            processData: false,
            contentType: false,
            type: 'POST',
            success: function ( data ) {
              showSnackbar();
            }
          });
        }
        return false;
      });
    } else {
      link.removeClass('active');
    }
  }

  var exportArtifacts = debounce(function() {

    deployDiagram(function (err, xml) {
      // console.log(">>>> Deploy", xml);
      // process=xml;
      // deployLink.addClass('active');
      deployFile(deployLink, 'Test.bpmn', err ? null : xml);
    });

    saveSVG(function(err, svg) {
      setEncoded(downloadSvgLink, 'diagram.svg', err ? null : svg);
    });

    saveDiagram(function(err, xml) {
      setEncoded(downloadLink, 'diagram.bpmn', err ? null : xml);
    });
  }, 500);

  bpmnModeler.on('commandStack.changed', exportArtifacts);
});
