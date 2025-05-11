
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface UserNotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  emailAddress: string;
  phoneNumber: string;
  alertLevel: string;
  emailVerified: boolean;
}

export interface NotificationDeliveryStatus {
  email: boolean;
  sms: boolean;
}

export interface NotificationResponse {
  success: boolean;
  notification_id?: string;
  email_sent: boolean;
  sms_sent: boolean;
  email_details?: any;
  sms_details?: any;
  email_error?: string;
  sms_error?: string;
}
