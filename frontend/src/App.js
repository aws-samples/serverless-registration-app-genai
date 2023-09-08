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
import { Amplify, Auth, Hub } from "aws-amplify";
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

  Hub.listen("auth", (data) => {
    // console.log(JSON.stringify(data.payload.data.attributes.email));
    switch (data.payload.event) {
      case "signIn":
        console.log("user signed in: " + data.payload.data.attributes.email);
        setEmail(data.payload.data.attributes.email);
        break;
      case "signUp":
        console.log("user signed up");
        break;
      case "signOut":
        console.log("user signed out");
        setEmail("");
        break;
      case "signIn_failure":
        console.log("user sign in failed");
        break;
      case "configured":
        console.log("the Auth module is configured");
        break;
      default:
        console.log("unknown event");
    }
  });

  // On componentDidMount set the timer
  useEffect(() => {
    // Check subscription confirmation every 2 seconds
    const intervalId = setInterval(() => {
      getUserAttribs();

      if (email === "") return null;

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
      const { attributes } = await Auth.currentAuthenticatedUser();
      console.debug("user attribs:" + JSON.stringify(attributes));
      setEmail(attributes.email);
    } catch (error) {
      console.error(error);
      setErrorMessage(error);
      setShowErrorAlert(true);
    }
  };

  // Handle submit
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
                <Grid templateColumns="1fr" templateRows="10rem 3rem">
                  <TextAreaField
                    columnSpan={2}
                    descriptiveText="Tell us about your interests, and we'll send you a custom welcome email!"
                    resize="vertical"
                    id="textAreaField"
                    name="textAreaField"
                    isRequired={true}
                    onChange={(event) => {
                      setTextAreaValue(event.target.value);
                    }}
                    value={textAreaValue}
                  />
                  <Flex marginTop={4}>
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
              <Alert variation="error" isDismissible={false} hasIcon={true}>
                To proceed, check your email inbox and choose{" "}
                <strong>Confirm subscription</strong> in the email from Amazon
                SNS.
              </Alert>
            )}
          </main>
        )}
      </Authenticator>
    </View>
  );
}
