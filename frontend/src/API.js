import { API } from "aws-amplify";
import { useEffect, useRef } from 'react';

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

function subscriptionConfirmed(email) {
  const apiName = 'MyApiName';
  const path = '/subscription_confirmed';
  const myInit = {
    queryStringParameters: {
      id: email,
    },
  };

  return API.get(apiName, path, myInit);
}

function useInterval(callback, delay) {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export { register, subscriptionConfirmed, useInterval}