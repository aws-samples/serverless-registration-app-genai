import { Amplify } from "aws-amplify";
import {
  Alert,
  Authenticator,
  Button,
  Flex,
  Grid,
  TextAreaField,
} from "@aws-amplify/ui-react";
import React, { useCallback, useState } from "react";
import postData from "./API";
import "@aws-amplify/ui-react/styles.css";
import amplify_config from "./amplify";

Amplify.configure(amplify_config);

export default function App() {
  const [message, setMessage] = useState("");

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
              Hello, {user.attributes.given_name}!
            </h1>
            <Alert hidden={true}
              variation="success"
              isDismissible={true}
              hasIcon={true}
              heading="Alert heading"
            >
              This is the alert message
            </Alert>
            <Grid templateColumns="1fr" templateRows="10rem 3rem">
              <TextAreaField
                columnSpan={2}
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
              <Flex marginTop={4}>
                <Button
                  variation="primary"
                  onClick={() => fetchData(user.attributes, message)}
                  disabled={!message}
                >
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
