import { createMpesa } from "@singularity-payments/express";
import { config } from "dotenv";
config();
export const mpesa = createMpesa(
  {
    consumerKey: process.env.MPESA_CONSUMER_KEY!,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
    passkey: process.env.MPESA_PASSKEY!,
    shortcode: process.env.MPESA_SHORTCODE!,
    environment:
      (process.env.MPESA_ENVIRONMENT as "sandbox" | "production") || "sandbox",
    callbackUrl: process.env.MPESA_CALLBACK_URL!,

    // Required for B2C, B2B, Reversal, Transaction Status, and Account Balance
    initiatorName: "testapi",
    securityCredential: process.env.MPESA_SECURITY_CREDENTIAL!,
    resultUrl: process.env.MPESA_RESULT_URL!,
    timeoutUrl: process.env.MPESA_TIMEOUT_URL!,
  },
  {
    callbackOptions: {
      validateIp: true,
      onSuccess: async (data) => {
        console.log("Payment successful:", {
          amount: data.amount,
          phone: data.phoneNumber,
          receipt: data.mpesaReceiptNumber,
          transactionDate: data.transactionDate,
        });

        // TODO: Save to database
        // await db.transaction.update({
        //   where: { CheckoutRequestID: data.CheckoutRequestID },
        //   data: { status: 'completed', mpesaReceiptNumber: data.mpesaReceiptNumber }
        // });
      },
      onFailure: async (data) => {
        console.log(" Payment failed:", {
          resultCode: data.resultCode,
          resultDesc: data.resultDescription,
        });

        // TODO: Update database
      },
    },
  },
);
