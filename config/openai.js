// Carben Connect AI API Configuration

const API_BASE_URL = 'https://www.carbenconnect.com/api';

export async function generateEstimate(projectDescription, additionalInstructions = '') {
  try {
    const payload = {
      projectDescription: projectDescription,
    };

    // Add additional instructions if provided
    if (additionalInstructions && additionalInstructions.trim()) {
      payload.additionalInstructions = additionalInstructions;
    }

    const response = await fetch(`${API_BASE_URL}/ai/generate-estimate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return {
      success: true,
      estimate: data.estimateDescription || data.estimate || data.generatedText || data.text,
    };
  } catch (error) {
    console.error('AI API Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Other AI API functions available from backend
export async function generateProject(description) {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/generate-project`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
    });

    if (!response.ok) throw new Error('Failed to generate project');

    const data = await response.json();
    return { success: true, project: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function transcribeAudio(audioUri) {
  try {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    });

    const response = await fetch(`${API_BASE_URL}/ai/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to transcribe audio');

    const data = await response.json();
    return { success: true, text: data.text };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function aiChat(message, conversationHistory = []) {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history: conversationHistory,
      }),
    });

    if (!response.ok) throw new Error('Failed to chat with AI');

    const data = await response.json();
    return { success: true, response: data.response };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
