const amplify_config = {
  userPoolId: "us-east-1_Z2BqcgXCW",                 // <== Use the value from SAM output.
  userPoolWebClientId: "6lcn50fl2o4ivcnrt4okkb66gb", // <== Use the value from SAM output.
  region: "us-east-1",                           // <== Use the region provided by the instructor.
  identityPoolId: "us-east-1:42889af5-0827-4c68-9854-8022f0fbb342",         // <== Use the value from SAM output.
  identityPoolRegion: "us-east-1",               // <== Use the region provided by the instructor.
  aws_cognito_username_attributes: ["EMAIL"], // <== DO NOT EDIT
  aws_cognito_social_providers: [],           // <== DO NOT EDIT
  aws_cognito_signup_attributes: ["EMAIL", "FAMILY_NAME", "GIVEN_NAME"], // <== DO NOT EDIT
  aws_cognito_mfa_configuration: "OFF",       // <== DO NOT EDIT
  aws_cognito_password_protection_settings: {
    passwordPolicyMinLength: 8,
    passwordPolicyCharacters: [],
  },
  aws_cognito_verification_mechanisms: ["EMAIL"], // <== DO NOT EDIT
  aws_mandatory_sign_in: "enable",                // <== DO NOT EDIT
  API: {
    endpoints: [
      {
        name: "MyApiName",
        endpoint: "https://d7v08wpvt8.execute-api.us-east-1.amazonaws.com/Prod/"  // <== Use the value from SAM output. Don't forget /Prod at the end (no trailing slash).
      }
    ]
  }
};

export default amplify_config;