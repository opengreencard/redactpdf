import { authServerHandlers } from '../../../../lib/auth/nextAuth';

// Added based on tutorial from
// https://authjs.dev/getting-started/installation#configure
export const { GET, POST } = authServerHandlers;
