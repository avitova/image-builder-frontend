/* eslint-disable @typescript-eslint/no-unused-vars */

type userinfo = {
  home: string;
};

export default {
  user: (): Promise<userinfo> => {
    return new Promise((resolve) => {
      resolve({
        home: '',
      });
    });
  },
  file: (path: string) => {
    return {
      read: (): Promise<string> => {
        return new Promise((resolve) => {
          resolve('');
        });
      },
      close: () => {},
    };
  },
};