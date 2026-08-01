import Config from "./Config.js";

/**
 * Internationalization helper with dot-notation key access
 *
 * NOTE: Only 2 keys are currently used in the codebase:
 *   - Lang.get("countdown.remaining") -> "Sisa waktu" / "Time remaining" (GalleryPage.js)
 *   - Lang.get("error.prefix") -> "Error: " (ModalManager.js)
 *
 * All other keys were pruned as dead code (2026-08-01).
 */
export const Lang = {
	id: {
		countdown: {
			remaining: "Sisa waktu",
		},
		error: {
			prefix: "Error: ",
		},
	},
	en: {
		countdown: {
			remaining: "Time remaining",
		},
		error: {
			prefix: "Error: ",
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

export default Lang;
