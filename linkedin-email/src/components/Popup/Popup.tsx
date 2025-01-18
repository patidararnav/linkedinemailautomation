import React, { useState } from 'react';
import './Popup.css';

type Experience = {
    role: string;
    company: string;
    duration: string;
    description: string | null;
}

type ProfileState = {
    name: string | null;
    headline: string | null;
    email: string | null;
    company: string | null;
    isEmailVerified: boolean;
    experiences: Experience[];
}

const Popup: React.FC = () => {
    const [profileData, setProfileData] = useState<ProfileState | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRevising, setIsRevising] = useState(false);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    const fetchEmail = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            console.log("Sending message to service worker...");
            const response = await chrome.runtime.sendMessage({ action: "GET_EMAIL" });
            console.log("Received response:", response);
            
            if (response && response.email) {
                const isVerified = response.email_status === "verified";
                
                setProfileData({
                    name: response.name,
                    headline: response.headline,
                    email: response.email,
                    company: response.experiences?.[0]?.company || null,
                    isEmailVerified: isVerified,
                    experiences: response.experiences || []
                });
            } else {
                throw new Error("Could not find an email for this profile. Please try another profile.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred while fetching the data.");
            setProfileData(null);
        } finally {
            setIsLoading(false);
        }
    }

    const handleSendEmail = () => {
        if (!profileData?.email || !message.trim() || !subject.trim()) {
            setError("Please enter both subject and message.");
            return;
        }
        
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(profileData.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        chrome.tabs.create({ url: gmailUrl });
    }

    const handleRevise = async () => {
        if (!message.trim()) {
            setError("Please enter a message to revise.");
            return;
        }

        setIsRevising(true);
        setError(null);

        try {
            const prompt = `Please revise this professional email to make it more polished and effective. Include only the email body and not the subject line. Here is an example format for your response:
            Hi {name},
            {email intro} {...email body...}
            Thanks,
            {your name}

            Here is some more context:

            Original message: "${message}"

            Context: This is a LinkedIn connection reaching out to ${profileData?.name}, who is ${profileData?.headline} at ${profileData?.company}.

            Their recent experience includes:
            ${profileData?.experiences.map(exp => 
                `• ${exp.role} at ${exp.company} (${exp.duration})${exp.description ? `: ${exp.description}` : ''}`
            ).join('\n')}`;
            console.log("Prompt:", prompt);
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer '
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [{
                        role: "user",
                        content: prompt
                    }],
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error('Failed to revise message');
            }

            const data = await response.json();
            console.log("Revised message:", data);
            const revisedMessage = data.choices[0].message.content.trim();
            setMessage(revisedMessage);
        } catch (err) {
            setError("Failed to revise the message. Please try again.");
            console.error('Error revising message:', err);
        } finally {
            setIsRevising(false);
        }
    }

    if (isLoading) {
        return (
            <div className="popup loading-container">
                <div className="loading-spinner"></div>
                <p>Fetching profile information...</p>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="popup initial-state">
                <button onClick={fetchEmail} className="get-email-button">
                    Get Email
                </button>
                {error && (
                    <div className="fetch-error">
                        {error}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="popup">
            {profileData ? (
                <>
                    <div className="profile-info">
                        <h2>Sending to: {profileData.email}</h2>
                        <div className="profile-details">
                            <p className="name">{profileData.name}</p>
                            <p className="position">{profileData.headline}</p>
                            {profileData.company && (
                                <p className="company">at {profileData.company}</p>
                            )}
                            {profileData.isEmailVerified === false && (
                                <p className="warning">⚠️ This email was not verified by our provider</p>
                            )}
                        </div>
                    </div>

                    <div className="compose-section">
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Enter subject line..."
                            className="subject-input"
                        />
                        
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Enter your message here..."
                            rows={4}
                            className="message-input"
                        />

                        <div className="button-group">
                            <button 
                                onClick={handleRevise}
                                disabled={!message.trim() || isRevising}
                                className="revise-button"
                            >
                                {isRevising ? 'Revising...' : 'Revise with AI'}
                            </button>
                            <button 
                                onClick={handleSendEmail}
                                disabled={!message.trim() || !subject.trim()}
                                className="send-button"
                            >
                                Send Email
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <button onClick={fetchEmail}>Get Email</button>
            )}
            {error && <p className="error">{error}</p>}
        </div>
    );
};

export default Popup;
