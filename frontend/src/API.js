import { API } from "aws-amplify";

async function postData(userAttributes, message) {
  const apiName = 'MyApiName';
  const path = '/register';
  const myInit = {
    body: {
      userAttributes: userAttributes,
      message: message
    },
  };

  return await API.post(apiName, path, myInit);
}

export default postData;