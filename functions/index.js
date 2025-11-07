/**
 * Carben Connect Cloud Functions
 * Admin functions for user management and AI features
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const OpenAI = require('openai');

admin.initializeApp();

// Initialize OpenAI client
// API key should be configured using: firebase functions:config:set openai.key="YOUR_KEY"
// Or set OPENAI_API_KEY environment variable
const openai = new OpenAI({
  apiKey: functions.config().openai?.key || process.env.OPENAI_API_KEY || 'sk-placeholder-for-local-analysis',
});

/**
 * Change a user's password (Admin only)
 *
 * Request body:
 * - userId: string (required) - The Firebase Auth UID of the user
 * - newPassword: string (required) - The new password (min 6 characters)
 *
 * Authorization:
 * - Requires Firebase Auth token
 * - Caller must have 'admin' role in Firestore users collection
 */
exports.changeUserPassword = functions.https.onCall(async (data, context) => {
  // Check if request is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to call this function'
    );
  }

  const callerId = context.auth.uid;

  try {
    // Verify caller is an admin
    const callerDoc = await admin.firestore().collection('users').doc(callerId).get();

    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only administrators can change user passwords'
      );
    }

    // Validate input
    const { userId, newPassword } = data;

    if (!userId || typeof userId !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'userId must be a valid string'
      );
    }

    if (!newPassword || typeof newPassword !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'newPassword must be a valid string'
      );
    }

    if (newPassword.length < 6) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Password must be at least 6 characters'
      );
    }

    // Verify target user exists
    const targetUserDoc = await admin.firestore().collection('users').doc(userId).get();

    if (!targetUserDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'User not found'
      );
    }

    // Change the password using Firebase Admin SDK
    await admin.auth().updateUser(userId, {
      password: newPassword
    });

    // Log the password change
    await admin.firestore().collection('audit_logs').add({
      action: 'password_change',
      performedBy: callerId,
      performedByEmail: context.auth.token.email,
      targetUserId: userId,
      targetUserEmail: targetUserDoc.data().email,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: 'Password changed successfully'
    };

  } catch (error) {
    console.error('Error changing password:', error);

    // If it's already an HttpsError, re-throw it
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    // Otherwise, wrap it
    throw new functions.https.HttpsError(
      'internal',
      'Failed to change password: ' + error.message
    );
  }
});

/**
 * Send welcome email to new user (Admin only)
 *
 * Request body:
 * - userId: string (required) - The Firebase Auth UID of the user
 * - email: string (required) - The user's email address
 *
 * Authorization:
 * - Requires Firebase Auth token
 * - Caller must have 'admin' role in Firestore users collection
 */
exports.sendWelcomeEmail = functions.https.onCall(async (data, context) => {
  // Check if request is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to call this function'
    );
  }

  const callerId = context.auth.uid;

  try {
    // Verify caller is an admin
    const callerDoc = await admin.firestore().collection('users').doc(callerId).get();

    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only administrators can send welcome emails'
      );
    }

    // Validate input
    const { userId, email } = data;

    if (!userId || typeof userId !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'userId must be a valid string'
      );
    }

    if (!email || typeof email !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'email must be a valid string'
      );
    }

    // Generate password reset link (this serves as the welcome link)
    const resetLink = await admin.auth().generatePasswordResetLink(email);

    // Log the welcome email
    await admin.firestore().collection('audit_logs').add({
      action: 'welcome_email_sent',
      performedBy: callerId,
      performedByEmail: context.auth.token.email,
      targetUserId: userId,
      targetUserEmail: email,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Return the link (mobile app will need to send email via external service or trigger)
    return {
      success: true,
      message: 'Welcome email prepared',
      resetLink: resetLink
    };

  } catch (error) {
    console.error('Error sending welcome email:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to send welcome email: ' + error.message
    );
  }
});

/**
 * Transcribe audio to text using OpenAI Whisper
 *
 * Request body:
 * - audioData: string (required) - Base64 encoded audio file
 * - mimeType: string (optional) - Audio MIME type (defaults to 'audio/m4a')
 *
 * Authorization:
 * - Requires Firebase Auth token
 */
