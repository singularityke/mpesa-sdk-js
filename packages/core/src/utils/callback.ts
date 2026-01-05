import {
  STKCallback,
  CallbackMetadata,
  C2BCallback,
  B2BCallback,
  ReversalCallback,
  TransactionStatusCallback,
  AccountBalanceCallback,
} from "../types/mpesa";

export interface ParsedCallbackData {
  merchantRequestId: string;
  CheckoutRequestID: string;
  resultCode: number;
  resultDescription: string;
  amount?: number;
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  phoneNumber?: string;
  isSuccess: boolean;
  errorMessage?: string;
}

export interface ParsedC2BCallback {
  transactionType: string;
  transactionId: string;
  transactionTime: string;
  amount: number;
  businessShortCode: string;
  billRefNumber: string;
  invoiceNumber?: string;
  msisdn: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
}

export interface CallbackHandlerOptions {
  onSuccess?: (data: ParsedCallbackData) => void | Promise<void>;
  onFailure?: (data: ParsedCallbackData) => void | Promise<void>;
  onCallback?: (data: ParsedCallbackData) => void | Promise<void>;
  onC2BConfirmation?: (data: ParsedC2BCallback) => void | Promise<void>;
  onC2BValidation?: (data: ParsedC2BCallback) => Promise<boolean>;
  onB2CResult?: (data: {
    isSuccess: boolean;
    transactionId?: string;
    amount?: number;
    recipientPhone?: string;
    charges?: number;
    errorMessage?: string;
  }) => void | Promise<void>;

  onB2BResult?: (data: {
    isSuccess: boolean;
    transactionId?: string;
    amount?: number;
    errorMessage?: string;
  }) => void | Promise<void>;

  onAccountBalanceResult?: (data: {
    isSuccess: boolean;
    workingBalance?: number;
    availableBalance?: number;
    bookedBalance?: number;
    errorMessage?: string;
  }) => void | Promise<void>;

  onTransactionStatusResult?: (data: {
    isSuccess: boolean;
    receiptNo?: string;
    amount?: number;
    completedTime?: string;
    originatorConversationId?: string;
    errorMessage?: string;
  }) => void | Promise<void>;

  onReversalResult?: (data: {
    isSuccess: boolean;
    transactionId?: string;
    errorMessage?: string;
  }) => void | Promise<void>;
  validateIp?: boolean;
  allowedIps?: string[];
  isDuplicate?: (CheckoutRequestID: string) => boolean | Promise<boolean>;
  logger?: {
    info: (message: string, data?: any) => void;
    error: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
  };
}

export class MpesaCallbackHandler {
  private options: CallbackHandlerOptions;

  // Safaricom's known IP ranges (periodically updated) - Link(https://developer.safaricom.co.ke/dashboard/apis?api=GettingStarted)
  private readonly SAFARICOM_IPS = [
    "196.201.214.200",
    "196.201.214.206",
    "196.201.213.114",
    "196.201.214.207",
    "196.201.214.208",
    "196.201.213.44",
    "196.201.212.127",
    "196.201.212.138",
    "196.201.212.129",
    "196.201.212.136",
    "196.201.212.74",
    "196.201.212.69",
  ];

  constructor(options: CallbackHandlerOptions = {}) {
    this.options = {
      validateIp: true,
      allowedIps: this.SAFARICOM_IPS,
      ...options,
    };
  }

  /**
   * Validate that the callback is from a trusted IP
   */
  validateCallbackIp(ipAddress: string): boolean {
    if (!this.options.validateIp) {
      return true;
    }

    const allowedIps = this.options.allowedIps || this.SAFARICOM_IPS;
    return allowedIps.includes(ipAddress);
  }

  /**
   * Parse STK Push callback data from M-Pesa
   */
  parseCallback(callback: STKCallback): ParsedCallbackData {
    const stkCallback = callback.Body.stkCallback;

    const parsed: ParsedCallbackData = {
      merchantRequestId: stkCallback.MerchantRequestID,
      CheckoutRequestID: stkCallback.CheckoutRequestID,
      resultCode: stkCallback.ResultCode,
      resultDescription: stkCallback.ResultDesc,
      isSuccess: stkCallback.ResultCode === 0,
      errorMessage:
        stkCallback.ResultCode !== 0
          ? this.getErrorMessage(stkCallback.ResultCode)
          : undefined,
    };

    // If transaction was successful, parse metadata
    if (stkCallback.ResultCode === 0 && stkCallback.CallbackMetadata) {
      const metadata = this.extractMetadata(stkCallback.CallbackMetadata);
      Object.assign(parsed, metadata);
    }

    return parsed;
  }

