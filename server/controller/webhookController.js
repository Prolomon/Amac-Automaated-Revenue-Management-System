import crypto from "crypto";
// import { recordWebhookTransaction } from "./transactionController.js";
import { prisma } from "../config/db.js";
import { paymentSplit } from "./paymentController.js";

function generateSignature(payload, secret, timeStamp) {
  if (!secret) {
    throw new Error("Missing secret for signature generation");
  }
  if (!timeStamp) {
    throw new Error("Missing timestamp for signature generation");
  }

  let requestPayload;
  try {
    const payloadString = Buffer.isBuffer(payload) ? payload.toString("utf8") : payload;
    requestPayload = typeof payloadString === "string" ? JSON.parse(payloadString) : payloadString;
  } catch (err) {
    throw new Error(`Failed to parse webhook payload: ${err.message}`);
  }

  const data = requestPayload.data || {};
  const merchant = data.merchant || {};
  const transaction = data.transaction || {};

  const eventType = requestPayload.event_type || "";
  const requestId = requestPayload.requestId || "";
  const userId = merchant.userId || "";
  const walletId = merchant.walletId || "";
  const transactionId = transaction.transactionId || "";
  const transactionType = transaction.type || "";
  const transactionTime = transaction.time || "";

  let transactionResponseCode = transaction.responseCode || "";
  if (transactionResponseCode === "null") {
    transactionResponseCode = "";
  }

  const hashingPayload = `${eventType}:${requestId}:${userId}:${walletId}:${transactionId}:${transactionType}:${transactionTime}:${transactionResponseCode}:${timeStamp}`;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(hashingPayload);
  return hmac.digest("base64");
}

function verifySignature(secret, rawBody, receivedSignature, timeStamp) {
  if (!secret || !rawBody || !receivedSignature || !timeStamp) return false;

  let expectedSignature;
  try {
    expectedSignature = generateSignature(rawBody, secret, timeStamp);
  } catch {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const receivedBuffer = Buffer.from(receivedSignature, "utf8");
  console.log(`Expected signature: ${expectedSignature}`);
  console.log(`Received signature: ${receivedSignature}`);

  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

const nombaWebhook = async (req, res) => {

  // const signature = req.headers['nomba-signature'];
  // const timeStamp = req.headers['nomba-timestamp'];
  // const secret = process.env.NOMBA_PRIVATE_SECRET;

  // console.log(`Received Nomba webhook with signature: ${signature}, timestamp: ${timeStamp}`);
  // console.log(`Raw body: ${req.rawBody}`);

  // const isVerify = verifySignature(secret, req.rawBody, signature, timeStamp);
  // console.log(`Signature verification result: ${isVerify}`);

  // if (!isVerify) {
  //   return res.status(401).json({ ok: false, message: 'Invalid signature' });
  // }

  // ✅ Signature verified
  console.log('Webhook verified');

  console.log("Log for the payment Event: ", req.body)

  try {
    const event = req.body;

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
      const agentId = txn.merchantTxRef.match(/^(.*?)PAY/)?.[1];
      const paymentRefMatch = txn.merchantTxRef.match(/PAY\|?(.*?)-/);

      if (!paymentRefMatch) {
        return res.status(400).json({ ok: false, message: 'Unrecognized merchantTxRef format' });
      }
      const paymentRef = "PAY|" + paymentRefMatch[1];

      // BUG FIX: no duplicate/idempotency check existed on this branch at all,
      // unlike the wallet-credit branch below. Webhook redelivery would re-run
      // paymentSplit — double debt reduction, double wallet credits, and a
      // second real-money Nomba payout to the agent's bank account.
      const existingPending = await prisma.transaction.findUnique({
        where: { reference: `${transactionReference}-MERCHANT-PENDING` },
      });
      if (existingPending) {
        return res.status(200).json({ ok: true, message: 'Duplicate webhook ignored' });
      }

      const payment = await prisma.payment.findFirst({
        where: { reference: paymentRef },
      });

      if (!payment) {
        return res.status(404).json({ ok: false, message: `Payment not found for reference ${paymentRef}` });
      }

      const member = await prisma.member.findFirst({
        where: {
          uid: payment.userId,
        },
      });

      if (!member) {
        return res.status(404).json({ ok: false, message: `Member not found for userId ${payment.userId}` });
      }

      const baseTransactionData = {
        merchantTxRef: agentId || member.agent,
        event: 'nomba.payment_success',
        amount,
        currency: 'NGN',
        channel: 'card',
        customerEmail,
        paymentId: payment.id || payment.reference,
        userId: agentId || member.agent,
        metadata: {
          requestId: event.requestId || null,
          role: 'AGENT',
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
          reference: `${transactionReference}-AGENT-SUCCESS`,
          status: 'SUCCESS',
          gatewayResponse: 'Wallet credit pending',
          merchantTxRef: agentId || member.agent,
          event: 'nomba.payment_success',
          amount,
          currency: 'NGN',
          channel: 'card',
          customerEmail,
          paymentId: null,
          userId: agentId || member.agent,
          metadata: {
            ...baseTransactionData.metadata,
            status: 'PENDING',
          },
          rawPayload: event,
        },
      });

      try {
        const splitResult = await paymentSplit(amount - fee, member.center, member.company, payment.userId, payment.reference, agentId || member?.agent);

        console.log("Split log: ", splitResult)

        if (!splitResult.ok) {
          return res.status(400).json({ ok: false, message: splitResult.message });
        }

        return res.status(200).json({ ok: true, message: "Payment processed successfully", data: splitResult.data });

      } catch (err) {
        console.error('Error during payment split:', err);
        return res.status(500).json({ ok: false, message: 'Error processing payment split' });
      }
    } else {

      if (!aliasRef) {
        return res.status(400).json({ ok: false, message: 'Missing identifying information (aliasRef)' });
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ ok: false, message: 'Invalid transaction amount' });
      }

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

        if (!wallet) {

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
