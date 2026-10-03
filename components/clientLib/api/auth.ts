import {
  ClientAPIRouteWithBodyData,
  makeClientAPIRouteWithBody,
} from './common';
import {
  SignUpRequestBody,
  SignUpResponse,
} from '../../../app/api/auth/signUp/signUp';

/** Sign up for a new account using email/password */
export const signUpClient = makeClientAPIRouteWithBody<
  SignUpRequestBody, // RequestBodyT
  {}, // RequestPathAndQueryParamsT
  SignUpResponse // ResponseT
>({
  method: 'POST',
  dataToUrlQueryStringAndBody: (
    body
  ): ClientAPIRouteWithBodyData<SignUpRequestBody> => ({
    url: '/api/auth/signUp',
    body,
  }),
});
