import * as helpers from "./helpers";

const getInfo = async (
  tab: chrome.tabs.Tab
): Promise<helpers.ProfileInformation | null> => {
  // Extracting key entities (name, headline, location, bio, and experiences) from LI profile.
  const name = helpers.getText(document.querySelector("h1") as Element);
  const headline = helpers.getText(
    document.getElementsByClassName("text-body-medium break-words")[0]
  );
  const location = helpers.getText(
    document.getElementsByClassName(
      "text-body-small inline t-black--light break-words"
    )[0]
  );
  const bio = helpers.getText(
    document.querySelector(
      '.LDmeLHPrHxuoxVCdCoUvcPxxJtBGbmbYt span[aria-hidden="true"]'
    ) as Element
  );
  let [email, email_status] = await helpers.getEmailApollo(name, tab);
  const experienceSection = Array.from(
    document.querySelectorAll("section")
  ).find((section) => section.textContent?.includes("Experience"));
  const experiences = helpers.extractExperiences(experienceSection);

  const res = {
    name: name,
    email: email,
    email_status: email_status,
    headline: headline,
    location: location,
    bio: bio,
    experiences: experiences,
    education: null,
  };
  return res;
};

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "FETCH_METADATA") {
    chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const tab = tabs[0];
      if (!tab?.id) {
        console.warn("No active tab found.");
        sendResponse({ error: "No active tab found." });
        return;
      }

      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: getInfo,
          args: [tab],
        },
        (injectionResults) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error during script execution:",
              chrome.runtime.lastError.message
            );
            sendResponse({ error: chrome.runtime.lastError.message });
            return;
          }
          const info = injectionResults?.[0]?.result;
          console.log(info);
          if (info) {
            sendResponse(info);
          } else {
            console.error("Error during script execution");
          }
        }
      );
    });

    return true;
  }
});
