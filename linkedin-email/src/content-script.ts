const getNameFromLinkedIn = (): string | null => {
    // Assume LinkedIn profile pages have the user's name in a specific selector.
    const nameElement = document.querySelector('h1.text-heading-xlarge');
    return nameElement?.textContent?.trim() || null;
};

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === "SCRAPE_NAME") {
        const name = getNameFromLinkedIn();
        sendResponse({ name });
    }
});
