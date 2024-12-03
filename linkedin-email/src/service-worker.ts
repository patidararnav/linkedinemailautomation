const getName = (): string | null => {
    const name = document.querySelector('h1')?.textContent || null;
    return name; 
};

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    console.log("Received request:", request);

    if (request.action === "GET_EMAIL") {
        chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
            const tab = tabs[0];
            if (!tab?.id) {
                console.warn("No active tab found.");
                sendResponse({ error: "No active tab found." });
                return;
            }

            console.log("Active tab found, ID:", tab.id);

            chrome.scripting.executeScript(
                {
                    target: { tabId: tab.id },
                    func: getName,
                },
                (injectionResults) => {
                    if (chrome.runtime.lastError) {
                        console.error("Error during script execution:", chrome.runtime.lastError.message);
                        sendResponse({ error: chrome.runtime.lastError.message });
                        return;
                    }

                    console.log("Injection results:", injectionResults);
                    const name = injectionResults?.[0]?.result;

                    if (name) {
                        console.log("Returning response to sender:", name);
                        sendResponse({ name });
                    } else {
                        console.warn("Name could not be found.");
                        sendResponse({ error: "Name could not be found." });
                    }
                }
            );
        });

        return true;
    }
});
