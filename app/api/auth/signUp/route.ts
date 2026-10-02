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

export const POST = makeAPIRouteWithBody<
  SignUpRoute['requestBody'],
  SignUpRoute['queryAndPathParams'],
  SignUpRoute['response']
>({ method: 'POST', apiFunc: signUpServer });
