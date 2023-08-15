import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import React, { useCallback } from "react";
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
  aws_cloud_logic_custom: [
    {
      name: "MyApiName",
      endpoint: "https://lfjrwryc6h.execute-api.us-east-1.amazonaws.com/Prod",
      region: "us-east-1",
    },
  ],
  aws_mandatory_sign_in: 'enable' 
};

Amplify.configure(amplify_config);

async function getData() {
  const response = await fetch("https://lfjrwryc6h.execute-api.us-east-1.amazonaws.com/Prod/hello");
  if (!response.ok) {
    const message = `An error has occured: ${response.status}`;
    throw new Error(message);
  }
  const data = await response.json();
  return data;
}

export default function App() {
  const fetchData = useCallback(async () => {
    try {
      const response = await getData();
    } catch (err) {
      console.log(err);
    }
  }, []);

  return (
    <div>
      <Authenticator>
        {({ signOut, user }) => (
          <main>
            <h1 class="text-body-emphasis">Hello {user.attributes.given_name}</h1>
            Tell us a bit about your interests:
            <label>Enter value : </label>
            <input type="textarea" name="textValue" />
            <button onClick={() => fetchData()}>Fetch Data</button>
          </main>
        )}
      </Authenticator>
    </div>
  );
}