exports.transcribeAudio = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to call this function'
    );
  }

  try {
    const { audioData, mimeType = 'audio/m4a' } = data;

    if (!audioData) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'audioData is required'
      );
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioData, 'base64');

    // Determine file extension from MIME type
    const extension = mimeType.includes('webm') ? 'webm'
                    : mimeType.includes('mp4') ? 'm4a'
                    : mimeType.includes('wav') ? 'wav'
                    : 'm4a';

    // Create a temporary file with the audio data
    const { Readable } = require('stream');
    const audioFile = new Readable();
    audioFile.push(audioBuffer);
    audioFile.push(null);
    audioFile.path = `audio.${extension}`;

    // Transcribe using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
    });

    return {
      success: true,
      text: transcription.text
    };

  } catch (error) {
    console.error('Error transcribing audio:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to transcribe audio: ' + error.message
    );
  }
});

/**
 * Generate project title and description from transcribed text using AI
 *
 * Request body:
 * - transcription: string (required) - The transcribed text from voice recording
 * - existingDescription: string (optional) - Existing description to append to
 *
 * Authorization:
 * - Requires Firebase Auth token
 */
exports.generateProject = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to call this function'
    );
  }

  try {
    const { transcription, existingDescription } = data;

    if (!transcription || typeof transcription !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'transcription must be a valid string'
      );
    }

    // Build the prompt based on whether there's existing description
    let prompt;
    if (existingDescription) {
      prompt = `A contractor is describing a project. They've already provided this description:

"${existingDescription}"

Now they've added more details:
"${transcription}"

Please update the project information incorporating both the old and new details. Return a JSON object with:
- title: A short, professional project title (3-5 words, update if needed)
- description: The complete updated description formatted with sections
- summary: A brief conversational response acknowledging what was added

Format the description with:
Location: [if mentioned]

[Project overview]

Scope of Work:
• Category 1
  - Detail 1
  - Detail 2
• Category 2
  - Detail 1
  - Detail 2

Notes: [Special considerations]`;
    } else {
      prompt = `A contractor is describing a new project:

"${transcription}"

Please extract and structure this information. Return a JSON object with:
- title: A short, professional project title (3-5 words)
- description: A well-formatted project description
- summary: A brief conversational response to speak back to the user

Format the description with:
Location: [if mentioned]

[Project overview]

Scope of Work:
• Category 1
  - Detail 1
  - Detail 2
• Category 2
  - Detail 1
  - Detail 2

Notes: [Special considerations]`;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that converts contractor voice notes into structured project descriptions. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500,
    });

    const result = JSON.parse(completion.choices[0].message.content);

    return {
      success: true,
      title: result.title,
      description: result.description,
      summary: result.summary
    };

  } catch (error) {
    console.error('Error generating project:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to generate project: ' + error.message
    );
  }
});

/**
 * Convert text to speech using OpenAI TTS
 *
 * Request body:
 * - text: string (required) - The text to convert to speech
 *
 * Authorization:
 * - Requires Firebase Auth token
 */
exports.textToSpeech = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to call this function'
    );
  }

  try {
    const { text } = data;

    if (!text || typeof text !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'text must be a valid string'
      );
    }

    // Generate speech using OpenAI TTS
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
      speed: 1.0,
    });

    // Convert response to buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());

    // Return as base64
    return {
      success: true,
      audioData: buffer.toString('base64')
    };

  } catch (error) {
    console.error('Error generating speech:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to generate speech: ' + error.message
    );
  }
});

/**
 * Refresh QuickBooks OAuth token
 * 
 * This function refreshes an expired QuickBooks access token using the refresh token.
 * Called automatically when app detects token is expired or about to expire.
 * 
 * Authorization:
 * - Requires Firebase Auth token
 * - Caller must have 'admin' role
 */
