import {
  Alert,
  Authenticator,
  Button,
  Flex,
  Grid,
  TextAreaField,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Amplify, Auth } from "aws-amplify";
import React, { useCallback, useEffect, useState } from "react";
import { register, subscriptionConfirmed } from "./API";
import amplify_config from "./amplify";

Amplify.configure(amplify_config);

export default function App() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [successHidden, setSuccessHidden] = useState(true);
  const [errorHidden, setErrorHidden] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  useEffect(() => {
    // Get current authenticated user
    const getUserAttribs = async () => {
      const { attributes } = await Auth.currentAuthenticatedUser();
      console.debug("user attribs:" + JSON.stringify(attributes));
      setEmail(attributes.email);
    };

    // getUserAttribs().catch(console.error);

    // Check subscription confirmation every 2 seconds
    const intervalId = setInterval(() => {
      getUserAttribs().catch(console.error);
      subscriptionConfirmed(email)
        .then((response) => {
          console.log(response);
          if (response.subscription_confirmed === true) {
            setEmailConfirmed(true);
            console.log(`Subscription confirmed for ${email}`);
          }
        })
        .catch((error) => {
          console.log(error.response);
        });
    }, 1000 * 2); // 2 sec interval
    return () => clearInterval(intervalId);
  }, [email]);

  const fetchData = useCallback(async (email, message) => {
    try {
      const response = await register(email, message);
      console.log(response);
      setSuccessHidden(false);
    } catch (err) {
      console.log(err);
      setSuccessHidden(true);
      setErrorHidden(false);
      setErrorMessage(
        `${err.message}. For details, use your browser's Developer Tools.`
      );
    }
  }, []);

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main>
          <h1 className="text-body-emphasis">
            Hello, {user.attributes.given_name}!
          </h1>
          {emailConfirmed ? (
            <>
              <Alert
                hidden={successHidden}
                variation="success"
                isDismissible={true}
                hasIcon={true}
                heading="Success"
              >
                Your registration has been successfully submitted. Please check
                your inbox for a message from us.
              </Alert>
              <Alert
                hidden={errorHidden}
                variation="error"
                isDismissible={true}
                hasIcon={true}
                heading="Error"
              >
                {errorMessage}
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
            </>
          ) : (
            <Alert variation="error" isDismissible={false} hasIcon={true}>
              To proceed, check your email inbox and choose{" "}
              <strong>Confirm subscription</strong> in the email from Amazon
              SNS.
            </Alert>
          )}
        </main>
      )}
    </Authenticator>
  );
}
