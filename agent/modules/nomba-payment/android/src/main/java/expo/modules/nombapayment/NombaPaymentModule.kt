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
          ?: payload.data?.getStringExtra("response")
          ?: payload.data?.getStringExtra("result")
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

      val intent = Intent("com.nomba.pro.feature.payment_option.ACTION_VIEW").apply {
        setPackage("com.nomba.pro")
        putExtra("amount", amount)
        putExtra("amountDouble", amount.toDoubleOrNull() ?: 0.0)
        putExtra("merchantTxRef", txnRef)
        putExtra("ARGS_PAYMENT_OPTION_STATE", "SDK_PAYMENT_OPTIONS")
        putExtra("packageName", activity.packageName)
        putExtra("package", activity.packageName)
        putExtra("callbackPkg", activity.packageName)
        addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
      }

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

    AsyncFunction("printReceipt") { htmlContent: String, promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "No current activity available", null)
        return@AsyncFunction
      }

      activity.runOnUiThread {
        try {
          val webView = android.webkit.WebView(activity)
          webView.webViewClient = object : android.webkit.WebViewClient() {
            override fun onPageFinished(view: android.webkit.WebView?, url: String?) {
              val printManager = activity.getSystemService(android.content.Context.PRINT_SERVICE) as? android.print.PrintManager
              if (printManager == null) {
                promise.reject("NO_PRINT_SERVICE", "Print service unavailable on this device", null)
                return
              }
              val printAdapter = webView.createPrintDocumentAdapter("AMAC_Receipt")
              val jobName = "AMAC Receipt"
              val builder = android.print.PrintAttributes.Builder()
                .setMediaSize(android.print.PrintAttributes.MediaSize.UNKNOWN_PORTRAIT)
                .setMinMargins(android.print.PrintAttributes.Margins(0, 0, 0, 0))

              printManager.print(jobName, printAdapter, builder.build())
              promise.resolve("PRINT_INITIATED")
            }
          }
          webView.loadDataWithBaseURL(null, htmlContent, "text/html", "UTF-8", null)
        } catch (e: Exception) {
          promise.reject("PRINT_FAILED", "Native printing error: ${e.message}", e)
        }
      }
    }
  }

  companion object {
    const val PAYMENT_REQUEST_CODE = 4321
  }
}