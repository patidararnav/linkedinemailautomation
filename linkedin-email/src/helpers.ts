export type Experience = {
  role: string | null;
  company: string | null;
  duration: string | null;
  description: string | null;
};

export type Education = {
  school: string | null;
  degree: string | null;
  duration: string | null;
  description: string | null;
};

export type ProfileInformation = {
  name: string | null;
  email: string | null;
  headline: string | null;
  location: string | null;
  bio: string | null;
  experiences: Array<Experience> | null;
  education: Array<Education> | null;
};

export const getText = (selector: Element): string | null => {
  return selector.textContent ?? null;
};

export const extractExperiences = (
  experienceSection: Element | undefined
): Array<Experience> | null => {
  if (!experienceSection) return null;
  const experienceListItems = Array.from(
    experienceSection.querySelectorAll("li")
  );
  const experiences = experienceListItems.map((item) => {
    const exp: Experience = {
      role: null,
      company: null,
      duration: null,
      description: null,
    };
    const spans = item.querySelectorAll("span[aria-hidden=true]");
    spans.forEach((span, index) => {
      const textContent = getText(span);
      switch (index) {
        case 0:
          exp.role = textContent;
          break;
        case 1:
          exp.company = textContent;
          break;
        case 2:
          exp.duration = textContent;
          break;
        case 3:
          exp.description = textContent;
          break;
      }
    });
    return exp;
  });
  return experiences.length > 0 ? experiences : null;
};

export const getEmailApollo = async (
  name: string | null,
  tab: chrome.tabs.Tab
): Promise<(string | null)[]> => {
  let [email, email_status] = [null, null];
  if (!name) return [email, email_status];
  const body = JSON.stringify({
    api_key: "GYJMiiOZW_ahUWXOKipS7g",
    name: name,
    linkedin_url: tab.url,
  });
  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
    },
    body: body,
  };
  try {
    const res = await fetch(
      "https://api.apollo.io/api/v1/people/match?reveal_personal_emails=true&reveal_phone_number=false",
      options
    );
    if (!res.ok) {
      console.error(
        `Error calling the Apollo API: ${res.status}: ${res.statusText}`
      );
    } else {
      const data = await res.json();
      if (data.person.email) {
        email = data.person.email;
        email_status = data.person.email_status;
      } else {
        console.error(`No email found for ${name}`);
      }
    }
  } catch (error) {
    console.error("Error fetching email:", error);
  }
  return [email, email_status];
};
