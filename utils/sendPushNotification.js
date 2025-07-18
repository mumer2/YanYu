export async function sendPushNotification(fcmToken, title, body, data = {}) {
  try {
    const response = await fetch('https://backend-yanyu.vercel.app/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: fcmToken, title, body, data }),
    });

    const text = await response.text();
    try {
      const result = JSON.parse(text);
      if (!response.ok) {
        console.error('❌ Backend responded with error:', result);
      } else {
        console.log('✅ Push notification sent:', result);
      }
    } catch {
      console.error('❌ Failed to parse backend response:', text);
    }
  } catch (err) {
    console.error('❌ Failed to send push notification:', err.message);
  }
}
