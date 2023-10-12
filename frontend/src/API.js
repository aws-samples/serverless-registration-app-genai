// API endpoints

import { API } from "aws-amplify";

function register(userAttributes, message) {
  const apiName = 'MyApiName';
  const path = 'register';
  const myInit = {
    body: {
      userAttributes: userAttributes,
      message: message
    },
  };

  return API.post(apiName, path, myInit);
}

function subscriptionConfirmed(email) {
  const apiName = 'MyApiName';
  const path = 'subscription_confirmed';
  const myInit = {
    queryStringParameters: {
      id: email,
    },
  };

  return API.get(apiName, path, myInit);
}

export { register, subscriptionConfirmed }