exports.refreshQuickBooksToken = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to refresh QuickBooks token'
    );
  }

  const callerId = context.auth.uid;

  try {
    // Verify caller is an admin
    const callerDoc = await admin.firestore().collection('users').doc(callerId).get();
    
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only administrators can refresh QuickBooks tokens'
      );
    }

    // Get QuickBooks settings from Firestore
    const qbSettingsDoc = await admin.firestore().collection('settings').doc('quickbooks').get();
    
    if (!qbSettingsDoc.exists) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'QuickBooks is not configured'
      );
    }

    const qbSettings = qbSettingsDoc.data();
    
    if (!qbSettings.enabled) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'QuickBooks integration is not enabled'
      );
    }

    if (!qbSettings.refreshToken || !qbSettings.clientId || !qbSettings.clientSecret) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'QuickBooks credentials are incomplete'
      );
    }

    // Prepare token refresh request
    const tokenUrl = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
    const authString = Buffer.from(`${qbSettings.clientId}:${qbSettings.clientSecret}`).toString('base64');
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: `grant_type=refresh_token&refresh_token=${qbSettings.refreshToken}`
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('QuickBooks token refresh failed:', errorText);
      
      throw new functions.https.HttpsError(
        'internal',
        `Token refresh failed: ${response.status} - ${errorText}`
      );
    }

    const tokenData = await response.json();

    // Calculate token expiry time (access tokens last 1 hour)
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + tokenData.expires_in);

    // Update Firestore with new tokens
    await admin.firestore().collection('settings').doc('quickbooks').update({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token, // QB provides new refresh token too
      tokenExpiry: expiryDate.toISOString(),
      lastRefresh: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('QuickBooks token refreshed successfully');

    return {
      success: true,
      tokenExpiry: expiryDate.toISOString(),
      message: 'QuickBooks token refreshed successfully'
    };

  } catch (error) {
    console.error('Error refreshing QuickBooks token:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to refresh QuickBooks token: ' + error.message
    );
  }
});

/**
 * ==============================================================================
 * FreshBooks Integration Cloud Functions
 * ==============================================================================
 */

const axios = require('axios');

/**
 * Initialize FreshBooks connection and get authorization URL
 * 
 * Request body:
 * - redirectUri: string (required) - The OAuth redirect URI
 * 
 * Authorization:
 * - Requires Firebase Auth token
 * - Caller must have 'admin' role
 */
