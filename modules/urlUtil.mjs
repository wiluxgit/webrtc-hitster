export const urlUtil = {
  getCurrentUrl() {
    const base = location.origin === "null"
      ? location.href.split('?')[0]
      : location.origin + location.pathname;
    return base;
  },
  getSiblingUrl(htmlFile) {
    // Returns the same directory as the current file, but with a different filename
    const base = urlUtil.getCurrentUrl();
    return base.replace(/[^\/]+$/, htmlFile);
  }
};