const startButton = document.getElementById('startButton');

startButton.addEventListener('click', function(e) {
    e.preventDefault();

    const rect = this.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.classList.add('btn-ripple');
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';

    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : rect.left + rect.width / 2);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : rect.top + rect.height / 2);

    ripple.style.left = (clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (clientY - rect.top - size / 2) + 'px';

    this.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
        window.location.href = 'take-photo.php';
    }, 350);
});

const startCleanupInterval = () => {
    const runCleanup = async () => {
        try {
            await fetch('api/cleanup-photos.php');
        } catch (e) {
            console.error('Photo cleanup failed:', e);
        }
    };
    runCleanup();
    setInterval(runCleanup, 30000);
};

document.addEventListener('DOMContentLoaded', startCleanupInterval);

if (navigator.vibrate) {
    startButton.addEventListener('touchstart', () => {
        navigator.vibrate(8);
    });
}

document.addEventListener('dblclick', (e) => {
    if (e.target.closest('.btn-trigger, .tag')) {
        e.preventDefault();
    }
}, { passive: false });

const appHeight = () => {
    document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
};
window.addEventListener('resize', appHeight);
appHeight();