  /**
   * Parse C2B callback data
   */
  parseC2BCallback(callback: C2BCallback): ParsedC2BCallback {
    return {
      transactionType: callback.TransactionType,
      transactionId: callback.TransID,
      transactionTime: callback.TransTime,
      amount: parseFloat(callback.TransAmount),
      businessShortCode: callback.BusinessShortCode,
      billRefNumber: callback.BillRefNumber,
      invoiceNumber: callback.InvoiceNumber,
      msisdn: callback.MSISDN,
      firstName: callback.FirstName,
      middleName: callback.MiddleName,
      lastName: callback.LastName,
    };
  }

  /**
   * Extract metadata from STK callback
   */
  private extractMetadata(
    metadata: CallbackMetadata,
  ): Partial<ParsedCallbackData> {
    const result: Partial<ParsedCallbackData> = {};

    metadata.Item.forEach((item) => {
      switch (item.Name) {
        case "Amount":
          result.amount = Number(item.Value);
          break;
        case "MpesaReceiptNumber":
          result.mpesaReceiptNumber = String(item.Value);
          break;
        case "TransactionDate":
          result.transactionDate = this.formatTransactionDate(
            String(item.Value),
          );
          break;
        case "PhoneNumber":
          result.phoneNumber = String(item.Value);
          break;
      }
    });

    return result;
  }

