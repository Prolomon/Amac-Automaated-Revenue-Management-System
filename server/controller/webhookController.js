import crypto from "crypto";
// import { recordWebhookTransaction } from "./transactionController.js";
import { prisma } from "../config/db.js";
import { paymentSplit } from "./paymentController.js";

function verifySignature(secret, rawBody, signatureHeader) {
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(computedSignature, 'utf8'),
    Buffer.from(signatureHeader, 'utf8')
  );
}

const nombaWebhook = async (req, res) => {

  // const signature = req.headers['x-nomba-signature'];
  // const secret = process.env.NOMBA_PRIVATE_SECRET;

  // if (!verifySignature(secret, req.rawBody, signature)) {
  //   return res.status(401).send('Invalid signature');
  // }

  // // ✅ Signature verified
  // console.log('Webhook verified');

  try {
    const event = req.body;

    console.log('Received Nomba webhook event:', JSON.stringify(event, null, 2));

    if (!event || typeof event !== 'object') {
      return res.status(400).json({ ok: false, message: 'Invalid payload' });
    }

    const type = String(event.event_type || '').trim();
    if (!type || type !== 'payment_success') {
      return res.status(200).json({ ok: true, message: 'Ignored event' });
    }

    const txn = event.data?.transaction || {};

    const merchant = txn?.merchant || {};

    // Nomba structure varies: fields can be in txn root or nested in merchant
    const aliasRef = txn?.aliasAccountReference || merchant?.aliasAccountReference || txn?.aliasAccountNumber || merchant?.aliasAccountNumber || null;
    const amount = Number(txn?.transactionAmount || merchant?.transactionAmount || 0);
    const fee = Number(txn?.fee || merchant?.fee || 0);
    const merchantUserId = merchant?.userId || txn?.userId || null;
    const walletId = merchant?.walletId || null;
    const senderDetails = txn?.customer || event.data?.customer || {};
    const customerEmail = senderDetails?.email || null;
    const transactionReference = txn?.transactionId || merchant?.transactionId || `nomba-${Date.now()}`;

    if (String(txn.type).toLowerCase() === String('purchase').toLowerCase()) {
      const str = "AGT-6089894298PAY|2026720849491798-1786117343380";
      const agentId = txn.merchantTxRef.match(/^(.*?)PAY/)[1];
      const paymentRef = "PAY|" + txn.merchantTxRef.match(/PAY\|?(.*?)-/)[1];

      const payment = await prisma.payment.findFirst({
        where: {
          reference: paymentRef,
        },
      });

      const baseTransactionData = {
        merchantTxRef: merchantUserId,
        event: 'nomba.payment_success',
        amount,
        currency: 'NGN',
        channel: 'card',
        customerEmail,
        paymentId: null,
        userId: result,
        metadata: {
          requestId: event.requestId || null,
          role: 'MERCHANT',
          transactionType: 'CREDIT',
          creditedAmount: amount,
          senderAccountNumber: senderDetails.accountNumber || null,
          senderBankName: senderDetails.cardPan || null,
          senderBankCode: senderDetails.productId || null,
          senderName: senderDetails.cardPan || null,
          aliasAccountNumber: txn?.aliasAccountNumber || merchant?.aliasAccountNumber || null,
          aliasAccountName: txn?.aliasAccountName || merchant?.aliasAccountName || null,
          aliasAccountReference: aliasRef,
          aliasAccountType: txn?.aliasAccountType || null,
          sessionId: txn?.sessionId || null,
          transactionId: txn?.transactionId || null,
          transactionTypeName: txn?.type || null,
          narration: txn?.narration || null,
          time: txn?.time || null,
          originatingFrom: txn?.originatingFrom || null,
          merchant,
          transaction: txn,
        },
        rawPayload: event,
      };

      await prisma.transaction.create({
        data: {
          reference: `${transactionReference}-MERCHANT-PENDING`,
          status: 'PENDING',
          gatewayResponse: 'Wallet credit pending',
          merchantTxRef: merchantUserId,
          event: 'nomba.payment_success',
          amount,
          currency: 'NGN',
          channel: 'wallet',
          customerEmail,
          paymentId: null,
          userId: merchantUserId,
          metadata: {
            ...baseTransactionData.metadata,
            status: 'PENDING',
          },
          rawPayload: event,
        },
      });

      const res = await paymentSplit(amount - fee, payment.centerId, payment.companyId, payment.userId, payment.reference);

      if (!res.ok) {
        return res.status(400).json({ ok: false, message: res.message });
      }

      return res.status(200).json({ ok: true, message: "Payment processed successfully", data: res.data });

    } else {

      console.log(`Processing payment_success webhook: aliasRef=${aliasRef}, amount=${amount}, fee=${fee}, merchantUserId=${merchantUserId}, transactionReference=${transactionReference}`);

      if (!aliasRef) {
        return res.status(400).json({ ok: false, message: 'Missing identifying information (aliasRef)' });
      }

      console.log(`Received payment_success webhook for aliasRef: ${aliasRef}, amount: ${amount}, fee: ${fee}, merchantUserId: ${merchantUserId}, transactionReference: ${transactionReference}`);

      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ ok: false, message: 'Invalid transaction amount' });
      }

      console.log(`Looking for wallet with aliasRef: ${aliasRef}`);
      const baseTransactionData = {
        merchantTxRef: merchantUserId,
        event: 'nomba.payment_success',
        amount,
        currency: 'NGN',
        channel: 'wallet',
        customerEmail,
        paymentId: null,
        userId: merchantUserId,
        metadata: {
          requestId: event.requestId || null,
          role: 'MERCHANT',
          transactionType: 'CREDIT',
          creditedAmount: amount,
          senderAccountNumber: senderDetails.accountNumber || null,
          senderBankName: senderDetails.bankName || null,
          senderBankCode: senderDetails.bankCode || null,
          senderName: senderDetails.senderName || null,
          aliasAccountNumber: txn?.aliasAccountNumber || merchant?.aliasAccountNumber || null,
          aliasAccountName: txn?.aliasAccountName || merchant?.aliasAccountName || null,
          aliasAccountReference: aliasRef,
          aliasAccountType: txn?.aliasAccountType || null,
          sessionId: txn?.sessionId || null,
          transactionId: txn?.transactionId || null,
          transactionTypeName: txn?.type || null,
          narration: txn?.narration || null,
          time: txn?.time || null,
          originatingFrom: txn?.originatingFrom || null,
          merchant,
          transaction: txn,
        },
        rawPayload: event,
      };

      const result = await prisma.$transaction(async (tx) => {
        const existingTransaction = await tx.transaction.findUnique({
          where: { reference: `${transactionReference}-MERCHANT` },
        });

        if (existingTransaction) {
          return { duplicate: true };
        }

        const wallet = await tx.wallet.findFirst({
          where: { userId: aliasRef },
        });

        console.log(wallet ? `Found wallet for aliasRef ${aliasRef}` : `No wallet found for aliasRef ${aliasRef}`);

        if (!wallet) {
          console.log('No wallet found for payment, recording as PENDING');

          await tx.transaction.create({
            data: {
              reference: `${transactionReference}-MERCHANT-PENDING`,
              status: 'PENDING',
              gatewayResponse: 'Wallet credit pending',
              merchantTxRef: merchantUserId,
              event: 'nomba.payment_success',
              amount,
              currency: 'NGN',
              channel: 'wallet',
              customerEmail,
              paymentId: null,
              userId: merchantUserId,
              metadata: {
                ...baseTransactionData.metadata,
                status: 'PENDING',
              },
              rawPayload: event,
            },
          });

          return { pending: true };
        }

        const creditAmount = Number(amount - fee);

        console.log(`Crediting wallet ${wallet.id} (userId: ${wallet.userId}) with amount: ${creditAmount}`);

        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: creditAmount } },
        });

        await tx.transaction.create({
          data: {
            reference: `${transactionReference}-MERCHANT`,
            status: 'SUCCESS',
            gatewayResponse: 'Wallet credited',
            merchantTxRef: wallet.userId,
            event: 'nomba.payment.credit',
            amount,
            currency: 'NGN',
            channel: 'wallet',
            customerEmail,
            paymentId: null,
            userId: wallet.userId,
            metadata: {
              ...baseTransactionData.metadata,
              status: 'SUCCESS',
            },
            rawPayload: event,
          },
        });

        return { wallet: updatedWallet };
      });

      if (result?.duplicate) {
        return res.status(200).json({ ok: true, message: 'Duplicate webhook ignored' });
      }

      if (result?.pending) {
        return res.status(200).json({ ok: false, message: 'No matching wallet found', data: { aliasRef } });
      }

      return res.status(200).json({ ok: true, message: 'Wallet credited', wallet: { id: result.wallet.id, balance: result.wallet.balance } });
    }
  } catch (err) {
    if (err?.code === 'P2002') {
      return res.status(200).json({ ok: true, message: 'Duplicate webhook ignored' });
    }

    return res.status(500).json({ ok: false, message: err?.message || 'Server error' });
  }
};

const paystackWebhook = async (req, res) => {
};

export { paystackWebhook, nombaWebhook };
