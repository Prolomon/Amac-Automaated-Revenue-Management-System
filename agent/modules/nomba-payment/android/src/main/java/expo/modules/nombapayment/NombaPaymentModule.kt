package expo.modules.nombapayment

import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

class NombaPaymentModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("NombaPayment")

    AsyncFunction("triggerPayment") { amount: String, txnRef: String, promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "No current activity available", null)
        return@AsyncFunction
      }

      val intent = Intent("com.nomba.pro.feature.payment_option.ACTION_VIEW")
      intent.putExtra("amount", amount)
      intent.putExtra("merchantTxRef", txnRef)
      intent.putExtra("ARGS_PAYMENT_OPTION_STATE", "SDK_PAYMENT_OPTIONS")

      PaymentResultHolder.pendingPromise = promise
      activity.startActivityForResult(intent, PAYMENT_REQUEST_CODE)
    }
  }

  companion object {
    const val PAYMENT_REQUEST_CODE = 4321
  }
}