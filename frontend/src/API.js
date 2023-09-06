import { API } from "aws-amplify";

function register(userAttributes, message) {
  const apiName = 'MyApiName';
  const path = '/register';
  const myInit = {
    body: {
      userAttributes: userAttributes,
      message: message
    },
  };

  return API.post(apiName, path, myInit);
}

export default register;