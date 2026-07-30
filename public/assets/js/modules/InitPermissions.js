export async function initPermissions() {
    const result = { cameraStream: false, notifications: false };

    if ('Notification' in window && Notification.permission === 'default') {
        try {
            await Notification.requestPermission();
            result.notifications = true;
        } catch (e) {
            console.warn('Notification permission denied:', e);
        }
    } else if ('Notification' in window && Notification.permission === 'granted') {
        result.notifications = true;
    }

    return result;
}
