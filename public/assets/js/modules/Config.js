export class Config {
  static instance = null;
  static values = null;
  static async load() {
    if (this.instance) return this.instance;
    try {
      const res = await fetch("api/config.php");
      const data = await res.json();
      this.values = data;
      this.instance = this;
      return this.instance;
    } catch (e) {
      console.error("Failed to load config:", e);
      throw e;
    }
  }
  static get(path, defaultValue = null) {
    if (!this.values) return defaultValue;
    const keys = path.split(".");
    let value = this.values;
    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }
    return value;
  }
  static photo() {
    return this.values?.photo || {};
  }
  static session() {
    return this.values?.session || {};
  }
  static studio() {
    return this.values?.studio || {};
  }
  static email() {
    const emailConfig = this.values?.email || {};
    if (typeof emailConfig.regex === "string") {
      try {
        const regexStr = emailConfig.regex;
        const match = regexStr.match(/^\/(.+)\/([gimuy]*)$/);
        if (match) {
          emailConfig.regex = new RegExp(match[1], match[2]);
        } else {
          emailConfig.regex = new RegExp(regexStr);
        }
      } catch (e) {
        console.error("Failed to parse email regex:", e);
        emailConfig.regex = /^[a-z0-9._%+-]+@gmail\.com$/i;
      }
    }
    return emailConfig;
  }
  static qr() {
    return this.values?.qr || {};
  }
  static colors() {
    return this.values?.colors || {};
  }
  static paths() {
    return this.values?.paths || {};
  }
  static geolocation() {
    return this.values?.geolocation || {};
  }
}
