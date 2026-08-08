package expo.modules.nombapayment

import android.app.Activity
import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

class NombaPaymentModule : Module() {
  private var pendingPromise: Promise? = null

  override fun definition() = ModuleDefinition {
    Name("NombaPayment")

    OnActivityResult { activity, payload ->
      if (payload.requestCode == PAYMENT_REQUEST_CODE) {
        val promise = pendingPromise ?: PaymentResultHolder.pendingPromise
        val result = payload.data?.getStringExtra("txnResultData")
        if (payload.resultCode == Activity.RESULT_OK) {
          promise?.resolve(result ?: "SUCCESS")
        } else {
          promise?.reject("PAYMENT_FAILED", "Payment was not completed (resultCode=${payload.resultCode})", null)
        }
        pendingPromise = null
        PaymentResultHolder.pendingPromise = null
      }
    }

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

      pendingPromise = promise
      PaymentResultHolder.pendingPromise = promise

      try {
        activity.startActivityForResult(intent, PAYMENT_REQUEST_CODE)
      } catch (e: Exception) {
        pendingPromise = null
        PaymentResultHolder.pendingPromise = null
        promise.reject("ACTIVITY_NOT_FOUND", "Nomba payment app is not installed or service is unavailable: ${e.message}", e)
      }
    }
  }

  companion object {
    const val PAYMENT_REQUEST_CODE = 4321
  }
}