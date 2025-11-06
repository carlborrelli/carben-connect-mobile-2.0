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
  apiKey: functions.config().openai?.key || process.env.OPENAI_API_KEY,
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