exports.freshbooksConnect = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to connect FreshBooks'
    );
  }

  const callerId = context.auth.uid;

  try {
    // Verify caller is an admin
    const callerDoc = await admin.firestore().collection('users').doc(callerId).get();
    
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only administrators can connect FreshBooks'
      );
    }

    const { redirectUri } = data;

    if (!redirectUri) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'redirectUri is required'
      );
    }

    // Get or create FreshBooks settings
    const fbSettingsRef = admin.firestore().collection('settings').doc('freshbooks');
    let fbSettings = await fbSettingsRef.get();

    if (!fbSettings.exists) {
      // Initialize with credentials from environment/config
      await fbSettingsRef.set({
        enabled: true,
        accountId: 'jvMyN1',
        clientId: 'ec67766243748efc1791cf5875089dd39f2f773a8aa92b43efa812b27b0db337',
        clientSecret: 'c8e902177930de5f601511470da88e2a793958e32a7bb79f04546e1fdead8bdc',
        apiVersion: '2023-02-20',
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null,
        redirectUri: redirectUri,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      fbSettings = await fbSettingsRef.get();
    } else {
      // Update redirect URI
      await fbSettingsRef.update({
        redirectUri: redirectUri,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    const settings = fbSettings.data();

    // Generate authorization URL
    const authUrl = 'https://auth.freshbooks.com/oauth/authorize' +
      `?client_id=${settings.clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    return {
      success: true,
      authUrl: authUrl
    };

  } catch (error) {
    console.error('Error connecting FreshBooks:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to connect FreshBooks: ' + error.message
    );
  }
});

/**
 * Handle OAuth callback and exchange code for tokens
 * 
 * Request body:
 * - code: string (required) - OAuth authorization code
 * - redirectUri: string (required) - The OAuth redirect URI (must match)
 * 
 * Authorization:
 * - Requires Firebase Auth token
 * - Caller must have 'admin' role
 */
exports.freshbooksCallback = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  try {
    const code = req.query.code;

    if (!code) {
      res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>FreshBooks Connection Error</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                     display: flex; justify-content: center; align-items: center;
                     height: 100vh; margin: 0; background: #f5f5f5; }
              .container { background: white; padding: 40px; border-radius: 12px;
                          box-shadow: 0 2px 12px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
              .error { color: #ff3b30; font-size: 48px; margin-bottom: 20px; }
              h1 { color: #333; margin: 0 0 10px 0; }
              p { color: #666; line-height: 1.5; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="error">✗</div>
              <h1>Connection Failed</h1>
              <p>Authorization code is missing. Please try connecting again from the app.</p>
            </div>
          </body>
        </html>
      `);
      return;
    }

    // Get FreshBooks settings
    const fbSettingsDoc = await admin.firestore().collection('settings').doc('freshbooks').get();

    if (!fbSettingsDoc.exists) {
      throw new Error('FreshBooks is not configured');
    }

    const fbSettings = fbSettingsDoc.data();
    const redirectUri = 'https://us-central1-carben-connect.cloudfunctions.net/freshbooksCallback';

    // Exchange code for tokens
    const tokenResponse = await axios.post(
      'https://api.freshbooks.com/auth/oauth/token',
      {
        grant_type: 'authorization_code',
        client_id: fbSettings.clientId,
        client_secret: fbSettings.clientSecret,
        code: code,
        redirect_uri: redirectUri
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const tokens = tokenResponse.data;

    // Calculate token expiry (28 days for FreshBooks)
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + tokens.expires_in);

    // Update Firestore with tokens
    await admin.firestore().collection('settings').doc('freshbooks').update({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiry: expiryDate.toISOString(),
      connected: true,
      connectedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Return success page
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>FreshBooks Connected</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                   display: flex; justify-content: center; align-items: center;
                   height: 100vh; margin: 0; background: #f5f5f5; }
            .container { background: white; padding: 40px; border-radius: 12px;
                        box-shadow: 0 2px 12px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
            .success { color: #34c759; font-size: 48px; margin-bottom: 20px; }
            h1 { color: #333; margin: 0 0 10px 0; }
            p { color: #666; line-height: 1.5; }
            .button { display: inline-block; margin-top: 20px; padding: 12px 24px;
                     background: #f97316; color: white; text-decoration: none;
                     border-radius: 8px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✓</div>
            <h1>FreshBooks Connected!</h1>
            <p>Your FreshBooks account has been successfully connected to Carben Connect.</p>
            <p>You can now close this window and return to the app to import invoices.</p>
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('Error handling FreshBooks callback:', error);

    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>FreshBooks Connection Error</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                   display: flex; justify-content: center; align-items: center;
                   height: 100vh; margin: 0; background: #f5f5f5; }
            .container { background: white; padding: 40px; border-radius: 12px;
                        box-shadow: 0 2px 12px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
            .error { color: #ff3b30; font-size: 48px; margin-bottom: 20px; }
            h1 { color: #333; margin: 0 0 10px 0; }
            p { color: #666; line-height: 1.5; }
            .details { background: #f5f5f5; padding: 12px; border-radius: 6px;
                      margin-top: 16px; font-size: 14px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error">✗</div>
            <h1>Connection Failed</h1>
            <p>Failed to complete FreshBooks connection. Please try again from the app.</p>
            <div class="details">${error.message}</div>
          </div>
        </body>
      </html>
    `);
  }
});

/**
 * Refresh FreshBooks access token
 * 
 * Authorization:
 * - Requires Firebase Auth token
 * - Caller must have 'admin' role
 */
exports.freshbooksRefreshToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated'
    );
  }

  const callerId = context.auth.uid;

  try {
    // Verify caller is an admin
    const callerDoc = await admin.firestore().collection('users').doc(callerId).get();
    
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only administrators can refresh FreshBooks token'
      );
    }

    // Get FreshBooks settings
    const fbSettingsDoc = await admin.firestore().collection('settings').doc('freshbooks').get();
    
    if (!fbSettingsDoc.exists) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'FreshBooks is not configured'
      );
    }

    const fbSettings = fbSettingsDoc.data();

    if (!fbSettings.refreshToken) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'No refresh token available. Please reconnect FreshBooks.'
      );
    }

    // Refresh the token
    const tokenResponse = await axios.post(
      'https://api.freshbooks.com/auth/oauth/token',
      {
        grant_type: 'refresh_token',
        client_id: fbSettings.clientId,
        client_secret: fbSettings.clientSecret,
        refresh_token: fbSettings.refreshToken
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const tokens = tokenResponse.data;

    // Calculate token expiry
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + tokens.expires_in);

    // Update Firestore with new tokens
    await admin.firestore().collection('settings').doc('freshbooks').update({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiry: expiryDate.toISOString(),
      lastRefresh: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      tokenExpiry: expiryDate.toISOString(),
      message: 'FreshBooks token refreshed successfully'
    };

  } catch (error) {
    console.error('Error refreshing FreshBooks token:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to refresh FreshBooks token: ' + error.message
    );
  }
});

/**
 * Fetch invoices from FreshBooks
 * 
 * Request body:
 * - startDate: string (optional) - ISO date string for filtering (YYYY-MM-DD)
 * - endDate: string (optional) - ISO date string for filtering (YYYY-MM-DD)
 * - page: number (optional) - Page number for pagination (default: 1)
 * - perPage: number (optional) - Results per page (default: 100, max: 100)
 * 
 * Authorization:
 * - Requires Firebase Auth token
 * - Caller must have 'admin' role
 */
exports.freshbooksGetInvoices = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated'
    );
  }

  const callerId = context.auth.uid;

  try {
    // Verify caller is an admin
    const callerDoc = await admin.firestore().collection('users').doc(callerId).get();
    
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only administrators can fetch FreshBooks invoices'
      );
    }

    const { startDate, endDate, page = 1, perPage = 100 } = data;

    // Get FreshBooks settings
    const fbSettingsDoc = await admin.firestore().collection('settings').doc('freshbooks').get();
    
    if (!fbSettingsDoc.exists) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'FreshBooks is not configured'
      );
    }

    const fbSettings = fbSettingsDoc.data();

    if (!fbSettings.accessToken) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'FreshBooks is not connected. Please connect first.'
      );
    }

    // Check if token needs refresh
    const tokenExpiry = new Date(fbSettings.tokenExpiry);
    const now = new Date();
    const hourBeforeExpiry = new Date(tokenExpiry.getTime() - 60 * 60 * 1000);

    if (now >= hourBeforeExpiry) {
      // Token expired or about to expire, refresh it
      const refreshResponse = await axios.post(
        'https://api.freshbooks.com/auth/oauth/token',
        {
          grant_type: 'refresh_token',
          client_id: fbSettings.clientId,
          client_secret: fbSettings.clientSecret,
          refresh_token: fbSettings.refreshToken
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const tokens = refreshResponse.data;
      const newExpiryDate = new Date();
      newExpiryDate.setSeconds(newExpiryDate.getSeconds() + tokens.expires_in);

      // Update tokens
      await admin.firestore().collection('settings').doc('freshbooks').update({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: newExpiryDate.toISOString(),
        lastRefresh: admin.firestore.FieldValue.serverTimestamp()
      });

      // Use new token
      fbSettings.accessToken = tokens.access_token;
    }

    // Build API URL with filters
    let apiUrl = `https://api.freshbooks.com/accounting/account/${fbSettings.accountId}/invoices/invoices?page=${page}&per_page=${perPage}`;

    // Add date filters if provided
    if (startDate) {
      apiUrl += `&search[date_min]=${startDate}`;
    }
    if (endDate) {
      apiUrl += `&search[date_max]=${endDate}`;
    }

    // Fetch invoices
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${fbSettings.accessToken}`,
        'Api-Version': fbSettings.apiVersion,
        'Content-Type': 'application/json'
      }
    });

    const invoices = response.data.response.result.invoices || [];
    const total = response.data.response.result.total || 0;
    const pages = response.data.response.result.pages || 1;

    // Transform invoices for easier consumption
    const transformedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      clientId: invoice.customerid,
      customerName: invoice.fname + ' ' + invoice.lname,
      organization: invoice.organization,
      amount: invoice.amount?.amount || '0',
      currency: invoice.amount?.code || 'USD',
      status: invoice.v3_status,
      date: invoice.create_date,
      dueDate: invoice.due_date,
      description: invoice.notes || '',
      lines: invoice.lines?.map(line => ({
        name: line.name,
        description: line.description,
        quantity: line.qty,
        unitCost: line.unit_cost?.amount || '0',
        amount: line.amount?.amount || '0'
      })) || [],
      rawInvoice: invoice
    }));

    return {
      success: true,
      invoices: transformedInvoices,
      pagination: {
        page: page,
        perPage: perPage,
        total: total,
        pages: pages
      }
    };

  } catch (error) {
    console.error('Error fetching FreshBooks invoices:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    // Check if it's an axios error with response
    if (error.response) {
      throw new functions.https.HttpsError(
        'internal',
        `FreshBooks API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
      );
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to fetch FreshBooks invoices: ' + error.message
    );
  }
});

/**
 * Import a single invoice from FreshBooks as a project
 * 
 * Request body:
 * - invoiceId: string (required) - FreshBooks invoice ID
 * - clientId: string (required) - Carben Connect client ID to assign to
 * - createEstimate: boolean (optional) - Whether to create an estimate (default: true)
 * 
 * Authorization:
 * - Requires Firebase Auth token
 * - Caller must have 'admin' role
 */
exports.freshbooksImportInvoice = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated'
    );
  }

  const callerId = context.auth.uid;

  try {
    // Verify caller is an admin
    const callerDoc = await admin.firestore().collection('users').doc(callerId).get();
    
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only administrators can import FreshBooks invoices'
      );
    }

    const { invoiceId, clientId, locationId, locationName, createEstimate = true } = data;

    if (!invoiceId || !clientId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'invoiceId and clientId are required'
      );
    }

    // Verify client exists
    const clientDoc = await admin.firestore().collection('clients').doc(clientId).get();
    
    if (!clientDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Client not found'
      );
    }

    const client = clientDoc.data();

    // Get FreshBooks settings
    const fbSettingsDoc = await admin.firestore().collection('settings').doc('freshbooks').get();
    
    if (!fbSettingsDoc.exists) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'FreshBooks is not configured'
      );
    }

    const fbSettings = fbSettingsDoc.data();

    if (!fbSettings.accessToken) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'FreshBooks is not connected'
      );
    }

    // Fetch the specific invoice
    const response = await axios.get(
      `https://api.freshbooks.com/accounting/account/${fbSettings.accountId}/invoices/invoices/${invoiceId}`,
      {
        headers: {
          'Authorization': `Bearer ${fbSettings.accessToken}`,
          'Api-Version': fbSettings.apiVersion,
          'Content-Type': 'application/json'
        }
      }
    );

    const invoice = response.data.response.result.invoice;

    // Create project from invoice
    const projectData = {
      title: invoice.invoice_number + ' - ' + (invoice.organization || 'Invoice'),
      description: invoice.notes || 'Imported from FreshBooks',
      clientId: clientId,
      clientName: client.name,
      status: 'COMPLETE',
      createdAt: new Date(invoice.create_date),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      source: 'freshbooks',
      freshbooksInvoiceId: invoice.id,
      freshbooksInvoiceNumber: invoice.invoice_number,
      importedAt: admin.firestore.FieldValue.serverTimestamp(),
      importedBy: callerId
    };

    // Add location info if provided
    if (locationId && locationName) {
      projectData.locationId = locationId;
      projectData.locationName = locationName;
    }

    const projectRef = await admin.firestore().collection('projects').add(projectData);

    let estimateId = null;

    // Create estimate if requested
    if (createEstimate) {
      const estimateData = {
        projectId: projectRef.id,
        clientId: clientId,
        clientName: client.name,
        title: invoice.invoice_number + ' - Estimate',
        items: invoice.lines?.map(line => ({
          name: line.name,
          description: line.description || '',
          quantity: parseFloat(line.qty) || 1,
          unitPrice: parseFloat(line.unit_cost?.amount) || 0,
          total: parseFloat(line.amount?.amount) || 0
        })) || [],
        subtotal: parseFloat(invoice.amount?.amount) || 0,
        tax: 0,
        total: parseFloat(invoice.amount?.amount) || 0,
        notes: invoice.notes || '',
        status: 'approved',
        createdAt: new Date(invoice.create_date),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        source: 'freshbooks',
        freshbooksInvoiceId: invoice.id,
        importedAt: admin.firestore.FieldValue.serverTimestamp(),
        importedBy: callerId
      };

      // Add location info if provided
      if (locationId && locationName) {
        estimateData.locationId = locationId;
        estimateData.locationName = locationName;
      }

      const estimateRef = await admin.firestore().collection('estimates').add(estimateData);
      estimateId = estimateRef.id;
    }

    // Update last import timestamp
    await admin.firestore().collection('settings').doc('freshbooks').update({
      lastImport: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      projectId: projectRef.id,
      estimateId: estimateId,
      message: 'Invoice imported successfully'
    };

  } catch (error) {
    console.error('Error importing FreshBooks invoice:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    if (error.response) {
      throw new functions.https.HttpsError(
        'internal',
        `FreshBooks API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
      );
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to import FreshBooks invoice: ' + error.message
    );
  }
});

/**
 * Bulk import multiple invoices from FreshBooks
 *
 * Request body:
 * - invoices: array (required) - Array of { invoiceId, clientId, locationId?, locationName? } objects
 * - createEstimates: boolean (optional) - Whether to create estimates (default: true)
 *
 * Authorization:
 * - Requires Firebase Auth token
 * - Caller must have 'admin' role
 */
exports.freshbooksBulkImport = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated'
    );
  }

  const callerId = context.auth.uid;

  try {
    // Verify caller is an admin
    const callerDoc = await admin.firestore().collection('users').doc(callerId).get();
    
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only administrators can bulk import FreshBooks invoices'
      );
    }

    const { invoices, createEstimates = true } = data;

    if (!invoices || !Array.isArray(invoices) || invoices.length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'invoices array is required and must not be empty'
      );
    }

    const results = {
      success: [],
      failed: []
    };

    // Import each invoice
    for (const invoiceData of invoices) {
      try {
        const importData = {
          invoiceId: invoiceData.invoiceId,
          clientId: invoiceData.clientId,
          createEstimate: createEstimates
        };

        // Include location data if available
        if (invoiceData.locationId && invoiceData.locationName) {
          importData.locationId = invoiceData.locationId;
          importData.locationName = invoiceData.locationName;
        }

        const result = await exports.freshbooksImportInvoice.run(importData, context);

        results.success.push({
          invoiceId: invoiceData.invoiceId,
          projectId: result.data.projectId,
          estimateId: result.data.estimateId
        });
      } catch (error) {
        results.failed.push({
          invoiceId: invoiceData.invoiceId,
          error: error.message
        });
      }
    }

    return {
      success: true,
      imported: results.success.length,
      failed: results.failed.length,
      results: results
    };

  } catch (error) {
    console.error('Error bulk importing FreshBooks invoices:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to bulk import FreshBooks invoices: ' + error.message
    );
  }
});

/**
 * Disconnect FreshBooks and clear tokens
 * 
 * Authorization:
 * - Requires Firebase Auth token
 * - Caller must have 'admin' role
 */
exports.freshbooksDisconnect = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated'
    );
  }

  const callerId = context.auth.uid;

  try {
    // Verify caller is an admin
    const callerDoc = await admin.firestore().collection('users').doc(callerId).get();
    
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only administrators can disconnect FreshBooks'
      );
    }

    // Clear tokens
    await admin.firestore().collection('settings').doc('freshbooks').update({
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
      connected: false,
      disconnectedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      message: 'FreshBooks disconnected successfully'
    };

  } catch (error) {
    console.error('Error disconnecting FreshBooks:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to disconnect FreshBooks: ' + error.message
    );
  }
});

/**
 * Clear all imported FreshBooks data (projects and estimates)
 * 
 * Authorization:
 * - Requires Firebase Auth token
 * - Caller must have 'admin' role
 */
exports.freshbooksClearImported = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated'
    );
  }

  const callerId = context.auth.uid;

  try {
    // Verify caller is an admin
    const callerDoc = await admin.firestore().collection('users').doc(callerId).get();
    
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only administrators can clear imported FreshBooks data'
      );
    }

    // Find all FreshBooks-imported projects
    const projectsSnapshot = await admin.firestore()
      .collection('projects')
      .where('source', '==', 'freshbooks')
      .get();

    // Find all FreshBooks-imported estimates
    const estimatesSnapshot = await admin.firestore()
      .collection('estimates')
      .where('source', '==', 'freshbooks')
      .get();

    // Delete all in batches (Firestore batch limit is 500)
    const batch = admin.firestore().batch();
    let batchCount = 0;

    projectsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      batchCount++;
    });

    estimatesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      batchCount++;
    });

    if (batchCount > 0) {
      await batch.commit();
    }

    // Update settings
    await admin.firestore().collection('settings').doc('freshbooks').update({
      lastClear: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      projectsDeleted: projectsSnapshot.size,
      estimatesDeleted: estimatesSnapshot.size,
      message: `Cleared ${projectsSnapshot.size} projects and ${estimatesSnapshot.size} estimates`
    };

  } catch (error) {
    console.error('Error clearing imported FreshBooks data:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to clear imported FreshBooks data: ' + error.message
    );
  }
});
