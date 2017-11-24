var fieldIsEmpty = function(fieldName) {
  var fieldValue = $("#" + fieldName).val();
  return fieldValue ? $.trim(fieldValue).length === 0 : true;
};

function autoFormatNumeric(field, e) {
  var charCode = e.which ? e.which : field.keyCode;
  if ((charCode !== 46 && charCode > 31 && (charCode < 48 || charCode > 57)) || (field.value.split('.').length && charCode === 46)) {
    e.preventDefault();
  }
}

var disableClick = function(fieldName) {
  $('#' + fieldName).unbind('click');
  $('#' + fieldName).css('cursor', 'not-allowed');
};

$(document).ready(function() {
  $('#patientRegistration').trigger('reset');
  $("#submitPatientInfo").prop('disabled', false);
  $('#removeProc').prop("disabled", true);
  $(".js-insuranceCov,.js-guardianInfo").hide();

  $("#dob, #telephone").bind('keypress', function(event) {
    autoFormatNumeric(this, event);
  });

  $('#clearPatientInfo').click(function() {
    $('#patientRegistration').trigger('reset');
    $('input,label,select,textarea,radio').removeClass('errorField');
    $('#message').empty().addClass('hidden');
  });

  $("input[name='insuranceCoverage']").change(function() {
    if ($(this).val() === 'Yes') {
      $('.js-insuranceCov').show();
    } else {
      $('.js-insuranceCov').hide();
      $("#healthPlanName, #policyHolderName, #policyNumber, #healthPlanPhoneNumber, #groupNumber, #insuranceComments").val('');
    }
  });

  $("input[name='under18']").change(function() {
    if ($(this).val() === 'Yes') {
      $('.js-guardianInfo').show();
    } else {
      $('.js-guardianInfo').hide();
    }
  });

  $('#typeOfPlan').change(function() {
    if ($(this).val() === 'Other') {
      $('#otherPlan').prop("disabled", false);
    } else {
      $('#otherPlan').prop("disabled", true).val('');
    }
  });

  
  $("#dob").mask("99/99/9999");

  $("#procedure0").autocomplete({
    source: "cfc/manageCQ.cfc?method=getProcedures&returnformat=json",
    minLength: 1,
    select: function(event, ui) {
      $("#procedure0").val(ui.item.CommonName);
    }, // if record not found disable search button
    response: function(event, ui) {
      if (!ui.content.length) {
        var noResult = {
          value: "",
          label: "No results found"
        };
        ui.content.push(noResult);
        $("#submitPatientInfo").prop("disabled", true);
      } else {
        $("#submitPatientInfo").prop("disabled", false);
      }
    }
  });

  $('#procedure0').focusout(function() {
    $("input[name='procedureFacility0']").prop('disabled', true); // Disable all facilities
    var procedure = $('#procedure0').val();
    $.get("cfc/manageCQ.cfc?method=getFacilities&procedure=" + procedure, function(data, status) {
      var jsonArray = $.parseJSON(data);
      for (var i = 0; i < jsonArray.length; i++) {
        $("input[name='procedureFacility0'][value='" + jsonArray[i] + "']").prop("disabled", false);
      };
      $("input[name='procedureFacility0']:not(:disabled):first").prop('checked', true);
    });
  });

});

var clearRequestForm = function() {
  $("input[type=text], textarea").val("");
  $('#DropDownList1').find('option:first').attr('selected', 'selected');
}

var validateRequestForm = function() {
  $("#submitPatientInfo").prop('disabled', true).css('cursor', 'not-allowed');

  var error = false;
  var i;
  var procedures = {};
  $('input,label,select,textarea,radio').removeClass('errorField');
  $('#message').empty().addClass('hidden');

  // validating text fields
  var textFields = ["firstName", "lastName", "address", "city", "zipcode", "country", "telephone", "dob", "procedure0"];
  if ($("input[name='insuranceCoverage']:checked").val() === 'Yes') {
    textFields.push("healthPlanName", "policyHolderName", "policyNumber", "healthPlanPhoneNumber");
  } else {
    textFields = _.without(textFields, "healthPlanName", "policyHolderName", "policyNumber", "healthPlanPhoneNumber");
  }

  if ($("input[name='under18']:checked").val() === 'Yes') {
    textFields.push("guardianFirstName", "guardianLastName");
  } else {
    textFields = _.without(textFields, "guardianFirstName", "guardianLastName");
  }

  for (i = 0; i < textFields.length; i++) {
    if (fieldIsEmpty(textFields[i])) {
      $("#" + textFields[i]).addClass("errorField");
      error = true;
    }
  }

  if (!error) {
    var url = "cfc/manageCQ.cfc?method=insertPatientInfo";
    $.ajax({
      url: url,
      type: "POST",
      data: {
        'firstname': $('#firstName').val(),
        'lastname': $('#lastName').val(),
        'under18': $("input[name='under18']").is(':checked') ? $("input[name='under18']:checked").val() : 'No',
        'guardianFirstname': $('#guardianFirstName').val(),
        'guardianLastname': $('#guardianLastName').val(),
        'address': $('#address').val(),
        'address2': $('#address2').val(),
        'city': $('#city').val(),
        'zipcode': $('#zipcode').val(),
        'telephone': $('#telephone').val(),
        'dateOfBirth': $('#dob').val(),
        'emailAddress': $('#email').val(),
      cache: false,
      success: function(txt) {
        var result = $.trim(txt);

        $('#message').html(result).removeClass('hidden');
        if (result.indexOf('information') >= 0) {
          $('#message').addClass('greenText').removeClass('redText');
          $('#patientRegistration').trigger('reset');
          $("#submitPatientInfo").prop('disabled', false).css('cursor', 'pointer');
          // swal("Success!!", result.match("<string>(.*)</string>")[1], "success");
        } else {
          $('#message').removeClass('greenText').addClass('redText');
          $("#submitPatientInfo").prop('disabled', false).css('cursor', 'pointer');
          // swal("Oops...", result, "error");
        }
      }
    });
  } else {
    $("#message").removeClass("hidden greenText").addClass("redText boldText").append("Please fill in required information highlighted in red.");
    $("#submitPatientInfo").prop('disabled', false).css('cursor', 'pointer');
    // swal("Oops...", "Please fill in the required information highlighted in red.", "error");
  }
};



function jsCallPrintPdf(patientID) {
  window.open('printPdf.cfm?patientID=' + patientID, 'pdfWindow', 'width=800, height=800, scrollbars=yes, toolbar=yes, menubar=yes, resizable=yes, modal=yes');
}