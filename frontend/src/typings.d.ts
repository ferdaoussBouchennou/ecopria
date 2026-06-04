/* Déclarations pour modules sans types ou résolution TS stricte */
declare module 'html5-qrcode' {
  export class Html5Qrcode {
    constructor(elementId: string);
    start(
      cameraIdOrConfig: string | { facingMode: string },
      configuration: { fps?: number; qrbox?: { width: number; height: number }; aspectRatio?: number },
      qrCodeSuccessCallback: (decodedText: string) => void,
      qrCodeErrorCallback?: (errorMessage: string) => void
    ): Promise<void>;
    stop(): Promise<void>;
    clear(): void;
  }
}
