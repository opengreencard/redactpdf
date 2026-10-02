import { SignUpRequestBody, SignUpResponse, signUpServer } from './signUp';
import { makeAPIRouteWithBody } from '../../../../lib/api/makeAPIRouteWithBody';

export const POST = makeAPIRouteWithBody<
  SignUpRequestBody, // RequestBodyT
  {}, // TransformedQueryAndPathParamsT
  SignUpResponse // ResponseT
>({ method: 'POST', apiFunc: signUpServer });
