type Experience = {
    role: string | null;
    company: string | null;
    duration: string | null;
    description: string | null;
}

type Education = {
    school: string | null;
    degree: string | null;
    duration: string | null;
    description: string | null;
}

type ProfileInformation = {
    name: string | null;
    email: string | null;
    headline: string | null;
    location: string | null;
    bio: string | null;
    experiences: Array<Experience> | null;
    education: Array<Education> | null;
}

const getInfo = async (tab: chrome.tabs.Tab): Promise<ProfileInformation | null> => {
    const name = document.querySelector('h1')?.textContent ?? null;
    let email = null;
    const headline = document.getElementsByClassName('text-body-medium break-words')[0]?.textContent?.trim() ?? null;
    const location = document.getElementsByClassName('text-body-small inline t-black--light break-words')[0]?.textContent?.trim() ?? null;
    const bio = document.querySelector('.LDmeLHPrHxuoxVCdCoUvcPxxJtBGbmbYt span[aria-hidden="true"]')?.textContent?.trim() ?? null;
    
    if (name) {
        const body = JSON.stringify({
            api_key: 'GYJMiiOZW_ahUWXOKipS7g',
            name: name,
            linkedin_url: tab.url,
        })
    
        const options = {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/json'
            },
            body: body,
        }

        try {
            const res = await fetch('https://api.apollo.io/api/v1/people/match?reveal_personal_emails=true&reveal_phone_number=false', options);
            if (!res.ok) {
                throw new Error(`Error: ${res.status}: ${res.statusText}`);
            }
            const data = await res.json();
            console.log(data);
            if (data.person.email && data.person.email_status == 'verified') {
                email = data.person.email;
            } else {
                console.error(`No verified email found for ${name}`);
            }
        } catch (error) {
            console.error('Error fetching email:', error);
        }
    }

    const experienceSection = Array.from(document.querySelectorAll('section'))
        .find((section) => section.textContent?.includes("Experience"));
    if (!experienceSection) {
        console.warn('Experience section not found.');
        return null;
    }
    const experienceItems = Array.from(experienceSection.querySelectorAll('li'));
    const experiences = Array.from(experienceItems).map((item) => {
        const exp: Experience = {
            role: null,
            company: null,
            duration: null,
            description: null,
        }
        const spans = item.querySelectorAll('span[aria-hidden="true"]');
        spans.forEach((span, index) => {
            const textContent = span.textContent?.trim() ?? null;
            if (index == 0) exp.role = textContent;
            else if (index == 1) exp.company = textContent;
            else if (index == 2) exp.duration = textContent;
            else if (index == 3) exp.description = textContent;
        })
        return exp;
    })
    console.log(`Email is: ${email}.`);
    
    const res = {
        name: name,
        email: email,
        headline: headline,
        location: location,
        bio: bio,
        experiences: experiences,
        education: null
    };
    return res;
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === "GET_EMAIL") {
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
                    args: [tab]
                },
                (injectionResults) => {
                    if (chrome.runtime.lastError) {
                        console.error("Error during script execution:", chrome.runtime.lastError.message);
                        sendResponse({ error: chrome.runtime.lastError.message });
                        return;
                    }
                    const info = injectionResults?.[0]?.result;
                    console.log(info);

                    if (info) {
                        sendResponse(info);
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
