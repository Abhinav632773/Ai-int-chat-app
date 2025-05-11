import React, { useState } from 'react';
import { 
  RiFolderFill, 
  RiFolderOpenFill, 
  RiFile3Fill, 
  RiFileTextFill,
  RiGitBranchLine,
  RiDeleteBin6Line
} from 'react-icons/ri';

const FileExplorer = ({ fileTree, onFileSelect, currentOpenFile, onFileDelete }) => {
  const [expandedFolders, setExpandedFolders] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleFileClick = (name, contents) => {
    if (contents) {
      onFileSelect({
        name,
        contents
      });
    }
  };

  const handleDeleteClick = (e, filePath) => {
    e.stopPropagation();
    setFileToDelete(filePath);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (fileToDelete && onFileDelete) {
      // Split the path into parts
      const pathParts = fileToDelete.split('/').filter(Boolean);
      
      // Create a copy of the file tree
      const newFileTree = { ...fileTree };
      
      // Navigate to the correct location in the tree
      let current = newFileTree;
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (current[pathParts[i]]?.children) {
          current = current[pathParts[i]].children;
        }
      }
      
      // Delete the file
      const fileName = pathParts[pathParts.length - 1];
      delete current[fileName];
      
      // Call the onFileDelete callback with the updated tree
      onFileDelete(newFileTree);
    }
    setShowDeleteModal(false);
    setFileToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setFileToDelete(null);
  };

  const isFileOpen = (fileName) => {
    return currentOpenFile && currentOpenFile === fileName;
  };

  const renderFileTree = (tree, path = '') => {
    return Object.entries(tree).map(([name, item]) => {
      const currentPath = `${path}/${name}`;
      const isFolder = item.children !== undefined;
      const isExpanded = expandedFolders[currentPath];

      if (isFolder) {
        return (
          <div key={currentPath} className="pl-4">
            <div 
              className="flex items-center py-1 px-2 hover:bg-gray-700 rounded cursor-pointer text-yellow-400"
              onClick={() => toggleFolder(currentPath)}
            >
              {isExpanded ? (
                <RiFolderOpenFill className="mr-2" />
              ) : (
                <RiFolderFill className="mr-2" />
              )}
              <span className="text-sm">{name}</span>
            </div>

            {isExpanded && item.children && (
              <div className="ml-2 border-l border-gray-600">
                {renderFileTree(item.children, currentPath)}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div 
            key={currentPath}
            className={`group flex items-center py-1 px-2 rounded cursor-pointer pl-4
              ${isFileOpen(name) ? 'bg-gray-700 text-blue-300' : 'hover:bg-gray-700 text-blue-400'}`}
            onClick={() => handleFileClick(name, item.file?.contents)}
          >
            {isFileOpen(name) ? (
              <RiFileTextFill className="text-yellow-400 mr-2" />
            ) : (
              <RiFile3Fill className="text-yellow-500 mr-2" />
            )}
            <span className={`text-sm ${isFileOpen(name) ? 'font-medium' : ''}`}>
              {name}
            </span>
            <button
              className="opacity-0 group-hover:opacity-100 ml-auto text-red-400 hover:text-red-300 p-1"
              onClick={(e) => handleDeleteClick(e, currentPath)}
            >
              <RiDeleteBin6Line />
            </button>
          </div>
        );
      }
    });
  };

  return (
    <div className="min-w-[200px] w-48 bg-gray-800/80 border-r border-gray-700 flex flex-col h-full backdrop-blur-lg z-10">
      {/* Header */}
      <div className="h-[56px] px-4 py-3 border-b border-gray-700 flex items-center justify-between bg-gray-900">
        <span className="text-sm font-medium text-gray-300">EXPLORER</span>
      </div>

      {/* Files List */}
      <div className="flex-1 overflow-y-auto py-2">
        {fileTree ? (
          renderFileTree(fileTree)
        ) : (
          <div className="px-4 py-2 text-gray-500 text-sm">No files available</div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-500">
        <div className="flex items-center">
          <RiGitBranchLine className="mr-2" />
          <span>main</span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-200 mb-4">Delete File</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this file? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-300"
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;