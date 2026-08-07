package expo.modules.nombapayment

import expo.modules.kotlin.Promise

object PaymentResultHolder {
  var pendingPromise: Promise? = null
}