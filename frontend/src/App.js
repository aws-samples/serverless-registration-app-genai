import { Amplify } from "aws-amplify";
import {
  Authenticator,
  Button,
  Flex,
  Grid,
  TextAreaField,
} from "@aws-amplify/ui-react";
import React, { useCallback, useState } from "react";
import postData from "./API";
import "@aws-amplify/ui-react/styles.css";

const amplify_config = {
  userPoolId: "us-east-1_fPONxLPMs",
  userPoolWebClientId: "11b3l8l5dobomgl89ktduc1878",
  region: "us-east-1",
  identityPoolId: "us-east-1:58c96601-a5b5-4aa0-b0d6-9946c432f230",
  identityPoolRegion: "us-east-1",
  aws_cognito_username_attributes: ["EMAIL"],
  aws_cognito_social_providers: [],
  aws_cognito_signup_attributes: ["EMAIL", "FAMILY_NAME", "GIVEN_NAME"],
  aws_cognito_mfa_configuration: "OFF",
  aws_cognito_password_protection_settings: {
    passwordPolicyMinLength: 8,
    passwordPolicyCharacters: [],
  },
  aws_cognito_verification_mechanisms: ["EMAIL"],
  // aws_cloud_logic_custom: [
  //   {
  //     name: "MyApiName",
  //     endpoint: "https://lfjrwryc6h.execute-api.us-east-1.amazonaws.com/Prod",
  //     region: "us-east-1",
  //   },
  // ],
  aws_mandatory_sign_in: "enable",
  API: {
    endpoints: [
      {
        name: "MyApiName",
        endpoint: "https://9c8y48ivid.execute-api.us-east-1.amazonaws.com/Prod"  // <== Use the value from SAM output. Don't forget /Prod at the end (no trailing slash).
      }
    ]
  }
};

Amplify.configure(amplify_config);

export default function App() {

  const [message, setMessage] = useState('');

  const handleMessageChange = event => {
    setMessage(event.target.value);
    console.log(event.target.value);
  };

  const fetchData = useCallback(async (email, message) => {
    try {
      const response = postData(email, message);
      console.log(response);
    } catch (err) {
      console.log(err);
    }
  }, []);

  return (
    <div>
      <Authenticator>
        {({ signOut, user }) => (
          <main>
            <h1 className="text-body-emphasis">
              Hello, {user.attributes.given_name}! {/* user.attributes.email */}
            </h1>
            <Grid
              templateColumns="1fr"
              templateRows="10rem 3rem" 
            >
              <TextAreaField columnSpan={2}
                descriptiveText="Tell us about your interests, and we'll send you a custom welcome email!"
                resize="vertical"
                id="message"
                name="message"
                isRequired={true}
                onChange={(event) => {
                  setMessage(event.target.value);
                }}
                value={message}
              />
              <Flex>
                <Button variation="primary" onClick={() => fetchData(user.attributes, message)} disabled={!message}>
                  Submit
                </Button>
                <Button onClick={signOut}>Sign out</Button>
              </Flex>
            </Grid>
          </main>
        )}
      </Authenticator>
    </div>
  );
}
