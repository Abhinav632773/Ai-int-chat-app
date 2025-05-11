import React, { useState } from "react";

const FileTree = ({ data, onFileSelect }) => {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (path) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
  };

  if (!data) return (
    <div className="p-4 text-gray-400">
      No files available
    </div>
  );

  const renderTree = (node, path = '') => {
    return (
      <ul className="pl-4 space-y-1">
        {Object.entries(node).map(([name, item]) => {
          const currentPath = path ? `${path}/${name}` : name;
          const isDirectory = item.children || (item.file && item.file.contents === undefined);
          
          return (
            <li key={currentPath} className="mb-1">
              <div 
                className={`flex items-center hover:bg-gray-700 rounded px-1 py-0.5 cursor-pointer ${isDirectory ? 'text-blue-300' : 'text-purple-200'}`}
                onClick={() => {
                  if (!isDirectory && item.file?.contents) {
                    onFileSelect({ name, contents: item.file.contents });
                  } else {
                    toggleExpand(currentPath);
                  }
                }}
              >
                <span className="mr-2">
                  {isDirectory ? (expanded[currentPath] ? '📂' : '📁') : '📄'}
                </span>
                <span className="font-mono text-sm">{name}</span>
              </div>
              
              {isDirectory && expanded[currentPath] && item.children && (
                renderTree(item.children, currentPath)
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="p-2 bg-gray-800 text-gray-100 h-full overflow-y-auto">
      <div className="font-medium text-gray-300 mb-2 px-2 py-1 border-b border-gray-700">
        Project Files
      </div>
      {renderTree(data)}
    </div>
  );
};

export default FileTree;