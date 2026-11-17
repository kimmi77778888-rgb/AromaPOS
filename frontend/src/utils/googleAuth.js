/**
 * Google Identity Services (OAuth 2.0) Client Utility
 * Uses Google Identity Services (GSI) Client API
 */

export const GOOGLE_CLIENT_ID = 
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GOOGLE_CLIENT_ID) || '';

/**
 * Safely decodes Google Credential JWT into JSON profile
 */
export const decodeGoogleCredential = (credential) => {
  if (!credential) return null;
  try {
    const base64Url = credential.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Error decoding Google JWT credential:', err);
    return null;
  }
};

/**
 * Dynamically loads the official Google Identity Services (GSI) script
 */
let googleScriptPromise = null;

export const loadGoogleIdentityScript = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window unavailable'));
  if (window.google?.accounts?.id) return Promise.resolve(window.google);

  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    // Check if script element already exists
    const existing = document.getElementById('google-gsi-client');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google));
      existing.addEventListener('error', (err) => reject(err));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        resolve(window.google);
      } else {
        reject(new Error('Google Identity Services loaded but accounts.id missing'));
      }
    };
    script.onerror = (err) => {
      reject(err);
    };
    document.head.appendChild(script);
  });

  return googleScriptPromise;
};

/**
 * Initializes and renders the official Google Sign-In button into a container DOM element
 */
export const initGoogleSignInButton = async (containerElement, onCredentialSuccess, options = {}) => {
  if (!containerElement) return;

  try {
    const google = await loadGoogleIdentityScript();
    if (!google?.accounts?.id) return;

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response?.credential) {
          const profile = decodeGoogleCredential(response.credential);
          if (profile && onCredentialSuccess) {
            onCredentialSuccess({
              credential: response.credential,
              ...profile
            });
          }
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true
    });

    google.accounts.id.renderButton(containerElement, {
      type: 'standard',
      shape: 'pill',
      theme: options.theme || 'filled_black',
      text: options.text || 'signin_with',
      size: options.size || 'large',
      logo_alignment: 'left',
      width: options.width || 280
    });
  } catch (err) {
    console.warn('Google Identity button initialization warning:', err.message);
  }
};

/**
 * Triggers Google One-Tap prompt
 */
export const promptGoogleOneTap = async (onCredentialSuccess) => {
  try {
    const google = await loadGoogleIdentityScript();
    if (!google?.accounts?.id) return;
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response?.credential) {
          const profile = decodeGoogleCredential(response.credential);
          if (profile && onCredentialSuccess) {
            onCredentialSuccess({
              credential: response.credential,
              ...profile
            });
          }
        }
      }
    });
    google.accounts.id.prompt();
  } catch (err) {
    console.warn('Google One Tap prompt warning:', err.message);
  }
};

/**
 * Triggers interactive Google OAuth 2.0 Account Picker Popup
 * Fetches verified profile from https://www.googleapis.com/oauth2/v3/userinfo
 */
export const launchGoogleOAuthPopup = async (onSuccess, onError) => {
  try {
    const google = await loadGoogleIdentityScript();
    if (!google?.accounts?.oauth2) {
      if (onError) onError(new Error('Google OAuth 2.0 service not ready'));
      return;
    }

    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'email profile openid',
      prompt: 'select_account',
      callback: async (tokenResponse) => {
        if (tokenResponse?.error) {
          if (onError) onError(new Error(tokenResponse.error_description || tokenResponse.error));
          return;
        }
        if (tokenResponse?.access_token) {
          try {
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
            });
            const userInfo = await userInfoRes.json();
            if (userInfo && userInfo.email && onSuccess) {
              onSuccess({
                email: userInfo.email,
                name: userInfo.name || userInfo.email.split('@')[0],
                picture: userInfo.picture,
                sub: userInfo.sub,
                email_verified: userInfo.email_verified,
                accessToken: tokenResponse.access_token
              });
            }
          } catch (fetchErr) {
            if (onError) onError(fetchErr);
          }
        }
      },
      error_callback: (err) => {
        if (onError) onError(err);
      }
    });

    tokenClient.requestAccessToken({ prompt: 'select_account' });
  } catch (err) {
    if (onError) onError(err);
  }
};

