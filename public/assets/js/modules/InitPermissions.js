export const DEFAULT_LOCATION = "Bandung, Jawa Barat";
export async function initPermissions() {
  console.log("[InitPermissions] Requesting permissions...");
  const result = { cameraStream: null, position: null, DEFAULT_LOCATION };

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      result.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      console.log("[InitPermissions] Camera access granted");
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
        console.log("[InitPermissions] Fallback camera access granted");
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
    console.log("[InitPermissions] Requesting geolocation...");
    result.position = await new Promise((res, rej) => {
      navigator.geolocation.getCurrentPosition(res, rej, {
        timeout: 3000,
        maximumAge: 0,
      });
    });
    console.log("[InitPermissions] Geolocation granted");
  } catch (e) {
    console.warn("[InitPermissions] Geolocation failed or timed out", e);
  }

  window.__appPermissions = result;
  return result;
}
