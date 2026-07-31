import { Config } from "./Config.js";
export const Lang = {
  id: {
    timer: "01:30",
    timeUp: "Waktu habis! Ambil foto terakhir",
    timeUpWarning: "Segera lakukan foto!",

    capture: "Capture",
    retake: "Retake",
    done: "Done",
    back: "Back",
    home: "Home",
    cancel: "Cancel",
    close: "Close",
    print: "Print Photo",
    sendEmail: "Send Email",
    downloadQR: "Download Via QR",
    sendNow: "Send Now",
    emailRetry: "Gagal, coba lagi",

    photoReady: "Photo Ready!",
    photoReadySub: "Your photo is ready to print",
    scanToDownload: "Scan to Download",
    scanToDownloadSub: "Scan the QR code below to download your photo",
    sendViaEmail: "Send via Email",
    emailPlaceholder: "example@gmail.com",
    emailLabel: "Email Address",
    emailError: "Please enter a valid @gmail.com address",
    generatingQR: "Generating QR Code...",
    modalClosing: "Modal akan ditutup dalam {countdown} detik",

    photoSaved: "Tautan foto berhasil disalin!",
    allowPopups: "Izinkan pop-up untuk mencetak",
    photoNotReady: "Photo not ready yet",
    locationNotAvailable: "Lokasi tidak tersedia",
    errorPrefix: "Error: ",
    invalidEmail: "Please provide a valid @gmail.com email address",
    imageMissing: "Image data is missing",
    emailSent: "Email sent successfully!",
    emailSendFailed: "Failed to send email",
    location: {
      notAvailable: "Lokasi tidak tersedia",
    },
    error: {
      prefix: "Error: ",
    },
    photo: {
      notReady: "Foto belum siap",
    },
    print: {
      allowPopups: "Izinkan pop-up untuk mencetak",
    },
    email: {
      modal: {
        closing: "Modal akan ditutup dalam {countdown} detik",
      },
      retry: "Gagal, coba lagi",
    },

    countdownText: ["3", "2", "1"],

    countdown: {
      remaining: "Sisa waktu",
      hours: "jam",
      minutes: "menit",
      seconds: "detik",
      autoDelete: "Auto-delete",
    },

    warning: "Time's up! Last capture",

    viewTitlePhotoFound: "Foto Kenangan Anda",
    viewTitleNotFound: "Foto Tidak Ditemukan",
    viewTitleExpired: "Foto Telah Kadaluarsa",
    infoSavedInCloud:
      "Foto ini disimpan secara aman di Kidversa Cloud. Silakan unduh atau pindai kode QR untuk menyimpan kenangan ini langsung di galeri handphone Anda.",
    details: {
      dateTime: "Tanggal & Waktu",
      location: "Lokasi",
      dimensions: "Dimensi",
      fileSize: "Ukuran File",
      resolution: "Resolusi Tinggi",
      format: "Format",
    },
    btnDownload: "Unduh Kenangan (HD)",
    btnCopyLink: "Salin Link Bagikan",
    scanWithPhone: "Scan di Handphone",
    scanInstruction:
      "Arahkan kamera HP Anda ke QR code ini untuk membuka foto ini dan menyimpannya secara instan ke galeri ponsel Anda.",
    kidversaStudio: "Kidversa Studio",
    jakartaIndonesia: "Bandung, Jawa Barat",
    expiredMessage:
      "Waktu penyimpanan foto ini telah habis (batas maksimal 24 jam). Demi keamanan privasi Anda, semua file foto di Kidversa Studio akan dihapus secara otomatis dari sistem secara berkala.",
    photoNotFoundMessage:
      "Maaf, berkas foto yang Anda cari tidak ditemukan. Silakan pastikan tautan sudah benar atau lakukan sesi pengambilan foto baru.",
    modalWillClose: "Modal akan ditutup dalam {countdown} detik",

    error: "Error",
    cameraAccessDenied: "Camera access denied",
    geolocationFailed: "Geolocation failed",
    cleanupFailed: "Photo cleanup failed",
  },

  en: {
    timer: "01:30",
    timeUp: "Time's up! Last capture",
    timeUpWarning: "Take photo now!",

    capture: "Capture",
    retake: "Retake",
    done: "Done",
    back: "Back",
    home: "Home",
    cancel: "Cancel",
    close: "Close",
    print: "Print Photo",
    sendEmail: "Send Email",
    downloadQR: "Download Via QR",
    sendNow: "Send Now",
    emailRetry: "Failed, try again",

    photoReady: "Photo Ready!",
    photoReadySub: "Your photo is ready to print",
    scanToDownload: "Scan to Download",
    scanToDownloadSub: "Scan the QR code below to download your photo",
    sendViaEmail: "Send via Email",
    emailPlaceholder: "example@gmail.com",
    emailLabel: "Email Address",
    emailError: "Please enter a valid @gmail.com address",
    generatingQR: "Generating QR Code...",
    email: {
      modal: {
        closing: "Modal will close in {countdown} seconds",
      },
      retry: "Failed, try again",
    },

    photoSaved: "Link copied successfully!",
    allowPopups: "Allow pop-ups to print",
    photoNotReady: "Photo not ready yet",
    locationNotAvailable: "Location not available",
    location: {
      notAvailable: "Location not available",
    },
    errorPrefix: "Error: ",
    invalidEmail: "Please provide a valid @gmail.com email address",
    imageMissing: "Image data is missing",
    emailSent: "Email sent successfully!",
    emailSendFailed: "Failed to send email",

    countdownText: ["3", "2", "1"],

    countdown: {
      remaining: "Time remaining",
      hours: "h",
      minutes: "m",
      seconds: "s",
      autoDelete: "Auto-delete",
    },

    warning: "Time's up! Last capture",

    viewTitlePhotoFound: "Your Photo Memory",
    viewTitleNotFound: "Photo Not Found",
    viewTitleExpired: "Photo Has Expired",
    infoSavedInCloud:
      "This photo is securely stored in Kidversa Cloud. Please download or scan the QR code to save this memory directly to your phone gallery.",
    details: {
      dateTime: "Date & Time",
      location: "Location",
      dimensions: "Dimensions",
      fileSize: "File Size",
      resolution: "High Resolution",
      format: "Format",
    },
    btnDownload: "Download Memory (HD)",
    btnCopyLink: "Copy Share Link",
    scanWithPhone: "Scan with Phone",
    scanInstruction:
      "Point your phone camera at this QR code to open this photo and instantly save it to your phone gallery.",
    kidversaStudio: "Kidversa Studio",
    jakartaIndonesia: "Bandung, Jawa Barat",
    expiredMessage:
      "The storage time for this photo has expired (maximum limit of 24 hours). For your privacy security, all photo files in Kidversa Studio will be automatically deleted from the system periodically.",
    photoNotFoundMessage:
      "Sorry, the photo file you are looking for was not found. Please make sure the link is correct or perform a new photo capture session.",
    modalWillClose: "Modal will close in {countdown} seconds",

    error: {
      prefix: "Error: ",
    },
    cameraAccessDenied: "Camera access denied",
    geolocationFailed: "Geolocation failed",
    cleanupFailed: "Photo cleanup failed",
    photo: {
      notReady: "Photo not ready yet",
    },
  },
  get(key, ...replacements) {
    const currentLang = Config && Config.get ? Config.get("lang", "en") : "en";
    const dict = this[currentLang] || this.en;
    const parts = key.split(".");
    let value = dict;
    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = value[part];
      } else {
        console.warn(`Lang key not found: ${key}`);
        return key;
      }
    }
    if (typeof value === "string" && replacements.length) {
      return value.replace(/\{[^}]+\}/g, () => replacements.shift());
    }
    return value;
  },
};
