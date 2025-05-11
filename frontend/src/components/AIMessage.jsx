// components/AIMessage.jsx
import React from 'react';

const AIMessage = ({ message, onCreateFile }) => {
  const handleCreateFiles = () => {
    if (message.fileTree) {
      onCreateFile(message.fileTree);
    }
  };

  return (
    <div className="space-y-4">
      {/* Text content */}
      <div className="bg-black text-white p-4 rounded-lg shadow-lg font-mono text-sm">
        {message.text || message}
      </div>
      
      {/* File creation button (only shows if fileTree exists) */}
      {message.fileTree && (
        <button 
          onClick={handleCreateFiles}
          className="mt-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm"
        >
          Create Project Files
        </button>
      )}
    </div>
  );
};

export default AIMessage;