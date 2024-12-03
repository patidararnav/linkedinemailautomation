import React, { useState } from 'react';
import './Popup.css';

const Popup: React.FC = () => {
    const [name, setName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchEmail = async () => {
        console.log("Sending message to service worker...");
        const response = await chrome.runtime.sendMessage({ action: "GET_EMAIL" });
        console.log("Received response:", response);
        if (response.name) {
            setName(response.name);
        } else {
            setError("Response not received from service worker.");
        }
    }

    return (
        <div className="popup">
            <button onClick={fetchEmail}>Get Email</button>
            {name && <p>Name: {name}</p>}
            {error && <p className="error">{error}</p>}
        </div>
    );
};

export default Popup;