  /**
   * Format transaction date from M-Pesa format (YYYYMMDDHHmmss) to ISO
   */
  private formatTransactionDate(dateStr: string): string {
    // Format: 20251222144900 -> 2025-12-22T14:49:00
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hours = dateStr.substring(8, 10);
    const minutes = dateStr.substring(10, 12);
    const seconds = dateStr.substring(12, 14);

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  /**
   * Check if callback indicates success
   */
  isSuccess(data: ParsedCallbackData): boolean {
    return data.resultCode === 0;
  }

  /**
   * Check if callback indicates failure
   */
  isFailure(data: ParsedCallbackData): boolean {
    return data.resultCode !== 0;
  }

  /**
   * Get a readable error message based on the code
   */
  getErrorMessage(resultCode: number): string {
    const errorMessages: Record<number, string> = {
      0: "Success",
      1: "Insufficient funds in M-Pesa account",
      17: "User cancelled the transaction",
      26: "System internal error",
      1001: "Unable to lock subscriber, a transaction is already in process",
      1019: "Transaction expired. No response from user",
      1032: "Request cancelled by user",
      1037: "Timeout in sending PIN request",
      2001: "Wrong PIN entered",
      9999: "Request cancelled by user",
    };

    return (
      errorMessages[resultCode] || `Transaction failed with code: ${resultCode}`
    );
  }

  /**
   * Handle STK Push callback and invoke appropriate handlers
   */
  async handleCallback(
    callback: STKCallback,
    ipAddress?: string,
  ): Promise<void> {
    // Validate IP if provided
    if (ipAddress && !this.validateCallbackIp(ipAddress)) {
      this.log("warn", `Invalid callback IP: ${ipAddress}`);
      throw new Error(`Invalid callback IP: ${ipAddress}`);
    }

    // Parse the callback
    const parsed = this.parseCallback(callback);

    this.log("info", "Processing STK callback", {
      CheckoutRequestID: parsed.CheckoutRequestID,
      resultCode: parsed.resultCode,
    });

    // Check for duplicates if handler provided
    if (this.options.isDuplicate) {
      const isDupe = await this.options.isDuplicate(parsed.CheckoutRequestID);
      if (isDupe) {
        this.log("warn", "Duplicate callback detected", {
          CheckoutRequestID: parsed.CheckoutRequestID,
        });
        return; // Silently ignore duplicates
      }
    }

    // Call the general callback handler if provided
    if (this.options.onCallback) {
      await this.options.onCallback(parsed);
    }

    // Call specific handlers based on success/failure
    if (this.isSuccess(parsed) && this.options.onSuccess) {
      await this.options.onSuccess(parsed);
    } else if (this.isFailure(parsed) && this.options.onFailure) {
      await this.options.onFailure(parsed);
    }
  }

  /**
   * Handle C2B validation request
   * Returns true if validation passes, false otherwise
   */
  async handleC2BValidation(callback: C2BCallback): Promise<boolean> {
    this.log("info", "Processing C2B validation", {
      transactionId: callback.TransID,
    });

    if (this.options.onC2BValidation) {
      return await this.options.onC2BValidation(
        this.parseC2BCallback(callback),
      );
    }

    // Default: accept all transactions
    return true;
  }

  /**
   * Handle C2B confirmation
   */
  async handleC2BConfirmation(callback: C2BCallback): Promise<void> {
    this.log("info", "Processing C2B confirmation", {
      transactionId: callback.TransID,
    });

    if (this.options.onC2BConfirmation) {
      await this.options.onC2BConfirmation(this.parseC2BCallback(callback));
    }
  }

  /**
   * Parse B2C callback data
   */
  parseB2CCallback(callback: B2BCallback): {
    isSuccess: boolean;
    transactionId?: string;
    amount?: number;
    recipientPhone?: string;
    charges?: number;
    errorMessage?: string;
  } {
    const result = callback.Result;
    const parsed: any = {
      isSuccess: result.ResultCode === 0,
      errorMessage:
        result.ResultCode !== 0
          ? this.getErrorMessage(result.ResultCode)
          : undefined,
    };

    if (result.ResultCode === 0 && result.ResultParameters) {
      result.ResultParameters.ResultParameter.forEach((param) => {
        switch (param.Key) {
          case "TransactionReceipt":
            parsed.transactionId = String(param.Value);
            break;
          case "TransactionAmount":
            parsed.amount = Number(param.Value);
            break;
          case "ReceiverPartyPublicName":
            parsed.recipientPhone = String(param.Value);
            break;
          case "B2CChargesPaidAccountAvailableFunds":
            parsed.charges = Number(param.Value);
            break;
        }
      });
    }

    return parsed;
  }
  /**
   * Parse B2B callback
   */
  parseB2BCallback(callback: B2BCallback): {
    isSuccess: boolean;
    transactionId?: string;
    amount?: number;
    errorMessage?: string;
  } {
    const result = callback.Result;
    const parsed: any = {
      isSuccess: result.ResultCode === 0,
      errorMessage:
        result.ResultCode !== 0
          ? this.getErrorMessage(result.ResultCode)
          : undefined,
    };

    if (result.ResultCode === 0 && result.ResultParameters) {
      result.ResultParameters.ResultParameter.forEach((param) => {
        switch (param.Key) {
          case "TransactionReceipt":
            parsed.transactionId = String(param.Value);
            break;
          case "TransactionAmount":
            parsed.amount = Number(param.Value);
            break;
        }
      });
    }

    return parsed;
  }
  /**
   * Parse Account Balance callback
   */
  parseAccountBalanceCallback(callback: AccountBalanceCallback): {
    isSuccess: boolean;
    workingBalance?: number;
    availableBalance?: number;
    bookedBalance?: number;
    errorMessage?: string;
  } {
    const result = callback.Result;
    const parsed: any = {
      isSuccess: result.ResultCode === 0,
      errorMessage:
        result.ResultCode !== 0
          ? this.getErrorMessage(result.ResultCode)
          : undefined,
    };

    if (result.ResultCode === 0 && result.ResultParameters) {
      result.ResultParameters.ResultParameter.forEach((param) => {
        switch (param.Key) {
          case "WorkingAccountAvailableFunds":
            parsed.workingBalance = Number(param.Value);
            break;
          case "AvailableBalance":
            parsed.availableBalance = Number(param.Value);
            break;
          case "BookedBalance":
            parsed.bookedBalance = Number(param.Value);
            break;
        }
      });
    }

    return parsed;
  }
  /**
   * Parse Transaction Status callback
   */
  parseTransactionStatusCallback(callback: TransactionStatusCallback): {
    isSuccess: boolean;
    receiptNo?: string;
    amount?: number;
    completedTime?: string;
    originatorConversationId?: string;
    errorMessage?: string;
  } {
    const result = callback.Result;
    const parsed: any = {
      isSuccess: result.ResultCode === 0,
      originatorConversationId: result.OriginatorConversationID,
      errorMessage:
        result.ResultCode !== 0
          ? this.getErrorMessage(result.ResultCode)
          : undefined,
    };

    if (result.ResultCode === 0 && result.ResultParameters) {
      result.ResultParameters.ResultParameter.forEach((param) => {
        switch (param.Key) {
          case "ReceiptNo":
            parsed.receiptNo = String(param.Value);
            break;
          case "TransactionAmount":
            parsed.amount = Number(param.Value);
            break;
          case "TransCompletedTime":
            parsed.completedTime = String(param.Value);
            break;
        }
      });
    }

    return parsed;
  }
  /**
   * Parse Reversal callback
   */
  parseReversalCallback(callback: ReversalCallback): {
    isSuccess: boolean;
    transactionId?: string;
    errorMessage?: string;
  } {
    const result = callback.Result;
    return {
      isSuccess: result.ResultCode === 0,
      transactionId: result.TransactionID,
      errorMessage:
        result.ResultCode !== 0
          ? this.getErrorMessage(result.ResultCode)
          : undefined,
    };
  }

  /**
   * Create a standard callback response for M-Pesa
   */
  createCallbackResponse(success: boolean = true, message?: string): object {
    return {
      ResultCode: success ? 0 : 1,
      ResultDesc: message || (success ? "Accepted" : "Rejected"),
    };
  }

  /**
   * Internal logging helper
   */
  private log(
    level: "info" | "error" | "warn",
    message: string,
    data?: any,
  ): void {
    if (this.options.logger) {
      this.options.logger[level](message, data);
    }
  }
}
