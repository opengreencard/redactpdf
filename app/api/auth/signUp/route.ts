import { SignUpRequestBody, SignUpResponse, signUpServer } from './signUp';
import { makePOSTAPIRoute } from '../../../../lib/api/makePOSTAPIRoute';

export const POST = makePOSTAPIRoute<
  SignUpRequestBody, // RequestBodyT
  {}, // TransformedQueryAndPathParamsT
  SignUpResponse // ResponseT
>({ apiFunc: signUpServer });
