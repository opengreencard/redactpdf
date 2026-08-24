import { makeClientPOSTRoute, POSTRouteData } from './common';
import {
  SignUpRequestBody,
  SignUpResponse,
} from '../../../app/api/auth/signUp/signUp';

/** Sign up for a new account using email/password */
export const signUpClient = makeClientPOSTRoute<
  SignUpRequestBody, // RequestBodyT
  {}, // RequestPathAndQueryParamsT
  SignUpResponse // ResponseT
>((body): POSTRouteData<SignUpRequestBody> => ({
  url: '/api/auth/signUp',
  body,
}));
