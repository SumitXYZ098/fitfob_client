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

// Send Otp for onboarding
export const clientSendOtp = async (identifier?: string) => {
  const url = ENDPOINTS.CLIENT_SEND_OTP;
  try {
    const response = await apiInstance.post(url, { identifier });
    console.log('✅ Send OTP Success:', response.data);
    return response.data;
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
    const hasCity = Boolean(params.city && params.city.trim());

    if (hasCity) {
      queryParts.push(`city=${encodeURIComponent(params.city!.trim())}`);
    } else {
      // Only include coordinates if city is not provided
      if (params.latitude !== undefined && params.latitude !== null && params.latitude !== '') {
        queryParts.push(`latitude=${encodeURIComponent(params.latitude.toString())}`);
      }
      if (params.longitude !== undefined && params.longitude !== null && params.longitude !== '') {
        queryParts.push(`longitude=${encodeURIComponent(params.longitude.toString())}`);
      }
    }

    if (params.query && params.query.trim()) {
      queryParts.push(`search=${encodeURIComponent(params.query.trim())}`);
    }

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const url = `${ENDPOINTS.SEARCH_CLUBS}${queryString}`;
    console.log('📡 Fetching nearby gyms from:', url);

    const response = await apiInstance.get(url);
    console.log('✅ Nearby gyms fetched successfully from:', url);
    return response?.data ?? [];
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.response?.status === 400) {
      console.log('ℹ️ No clubs found for search criteria (404/400), returning empty list');
      return [];
    }
    console.error('❌ Error fetching nearby gyms:', error?.response?.data || error.message);
    return [];
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

// ─── Favorites API ───────────────────────────────────────────────────────────

// 1. Get all client favorites: GET /api/client-detail/favorites
export const getFavorites = async () => {
  try {
    console.log('📡 Fetching favorites from:', ENDPOINTS.FAVORITES);
    const response = await apiInstance.get(ENDPOINTS.FAVORITES);
    console.log('✅ Favorites fetched successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching favorites:', error?.response?.data || error.message);
    throw error;
  }
};

// 2. Add gym to favorites: POST /api/client-detail/favorites/{club documentId}
export const addFavorite = async (clubDocumentId: string) => {
  if (!clubDocumentId) {
    throw new Error('Club document ID is required to add favorite');
  }
  const url = `${ENDPOINTS.FAVORITES}/${clubDocumentId}`;
  console.log('📡 Adding favorite at:', url);
  try {
    const response = await apiInstance.post(url);
    console.log('✅ Added to favorites successfully:', response.data);
    return response.data;
  } catch (postErr: any) {
    // If backend only allows PUT, fallback gracefully
    if (postErr?.response?.status === 405) {
      console.log('⚠️ POST returned 405, retrying add favorite with PUT...');
      const putResp = await apiInstance.put(url);
      return putResp.data;
    }
    console.error('❌ Error adding favorite:', postErr?.response?.data || postErr.message);
    throw postErr;
  }
};

// 3. Remove gym from favorites: POST/DELETE /api/client-detail/favorites/remove/{club documentId}
export const removeFavorite = async (clubDocumentId: string) => {
  if (!clubDocumentId) {
    throw new Error('Club document ID is required to remove favorite');
  }
  const url = `${ENDPOINTS.FAVORITES_REMOVE}/${clubDocumentId}`;
  console.log('📡 Removing favorite at:', url);
  try {
    // Try POST first as /remove/:id URL pattern is typical for POST endpoints
    const response = await apiInstance.post(url);
    console.log('✅ Removed from favorites successfully (POST):', response.data);
    return response.data;
  } catch (postErr: any) {
    // If 405 Method Not Allowed or 404, fallback to DELETE
    if (postErr?.response?.status === 405 || postErr?.response?.status === 404) {
      console.log('⚠️ POST returned 405/404, retrying remove favorite with DELETE...');
      try {
        const delResp = await apiInstance.delete(url);
        console.log('✅ Removed from favorites successfully (DELETE):', delResp.data);
        return delResp.data;
      } catch (delErr: any) {
        console.error('❌ Error removing favorite (DELETE):', delErr?.response?.data || delErr.message);
        throw delErr;
      }
    }
    console.error('❌ Error removing favorite:', postErr?.response?.data || postErr.message);
    throw postErr;
  }
};
