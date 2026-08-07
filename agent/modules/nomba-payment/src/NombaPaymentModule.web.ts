import { registerWebModule, NativeModule } from 'expo';

class NombaPaymentModule extends NativeModule<{}> {}

export default registerWebModule(NombaPaymentModule, 'NombaPaymentModule');
