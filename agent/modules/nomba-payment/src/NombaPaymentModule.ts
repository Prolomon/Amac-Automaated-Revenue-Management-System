import { NativeModule, requireNativeModule } from 'expo';

declare class NombaPaymentModule extends NativeModule<{}> {
  triggerPayment(amount: string, txnRef: string): Promise<string>;
}

export default requireNativeModule<NombaPaymentModule>('NombaPayment');