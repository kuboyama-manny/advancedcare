/*
 *  Document   : filters.js
 *  Author     : Marius Dalca
 *  Description: Setting up filters for our App
 *
 */

App.filter('startFrom', function() {
   return function(input, start) {
      if (input)
       return input.slice(start);
      else
       return null;
   };
});

App.filter('capitalize', function() {
    return function(input) {
      return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    }
});

App.filter('doubledigits', function() {
    return function(input) {
      return (input < 10 ? '0' : '') + parseInt(input);
    }
});

App.filter('etranslate', function() {
    return function(input) {
      var errors = {
        'required_fields_missing': 'One or more required fields are missing',
        'e_sign_up_unfinished': 'Your signup process is not finished',
        'e_invalid_credentials': 'Sorry, email or password is not correct',
        'e_auth': 'Authentication error.',
        'e_invalid_phone_number': 'Invalid phone number',
        'e_address_without_street': 'Address should contain street',
        'e_address_without_zip': 'Address should contain zipcode',
        'e_invalid_access': 'Invalid access',
        'e_access_exists' : 'It has already been created.',
        'e_invalid_resource': 'Invalid resource',
        'e_invalid_via': 'Invalid Via',
        'e_invalid_qty': 'Invalid Quanitty',
        'e_invalid_number_of_refills': 'Invalid number of refills',
        'e_invalid_device_type': 'Invalid device type',
        'e_invalid_role': 'Invalid role',
        'e_invalid_password': 'Password should contain at least 1 uppercase, 1 lowercase letter and 1 digit. And Enter at-least six characters in password.',
        'e_invalid_place_id': 'Invalid place id',
        'e_null_address': 'Address is required',
        'e_null_place_id': 'Place id is required',
        'e_invalid_reaction': 'Invalid reaction',
        'e_internal': 'Unknown server error',
        'e_illegal_severity': 'Invalid severity value',
        'e_phone_number_exists': 'Phone number already exists',
        'e_email_exists': 'Email already exists',
        'e_facility_not_found': 'Facility is not found',
        'e_invalid_type': 'Invalid type',
        'e_invalid_gender': 'Invalid gender',
        'e_invalid_to': 'Invalid to',
        'e_invalid_delivery_recipient': 'Invalid delivery recipient',
        'e_invalid_orders_content': 'Invalid orders content',
        'e_invalid_notes': 'Invalid notes',
        'e_invalid_source': 'Invalid source',
        'e_sign_up_not_allowed_for_admin': 'Signup is not allowed for admin',
        'e_invalid_session': 'Invalid session',
        'e_sign_up_not_ready': 'Signup is not ready',
        'e_default_role_protected_for_delete': 'Default role can\'t be deleted',
        'e_role_name_already_exists': 'Role name already exists',
        'e_unmodificable_email': 'Email can\'t be modified.',
        'e_deleting_self': 'Yikes, you can\'t delete yourself !',
        'e_role_not_found': 'Role is not found',
        'e_roles_mismatch': 'Roles mismatch',
        'e_drug_not_found': 'Drug is not found',
        'e_din_already_exists': 'DIN (doctor identification number) already exists',
        'e_formulary_not_found': 'Formulary is not found',
        'e_favourite_record_not_found': 'Favourite record is not found',
        'e_invalid_drug_product_id': 'Invalid drug product id',
        'e_password_expired': 'Your password is expired, please check your inbox to reset it.'
      };


      if (!input || input == '') return '';
      if (errors[input] && errors[input] != '') return errors[input];

      var st = input.replace('e_', '').replace(/_/g, ' ')
      return st.charAt(0).toUpperCase() + st.slice(1);
    }
});
