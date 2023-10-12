// App Component is the main component in React which acts as a container for
// all other components.

import {
  Alert,
  Authenticator,
  Button,
  Flex,
  Grid,
  TextAreaField,
  View,
  useTheme,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Amplify, Auth } from "aws-amplify";
import React, { useCallback, useEffect, useState } from "react";
import { register, subscriptionConfirmed } from "./API";
import amplify_config from "./amplify";
import { components, formFields } from "./authenticator";

Amplify.configure(amplify_config);

export default function App() {
  const { tokens } = useTheme();
  const [email, setEmail] = useState("");
  const [textAreaValue, setTextAreaValue] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  // On componentDidMount set the timer to invoke SNS topic subscription
  // confirmation API every 2 seconds.
  useEffect(() => {
    // Check subscription confirmation every 2 seconds
    const intervalId = setInterval(() => {
      console.info("Getting current authenticated user...");
      getUserAttribs();
      console.info(`Invoking /subscription_confirmed?id=${email}`);
      subscriptionConfirmed(email)
        .then((response) => {
          console.debug(response);
          if (response.subscription_confirmed === true) {
            setEmailConfirmed(true);
            console.info(`Email subscription confirmed for ${email}`);
          }
        })
        .catch((error) => {
          console.error(
            `Invoking /subscription_confirmed?id=${email} threw an exception`
          );
          console.error(error.response);
          setErrorMessage(error.response);
          setShowErrorAlert(true);
        });
    }, 1000 * 2 /* 2 sec interval */);

    return () => clearInterval(intervalId);
  }, [email]);

  // Get current authenticated user
  const getUserAttribs = async () => {
    try {
      const cognitoUser = await Auth.currentAuthenticatedUser();
      console.debug("cognitoUser:" + JSON.stringify(cognitoUser));
      setEmail(cognitoUser.attributes.email);
    } catch (error) {
      console.error("Auth.currentAuthenticatedUser() threw an exception");
      console.error(error);
      if (error !== "The user is not authenticated") {
        setErrorMessage(error);
        setShowErrorAlert(true);
      }
    }
  };

  const signOutCurrentUser = async () => {
    try {
      await Auth.signOut();
    } catch (error) {
      console.log("error signing out: ", error);
    }
  };

  // Handle submit button
  const fetchData = useCallback(async (email, message) => {
    try {
      if (email === "") return null;
      console.info("Invoking /register");
      const response = await register(email, message);
      console.info(response);
      setShowSuccessAlert(true);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        `${err.message}. For details, use your browser's Developer Tools.`
      );
      setShowErrorAlert(true);
    }
  }, []);

  return (
    <View margin={tokens.space.large}>
      <Authenticator components={components} formFields={formFields}>
        {({ signOut, user }) => (
          <main>
            <h1 className="text-body-emphasis">
              Hello, {user.attributes.given_name}!
            </h1>
            {/* We can't send an email until SNS receives confirmation (opt-in) */}
            {emailConfirmed ? (
              <>
                {showSuccessAlert && (
                  <Alert
                    variation="success"
                    isDismissible={true}
                    hasIcon={true}
                    heading="Success"
                  >
                    Your interests have been successfully submitted. Please
                    check your inbox for a welcome message from us.
                  </Alert>
                )}
                {showErrorAlert && (
                  <Alert
                    variation="error"
                    isDismissible={true}
                    hasIcon={true}
                    heading="Error"
                  >
                    {errorMessage}
                  </Alert>
                )}
                <Grid
                  templateColumns="1fr"
                  templateRows="10rem 3rem"
                  maxWidth="80%"
                >
                  <TextAreaField
                    placeholder="Enter your interests here, and we will send you a custom welcome email!"
                    rows={4}
                    id="textAreaField"
                    name="textAreaField"
                    isRequired={true}
                    onChange={(event) => {
                      setTextAreaValue(event.target.value);
                    }}
                    value={textAreaValue}
                  />
                  <Flex>
                    <Button
                      variation="primary"
                      onClick={() => {
                        console.log("Submit clicked");
                        fetchData(user.attributes, textAreaValue);
                      }}
                      disabled={!textAreaValue}
                    >
                      Submit
                    </Button>
                    <Button onClick={signOut}>Sign out</Button>
                  </Flex>
                </Grid>
              </>
            ) : (
              // SNS email subscription is unconfirmed
              <>
                <Alert variation="error" isDismissible={false} hasIcon={true}>
                  To proceed, check your email inbox and choose{" "}
                  <strong>Confirm subscription</strong> in the email from Amazon
                  SNS.
                </Alert>
                <Button
                  onClick={() => signOutCurrentUser()}
                  marginTop={tokens.space.large}
                >
                  Sign out
                </Button>
              </>
            )}
          </main>
        )}
      </Authenticator>
    </View>
  );
}
