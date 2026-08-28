import { getUnreachableError } from './typescript/getUnreachableError';

interface MakeFakeHandlerOptions {
  /**
   * What to log. Defaults to 'args'.
   *
   * - args: console.log the args
   * - stringifiedArgs: console.log the args after JSON.stringify; this is
   *   useful for large args
   * - none: don't log anything
   */
  log?: 'args' | 'stringifiedArgs' | 'none';
}

/**
 * Make a fake event handler for use in Storybook tests.
 * Example:
 *
 * <Blah onChange={makeFakeHandler('onChange')} />
 */
export function makeFakeHandler(
  name: string,
  { log = 'args' }: MakeFakeHandlerOptions = {}
) {
  return (...args: any[]) => {
    let toLog: any[];
    switch (log) {
      case 'args':
        toLog = args;
        break;
      case 'stringifiedArgs':
        toLog = [JSON.stringify(args)];
        break;
      case 'none':
        toLog = [];
        break;
      default:
        toLog = args;
        getUnreachableError(log);
    }

    // eslint-disable-next-line no-console
    console.log(name, ...toLog);
  };
}
