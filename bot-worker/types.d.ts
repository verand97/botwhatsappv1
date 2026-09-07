declare module '@whiskeysockets/baileys' {
  export interface WASocket {
    ev: {
      on: (event: string, callback: (data: any) => void) => void;
    };
    sendMessage: (jid: string, content: any, options?: any) => Promise<any>;
  }

  export namespace proto {
    export interface IWebMessageInfo {
      key: {
        remoteJid?: string | null;
        fromMe?: boolean | null;
        id?: string | null;
      };
      message?: {
        conversation?: string | null;
        extendedTextMessage?: { text?: string | null } | null;
        imageMessage?: { caption?: string | null } | null;
        videoMessage?: { caption?: string | null } | null;
        [key: string]: any;
      } | null;
    }
  }

  export const DisconnectReason: {
    loggedOut: number;
    [key: string]: any;
  };

  export function useMultiFileAuthState(path: string): Promise<{
    state: any;
    saveCreds: () => Promise<void>;
  }>;

  export function downloadMediaMessage(
    message: any,
    type: 'buffer' | 'stream',
    options: any
  ): Promise<Buffer>;

  export default function makeWASocket(config: any): WASocket;
}

declare module '@hapi/boom' {
  export class Boom extends Error {
    output?: {
      statusCode?: number;
      payload?: any;
    };
  }
}
