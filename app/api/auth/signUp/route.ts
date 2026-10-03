import { SignUpRequestBody, SignUpResponse, signUpServer } from './signUp';
import {
  makeAPIRouteWithBody,
  MakeAPIRouteWithBodyTypes,
} from '../../../../lib/api/makeAPIRouteWithBody';

type SignUpRoute = MakeAPIRouteWithBodyTypes<
  SignUpRequestBody,
  {},
  SignUpResponse
>;

/** Register an email/password user so they can sign in on later visits. */
export const POST = makeAPIRouteWithBody<
  SignUpRoute['requestBody'],
  SignUpRoute['queryAndPathParams'],
  SignUpRoute['response']
>({ method: 'POST', apiFunc: signUpServer });
