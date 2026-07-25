export const DEFAULT_LOCATION = "Bandung, Jawa Barat";
export async function initPermissions() {
  const result = { cameraStream: null, position: null, DEFAULT_LOCATION };

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      result.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
    } catch (e) {
      console.warn(
        "[InitPermissions] Primary camera request failed, trying fallback...",
        e,
      );
      try {
        result.cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
      } catch (e2) {
        console.error("[InitPermissions] All camera requests failed", e2);
      }
    }
  } else {
    console.error(
      "[InitPermissions] mediaDevices.getUserMedia not available (Secure Context required)",
    );
  }

  try {
    result.position = await new Promise((res, rej) => {
      navigator.geolocation.getCurrentPosition(res, rej, {
        timeout: 3000,
        maximumAge: 0,
      });
    });
  } catch (e) {
    console.warn("[InitPermissions] Geolocation failed or timed out", e);
  }

  window.__appPermissions = result;
  return result;
}
