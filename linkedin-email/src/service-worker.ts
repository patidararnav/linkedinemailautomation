chrome.runtime.onMessage.addListener(async (request, _sender, sendResponse) => {
    if (request.action === "GET_EMAIL") {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tab?.id) {
            chrome.scripting.executeScript(
                {
                    target: { tabId: tab.id },
                    func: () => {
                        const name = document.querySelector('h1')?.textContent || null;
                        console.log(name);
                        return name; // Return the name to the service worker
                    },
                },
                (injectionResults) => {
                    const name = injectionResults[0]?.result;
                    if (name) {
                        console.log(name);
                        // chrome.notifications.create({
                        //     type: "basic",
                        //     iconUrl: "icon.jpeg", // Replace with your extension icon
                        //     title: "Name Found",
                        //     message: `The name is: ${name}`,
                        // });
                        sendResponse({ name });
                    } else {
                        // chrome.notifications.create({
                        //     type: "basic",
                        //     iconUrl: "icon.jpeg",
                        //     title: "Error",
                        //     message: "Name not found on this page.",
                        // });
                        sendResponse({ error: "Name not found" });
                    }
                }
            );
        }
    }
    return true; // Indicate asynchronous response
});
