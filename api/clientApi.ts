import apiInstance from './apiInstance';
import { ENDPOINTS } from './endpoint';

export const clientBasicDetails = async (
  name: string,
  email: string,
  phoneNumber: string,
  gender?: string
) => {
  try {
    const response = await apiInstance.post(ENDPOINTS.BASIC_DETAILS, {
      name,
      email,
      phoneNumber,
      gender,
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const clientBodyInfo = async (height: string, weight: string, date_of_birth: string) => {
  try {
    const response = await apiInstance.post(ENDPOINTS.BODY_INFO, {
      height,
      weight,
      date_of_birth,
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const clientLocation = async (latitude: string, longitude: string) => {
  try {
    const response = await apiInstance.post(ENDPOINTS.LOCATION, {
      latitude,
      longitude,
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const clientSelfie = async (image: string) => {
  try {
    const formData = new FormData();
    const filename = image.split('/').pop() || 'selfie.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('selfieUpload', {
      uri: image,
      name: filename,
      type,
    } as any);

    const response = await apiInstance.post(ENDPOINTS.SELFIE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const clientGovId = async (image: string) => {
  try {
    const formData = new FormData();
    const filename = image.split('/').pop() || 'governmentId.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('governmentId', {
      uri: image,
      name: filename,
      type,
    } as any);

    const response = await apiInstance.post(ENDPOINTS.GOVERNMENT_ID, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const clientSubmit = async () => {
  try {
    const response = await apiInstance.post(ENDPOINTS.VERIFY_PENDING_CLIENT);
    console.log(response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const checkUserStep = async () => {
  try {
    const response = await apiInstance.get(ENDPOINTS.CHECK_STEP);
    console.log(response.data, new Date().toISOString());
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get Qr
export const getQr = async () => {
  try {
    const response = await apiInstance.get(ENDPOINTS.GET_QR);

    return response;
  } catch (error) {
    throw error;
  }
};

// Verify OTP for onboarding
export const clientVerifyOtp = async (otp: string, identifier?: string) => {
  const otpStr = otp.toString().trim();
  const url = ENDPOINTS.CLIENT_VERIFY_OTP;

  console.log(`📡 Trying verify OTP on ${url} with { otp: "${otpStr}" }...`);

  // 1. Try clean { otp } payload
  try {
    const response = await apiInstance.post(url, { otp: otpStr });
    console.log('✅ Verify OTP Success (clean otp):', response.data);
    return response.data;
  } catch (err: any) {
    console.log(
      '⚠️ Error on client verify-otp ({ otp }):',
      err?.response?.status,
      JSON.stringify(err?.response?.data || err?.message)
    );

    // 2. If clean { otp } failed and identifier was provided, try with { otp, identifier }
    if (identifier) {
      try {
        const bodyWithId = { otp: otpStr, identifier };
        console.log('📡 Retrying verify OTP with identifier:', JSON.stringify(bodyWithId));
        const response = await apiInstance.post(url, bodyWithId);
        console.log('✅ Verify OTP Success (with identifier):', response.data);
        return response.data;
      } catch (retryErr: any) {
        console.log(
          '⚠️ Error on client verify-otp (with identifier):',
          retryErr?.response?.status,
          JSON.stringify(retryErr?.response?.data || retryErr?.message)
        );
      }
    }

    // 3. Fallback: try with numeric OTP { otp: Number(otpStr) }
    const numericOtp = Number(otpStr);
    if (!isNaN(numericOtp)) {
      try {
        console.log('📡 Retrying verify OTP with numeric otp:', JSON.stringify({ otp: numericOtp }));
        const response = await apiInstance.post(url, { otp: numericOtp });
        console.log('✅ Verify OTP Success (numeric):', response.data);
        return response.data;
      } catch (numErr: any) {
        console.log(
          '⚠️ Error on client verify-otp (numeric):',
          numErr?.response?.status,
          JSON.stringify(numErr?.response?.data || numErr?.message)
        );
      }
    }

    throw err;
  }
};

// Resend / Send OTP for onboarding
export const clientResendOtp = async (payload?: {
  identifier?: string;
  phoneNumber?: string;
  email?: string;
}) => {
  const targetIdentifier =
    payload?.identifier || payload?.phoneNumber || payload?.email || '';

  console.log('📡 clientResendOtp called with identifier:', targetIdentifier);

  const url = ENDPOINTS.CLIENT_RESEND_OTP;

  // 1. Try with targetIdentifier
  if (targetIdentifier) {
    try {
      const body = {
        identifier: targetIdentifier,
        phoneNumber: payload?.phoneNumber,
        email: payload?.email,
      };
      console.log(`📡 Trying POST ${url} with:`, JSON.stringify(body));
      const response = await apiInstance.post(url, body);
      console.log('✅ Resend OTP Success (with identifier):', response.data);
      return response.data;
    } catch (err: any) {
      console.log(
        '⚠️ Error on client resend-otp (with identifier):',
        err?.response?.status,
        JSON.stringify(err?.response?.data)
      );

      // If identifier starts with +, also try without prefix (e.g. 10 digits)
      if (targetIdentifier.startsWith('+')) {
        const rawDigits = targetIdentifier.replace(/\D/g, '').slice(-10);
        try {
          console.log(`📡 Retrying POST ${url} with raw 10 digits:`, rawDigits);
          const retryResp = await apiInstance.post(url, { identifier: rawDigits });
          console.log('✅ Resend OTP Success (raw digits):', retryResp.data);
          return retryResp.data;
        } catch (retryErr: any) {
          console.log(
            '⚠️ Error on client resend-otp (raw digits):',
            retryErr?.response?.status,
            JSON.stringify(retryErr?.response?.data)
          );
        }
      }
    }
  }

  // 2. Fallback attempt: empty body {}
  try {
    console.log(`📡 Trying POST ${url} with empty body {}...`);
    const response = await apiInstance.post(url, {});
    console.log('✅ Resend OTP Success (empty body):', response.data);
    return response.data;
  } catch (err: any) {
    console.log(
      '❌ Resend OTP Error Detail:',
      err?.response?.status,
      JSON.stringify(err?.response?.data)
    );
    throw err;
  }
}

// Search nearby gyms (club owners)
export const searchNearbyGyms = async (params: {
  city?: string;
  latitude?: number | string;
  longitude?: number | string;
  query?: string;
}) => {
  try {
    const queryParts: string[] = [];
    if (params.city) {
      queryParts.push(`city=${encodeURIComponent(params.city)}`);
    }
    if (params.latitude !== undefined && params.latitude !== null) {
      queryParts.push(`latitude=${encodeURIComponent(params.latitude.toString())}`);
    }
    if (params.longitude !== undefined && params.longitude !== null) {
      queryParts.push(`longitude=${encodeURIComponent(params.longitude.toString())}`);
    }
    if (params.query) {
      queryParts.push(`search=${encodeURIComponent(params.query)}`);
    }

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const url = `${ENDPOINTS.SEARCH_CLUBS}${queryString}`;
    console.log('📡 Fetching nearby gyms from:', url);
    const response = await apiInstance.get(url);
    console.log('✅ Nearby gyms fetched successfully:');
    console.log('📋 [NEARBY GYMS RESPONSE]:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error fetching nearby gyms:', error);
    throw error;
  }
};

// Get single gym (club owner) detail by ID
export const getGymDetail = async (id: string) => {
  try {
    const url = `${ENDPOINTS.GET_CLUB_DETAIL}/${id}`;
    console.log('📡 Fetching gym detail from:', url);
    const response = await apiInstance.get(url);
    console.log('✅ Gym detail fetched successfully for ID:', id);
    console.log('📋 [GYM DETAIL RESPONSE]:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching gym detail:', error);
    throw error;
  }
};
