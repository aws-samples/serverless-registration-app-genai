// Amplify Authenticator component customizations

import { Image, Text, View, useTheme } from '@aws-amplify/ui-react';

const formFields = {
  signUp: {
    family_name: {
      placeholder: 'Enter your last name here',
      isRequired: true,
      label: 'Last name'
    },
    given_name: {
      placeholder: 'Enter your first name here',
      isRequired: true,
      label: 'First name'
    },
  },
}

const components = {
  Header() {
    const { tokens } = useTheme();

    return (
      <View textAlign="center" marginTop={tokens.space.large}>
        <Text>AWS Summit New York, NY 2024</Text>
        <Text>SVS 201 — Serverless registration application with GenAI</Text>
        <Image height="50%" width="50%"
          alt="AWS logo"
          src="https://raw.githubusercontent.com/aws-samples/serverless-registration-app-genai/main/frontend/public/AWS_logo_RGB.svg"
        />
      </View>
    );
  },
}

export {components, formFields};