type Experience = {
    role: string;
    company: string;
    duration: string;
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
    let email_status = null;
    const headline = document.getElementsByClassName('text-body-medium break-words')[0]?.textContent?.trim() ?? null;
    const location = document.getElementsByClassName('text-body-small inline t-black--light break-words')[0]?.textContent?.trim() ?? null;
    const bio = document.querySelector('.LDmeLHPrHxuoxVCdCoUvcPxxJtBGbmbYt span[aria-hidden="true"]')?.textContent?.trim() ?? null;


    const experiences = Array.from(document.querySelectorAll('.artdeco-list__item'))
        .map(item => {
            let role = item.querySelector('.mr1.t-bold span[aria-hidden="true"]')?.textContent?.trim();
            if (!role) {
                role = item.querySelector('.mr1.t-bold span[aria-hidden="false"]')?.textContent?.trim();
            }
            
            let company = item.querySelector('.t-14.t-normal span[aria-hidden="true"]')?.textContent?.trim();
            if (!company) {
                company = item.querySelector('.t-14.t-normal span[aria-hidden="false"]')?.textContent?.trim();
            }
            
            let duration = item.querySelector('.t-black--light span[aria-hidden="true"]')?.textContent?.trim();
            if (!duration) {
                duration = item.querySelector('.t-black--light span[aria-hidden="false"]')?.textContent?.trim();
            }
            
            let description = item.querySelector('.inline-show-more-text--is-collapsed span[aria-hidden="true"]')?.textContent?.trim();
            if (!description) {
                description = item.querySelector('.inline-show-more-text--is-expanded span[aria-hidden="true"]')?.textContent?.trim();
            }
            if (!description) {
                description = item.querySelector('.full-width.t-14.t-normal.t-black span[aria-hidden="true"]')?.textContent?.trim();
            }
            
            if (!role || !company) return null;
            
            return {
                role: role.split('·')[0] || '',
                company: company.split('·')[0] || '',
                duration: duration || '',
                description: description || null
            };
        })
        .filter((exp): exp is Experience => exp !== null)
        .slice(0, 3);

    console.log('Scraped experiences:', experiences);

    if (name) {
        const body = JSON.stringify({
            api_key: 'pn6VPTp_gHi-CcTboM07Hw',
            name: name,
            linkedin_url: tab.url, // this might be problem
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
                throw new Error(`Apollo API error: ${res.status}: ${res.statusText}`);
            }
            const data = await res.json();
            console.log(data);
            if (data.person?.email) {
                email = data.person.email;
                email_status = data.person.email_status;
            } else {
                console.error(`No email found for ${name}. Please try another profile.`);
            }
        } catch (error) {
            console.error('Error fetching email:', error);
        }
    }

    const res = {
        name: name,
        email: email,
        email_status: email_status,
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
