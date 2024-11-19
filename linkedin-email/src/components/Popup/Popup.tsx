import React, { useState } from 'react';
import './Popup.css';

const Popup: React.FC = () => {
    const [email, setEmail] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchEmail = async () => {
        try {
            const response = await chrome.runtime.sendMessage({ action: "GET_EMAIL" });
            if (response.email) {
                setEmail(response.email);
            } else {
                setError("Could not fetch email");
            }
        } catch (err) {
            setError("An error occurred");
        }
    };

    return (
        <div className="popup">
            <button onClick={fetchEmail}>Get Email</button>
            {email && <p>Email: {email}</p>}
            {error && <p className="error">{error}</p>}
        </div>
    );
};

export default Popup;
