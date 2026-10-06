import { NativeModule, requireOptionalNativeModule } from 'expo';

declare class NombaPaymentModule extends NativeModule<{}> {
  triggerPayment(amount: string, txnRef: string): Promise<string>;
  printReceipt(htmlContent: string): Promise<string>;
}

const NativeNomba = requireOptionalNativeModule<NombaPaymentModule>('NombaPayment');

const fallbackNomba = {
  async triggerPayment(_amount: string, _txnRef: string): Promise<string> {
    throw new Error(
      "Native module 'NombaPayment' is not found. You are likely running in Expo Go or an emulator without native Nomba SDK support. To use card payments, run a custom Android build (`npx expo run:android`) on a Nomba POS terminal."
    );
  },
  async printReceipt(_htmlContent: string): Promise<string> {
    throw new Error(
      "Native module 'NombaPayment' is not found for thermal printing. Ensure you are running on a Nomba POS terminal."
    );
  },
};

export default (NativeNomba || fallbackNomba) as NombaPaymentModule;