// Chat.js

import React, { useState } from "react";
import "./chat.css"; // Import the CSS file

const Chat = ({ messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim() !== '') {
      onSendMessage({ sender: 'You', content: newMessage }); // Update with sender information
      setNewMessage('');
    }
  };

  return (
    <div>
      <div className="chat-box">
        {messages.map((message, index) => (
          <div key={index} className="message">
            <span className="sender">{message.sender}:</span>
            <span className="content">{message.content}</span>
          </div>
        ))}
      </div>
      <div className="input-box">
        <input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
