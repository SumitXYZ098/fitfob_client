const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const ENDPOINTS = {
  REGISTER: `${BASE_URL}/api/register-with-role`,
  RESENDOTP: `${BASE_URL}/api/resend-register-otp`,
  VERIFY_OTP: `${BASE_URL}/api/verify-register-otp`,
  LOGIN: `${BASE_URL}/api/login`,
  FORGOT_SEND_OTP: `${BASE_URL}/api/auth/forgot-password`,
  FORGOT_RESEND_OTP: `${BASE_URL}/api/auth/resend-reset-otp`,
  FORGOT_VERIFY_OTP: `${BASE_URL}/api/auth/verify-otp`,
  FORGOT_SET_PASSWORD: `${BASE_URL}/api/auth/reset-password`,
  GOOGLE_SIGNUP: `${BASE_URL}/api/client/google`,
  FACEBOOK_SIGNUP: `${BASE_URL}/api/client/facebook`,

  // Basic Details
  BASIC_DETAILS: `${BASE_URL}/api/pending-client/basic-info`,
  BODY_INFO: `${BASE_URL}/api/pending-client/body-info`,
  LOCATION: `${BASE_URL}/api/pending-client/location`,
  SELFIE: `${BASE_URL}/api/pending-client/selfie`,
  GOVERNMENT_ID: `${BASE_URL}/api/pending-client/government-id`,
  VERIFY_PENDING_CLIENT: `${BASE_URL}/api/pending-client/verify`,
  CHECK_STEP: `${BASE_URL}/api/pending-client/me`,
  CLIENT_VERIFY_OTP: `${BASE_URL}/api/pending-client/verify-otp`,
  CLIENT_RESEND_OTP: `${BASE_URL}/api/pending-client/resend-otp`,


  // Dashboard

  // Clubs & Search
  SEARCH_CLUBS: `${BASE_URL}/api/club-owners/search`,
  GET_CLUB_DETAIL: `${BASE_URL}/api/club-owners/client`,
  GET_QR: `${BASE_URL}/api/client-details/me/qr`,

  // Notifications
  REGISTER_DEVICE_TOKEN: `${BASE_URL}/api/device-tokens/register`,
  UNREGISTER_DEVICE_TOKEN: `${BASE_URL}/api/device-tokens/unregister`,
};
