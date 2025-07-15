const adjectives = [
    "Fast", "Quiet", "Bright", "Chill", "Sharp",
    "Brave", "Clever", "Bold", "Swift", "Happy",
    "Cool", "Mighty", "Lucky", "Witty", "Nimble",
    "Sly", "Loyal", "Fierce", "Gentle", "Wild",
    "Cool"
];
const nouns = [
    "Otter", "Wolf", "Falcon", "Gecko", "Panda",
    "Tiger", "Eagle", "Fox", "Hawk", "Bear",
    "Lynx", "Raven", "Shark", "Dragon", "Lion",
    "Dolphin", "Rabbit", "Owl", "Jaguar", "Cheetah",
];

// Simple hash function
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash >>> 0; // Convert to unsigned 32bit integer (always positive)
}

export function randomUsername() {
    const fingerprint = [
        navigator.userAgent,
        navigator.language,
        navigator.platform,
        screen.colorDepth,
    ].join('||');
    const hash = hashString(fingerprint);
    const adj = adjectives[hash % adjectives.length];
    const noun = nouns[hash % nouns.length];
    return `${adj}${noun}`;
}