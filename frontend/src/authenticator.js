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
        <Text>AWS re:Invent 2023</Text>
        <Text>SVS 209 — Using generative AI to build a serverless registration app</Text>
        <Image height="50%" width="50%"
          alt="AWS logo"
          src="https://a0.awsstatic.com/libra-css/images/logos/aws_logo_smile_1200x630.png"
        />
      </View>
    );
  },
}

export {components, formFields};