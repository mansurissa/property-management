/**
 * SMS Service - Using Pindo (Rwanda)
 * Simple function-based approach - modify this file to switch providers
 */

export interface SMSResult {
  success: boolean;
  message: string;
  messageId?: string;
}

export type SMSType =
  | 'payment_reminder'
  | 'payment_confirmation'
  | 'late_payment'
  | 'maintenance_update'
  | 'lease_expiry'
  | 'welcome'
  | 'custom';

// Pindo configuration
const PINDO_API_URL = 'https://api.pindo.io/v1/sms/';
const PINDO_API_TOKEN = process.env.PINDO_API_TOKEN || '';
const PINDO_SENDER_ID = process.env.PINDO_SENDER_ID || 'Renta';

/**
 * Generate message based on type and data
 */
const generateMessage = (type: SMSType, data: Record<string, any> = {}): string => {
  switch (type) {
    case 'payment_reminder':
      return `Hi ${data.tenantName}, this is a reminder that your rent of ${data.amount?.toLocaleString()} RWF for ${data.propertyName} is due on ${data.dueDate}. Please make payment to avoid late fees. - Renta`;

    case 'payment_confirmation':
      return `Hi ${data.tenantName}, we've received your payment of ${data.amount?.toLocaleString()} RWF. Receipt: ${data.receiptNumber}. Thank you! - Renta`;

    case 'late_payment':
      return `Hi ${data.tenantName}, your rent payment of ${data.amount?.toLocaleString()} RWF is ${data.daysOverdue} days overdue. Please pay as soon as possible to avoid further action. - Renta`;

    case 'maintenance_update': {
      const statusMessages: Record<string, string> = {
        'pending': 'has been received and is pending review',
        'in_progress': 'is now being worked on',
        'completed': 'has been completed',
        'cancelled': 'has been cancelled'
      };
      return `Hi ${data.tenantName}, your maintenance request #${data.ticketId?.slice(0, 8)} ${statusMessages[data.status] || `status: ${data.status}`}. - Renta`;
    }

    case 'lease_expiry':
      return `Hi ${data.tenantName}, your lease expires on ${data.expiryDate} (${data.daysRemaining} days). Please contact your landlord to discuss renewal. - Renta`;

    case 'welcome':
      return `Welcome to Renta, ${data.tenantName}! Your tenant account has been created. You can now access the tenant portal to view your lease details and make payments. - Renta`;

    case 'custom':
      return data.message || '';

    default:
      return '';
  }
};

/**
 * Main SMS sending function
 * To switch providers: modify only this function's implementation
 *
 * @param to - Phone number with country code (e.g., +250788123456)
 * @param type - Type of SMS (determines message template)
 * @param data - Data to populate the message template
 * @param customMessage - Custom message (only used when type is 'custom')
 */
export const sendSMS = async (
  to: string,
  type: SMSType,
  data: Record<string, any> = {},
  customMessage?: string
): Promise<SMSResult> => {
  // Generate message based on type
  const message = type === 'custom' && customMessage
    ? customMessage
    : generateMessage(type, data);

  if (!message) {
    return {
      success: false,
      message: 'Failed to generate SMS message'
    };
  }

  // Development mode - log to console instead of sending
  if (!PINDO_API_TOKEN || process.env.NODE_ENV === 'development') {
    console.log('\n========== SMS (Development Mode) ==========');
    console.log(`To: ${to}`);
    console.log(`Type: ${type}`);
    console.log(`Message: ${message}`);
    console.log('=============================================\n');

    return {
      success: true,
      message: 'SMS logged to console (development mode)',
      messageId: `dev-sms-${Date.now()}`
    };
  }

  // Production - send via Pindo
  // To switch to another provider, replace this section
  try {
    const response = await fetch(PINDO_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINDO_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: to,
        text: message,
        sender: PINDO_SENDER_ID
      })
    });

    const result = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: 'SMS sent successfully',
        messageId: result.message_id || result.id
      };
    }

    console.error('Pindo SMS error:', result);
    return {
      success: false,
      message: result.message || 'Failed to send SMS'
    };
  } catch (error) {
    console.error('SMS sending error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send SMS'
    };
  }
};

// Convenience functions for specific SMS types

export const sendPaymentReminderSMS = (
  phone: string,
  tenantName: string,
  amount: number,
  dueDate: string,
  propertyName: string
): Promise<SMSResult> => {
  return sendSMS(phone, 'payment_reminder', { tenantName, amount, dueDate, propertyName });
};

export const sendPaymentConfirmationSMS = (
  phone: string,
  tenantName: string,
  amount: number,
  receiptNumber: string
): Promise<SMSResult> => {
  return sendSMS(phone, 'payment_confirmation', { tenantName, amount, receiptNumber });
};

export const sendLatePaymentNoticeSMS = (
  phone: string,
  tenantName: string,
  amount: number,
  daysOverdue: number
): Promise<SMSResult> => {
  return sendSMS(phone, 'late_payment', { tenantName, amount, daysOverdue });
};

export const sendMaintenanceUpdateSMS = (
  phone: string,
  tenantName: string,
  ticketId: string,
  status: string
): Promise<SMSResult> => {
  return sendSMS(phone, 'maintenance_update', { tenantName, ticketId, status });
};

export const sendLeaseExpiryReminderSMS = (
  phone: string,
  tenantName: string,
  expiryDate: string,
  daysRemaining: number
): Promise<SMSResult> => {
  return sendSMS(phone, 'lease_expiry', { tenantName, expiryDate, daysRemaining });
};

export const sendWelcomeSMS = (
  phone: string,
  tenantName: string
): Promise<SMSResult> => {
  return sendSMS(phone, 'welcome', { tenantName });
};

export const sendCustomSMS = (
  phone: string,
  message: string
): Promise<SMSResult> => {
  return sendSMS(phone, 'custom', {}, message);
};
