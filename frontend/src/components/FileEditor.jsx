import React, { useEffect, useRef, useState } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/base16/dracula.css';
import { RiFileCodeLine, RiFileCopyLine, RiPlayLine } from 'react-icons/ri';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const FileEditor = ({ file, content, webcontainerInstance, fileTree }) => {
  const codeRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const contentRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runProcess, setRunProcess] = useState(null);
  const [serverUrl, setServerUrl] = useState(null);
  const [editableUrl, setEditableUrl] = useState(null);
  const [baseUrl, setBaseUrl] = useState('');

  // Syntax highlighting
  useEffect(() => {
    if (codeRef.current) {
      delete codeRef.current.dataset.highlighted;
      hljs.highlightElement(codeRef.current);
    }
  }, [content, file]);

  // Sync line numbers scroll with content scroll
  useEffect(() => {
    const contentEl = contentRef.current;
    const lineNumbersEl = lineNumbersRef.current;

    const handleScroll = () => {
      if (lineNumbersEl && contentEl) {
        lineNumbersEl.scrollTop = contentEl.scrollTop;
      }
    };

    if (contentEl) {
      contentEl.addEventListener('scroll', handleScroll);
      return () => contentEl.removeEventListener('scroll', handleScroll);
    }
  }, []);
 
  //Serve URL update
  useEffect(() => {
    if (serverUrl) {
      setBaseUrl(serverUrl);
      setEditableUrl(serverUrl);
    }
  }, [serverUrl]);

  useEffect(() => {
    if (!webcontainerInstance) return;

    const handler = (port, url) => {
      console.log('Server ready on:', port, url);
      setServerUrl(url);
    };

    webcontainerInstance.on('server-ready', handler);
    return () => {
      // No cleanup needed
    };
  }, [webcontainerInstance]);

  const getLanguage = () => {
    if (!file) return 'plaintext';
    const fileName = typeof file === 'string' ? file : file.name;
    const extension = fileName.split('.').pop();
    switch(extension) {
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'py': return 'python';
      case 'css': return 'css';
      case 'html': return 'html';
      case 'json': return 'json';
      default: return 'plaintext';
    }
  };

  const getDisplayFileName = () => {
    if (!file) return 'Untitled';
    const fileName = typeof file === 'string' ? file : file.name;
    if (!fileName) return 'Untitled';
    const lastSlashIndex = fileName.lastIndexOf('/');
    return lastSlashIndex >= 0 
      ? fileName.substring(lastSlashIndex + 1)
      : fileName;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard!', {
      position: "bottom-center",
      autoClose: 2000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "dark",
    });
  };

  const handleRunProject = async () => {
    if (!webcontainerInstance) {
      toast.error('WebContainer not initialized', {
        position: "bottom-center",
        autoClose: 2000,
      });
      return;
    }

    setIsRunning(true);
    setServerUrl(null);
    
    try {
      // Clean up previous instance
      await webcontainerInstance.mount({});
      
      // Create a normalized file tree structure
      const normalizedFileTree = {};
      
      // Helper function to create nested structure
      const createNestedStructure = (path, content) => {
        const parts = path.split('/');
        let current = normalizedFileTree;
        
        // Create directories
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
        
        // Add file content
        const fileName = parts[parts.length - 1];
        current[fileName] = content;
      };

      // Process the file tree
      const processFileTree = (tree, currentPath = '') => {
        for (const [name, value] of Object.entries(tree)) {
          const fullPath = currentPath ? `${currentPath}/${name}` : name;
          if (typeof value === 'object' && value !== null) {
            // It's a directory
            createNestedStructure(fullPath, {});
            processFileTree(value, fullPath);
          } else {
            // It's a file
            createNestedStructure(fullPath, value);
          }
        }
      };

      // Process the entire file tree
      processFileTree(fileTree);

      // Mount the normalized file tree
      await webcontainerInstance.mount(normalizedFileTree);

      // Get the file path and normalize it
      const filePath = typeof file === 'string' ? file : file.name;
      const normalizedPath = filePath.replace(/\\/g, '/');
      const fileName = normalizedPath.split('/').pop();
      const fileDir = normalizedPath.split('/').slice(0, -1).join('/');

      // Ensure the directory exists
      if (fileDir) {
        try {
          await webcontainerInstance.fs.mkdir(fileDir, { recursive: true });
          await webcontainerInstance.spawn('cd', [fileDir]);
        } catch (error) {
          console.warn('Directory creation warning:', error);
          // Continue even if directory creation fails
        }
      }

      // Install dependencies if it's a Node.js project
      if (normalizedPath.endsWith('.js') || normalizedPath.endsWith('.ts')) {
        try {
          const installProcess = await webcontainerInstance.spawn("npm", ["install"]);
          await installProcess.exit;
        } catch (error) {
          console.warn('npm install failed, continuing without dependencies:', error);
        }
      }

      // Kill previous process if exists
      if (runProcess) {
        runProcess.kill();
      }

      // Start the project
      const tempRunProcess = await webcontainerInstance.spawn("npm", ["start"]);
      setRunProcess(tempRunProcess);

      // Handle server output
      const reader = tempRunProcess.output.getReader();
      const readOutput = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          console.log('Server Output:', value);
        }
      };
      readOutput();

      // Handle server-ready event
      webcontainerInstance.on('server-ready', (port, url) => {
        console.log('Server ready on:', port, url);
        setServerUrl(url);
        toast.success(`Server running at ${url}`, {
          position: "bottom-center",
          autoClose: 3000,
        });
      });

    } catch (error) {
      toast.error(`Error running project: ${error.message}`, {
        position: "bottom-center",
        autoClose: 3000,
      });
      console.error('Run error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleUrlChange = (e) => {
    const newUrl = e.target.value;
    setEditableUrl(newUrl);
  };

  const handleUrlSubmit = (e) => {
    if (e.key === 'Enter') {
      try {
        // If the URL is relative, combine it with baseUrl
        if (!new URL(editableUrl).protocol) {
          const combinedUrl = new URL(editableUrl, baseUrl).toString();
          setEditableUrl(combinedUrl);
        }
      } catch (error) {
        // If URL is invalid, reset to baseUrl
        setEditableUrl(baseUrl);
      }
    }
  };

  const resetUrl = () => {
    setEditableUrl(baseUrl);
  };

  return (
    <div className="bg-gray-900 w-300 flex flex-col h-full overflow-x-auto">
      <ToastContainer 
        position="bottom-center"
        autoClose={2000}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      
      {/* Header */}
      <div className="bg-gray-800/90 px-4 py-3 border-b border-gray-700 flex justify-between items-center backdrop-blur-lg shadow-lg">
        <div className="flex items-center min-w-200">
          <RiFileCodeLine className="text-blue-400 mr-2 flex-shrink-0 text-xl" />
          <span 
            className="font-mono text-sm text-gray-300 truncate"
            title={getDisplayFileName()}
          >
            {getDisplayFileName()}
          </span>
        </div>
        <div className='flex items-center justify-center gap-4'>
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-white flex items-center flex-shrink-0 transition-colors duration-200 hover:bg-gray-700 px-3 py-1.5 rounded-md"
            title="Copy file content"
          >
            <RiFileCopyLine className="mr-1.5 text-lg" />
            <span className="text-xs font-medium">Copy</span>
          </button>
          <button 
            onClick={handleRunProject}
            disabled={isRunning || !webcontainerInstance}
            className={`flex items-center flex-shrink-0 transition-all duration-200 px-3 py-1.5 rounded-md ${
              isRunning 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-blue-500/25'
            }`}
            title="Run project"
          >
            <RiPlayLine className="mr-1.5 text-lg" />
            <span className="text-xs font-medium">{isRunning ? 'Running...' : 'Run'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Section */}
        <div className="w-1/2 flex flex-col border-r border-gray-700 overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            {/* Line Numbers */}
            <div 
              ref={lineNumbersRef}
              className="text-right pr-4 bg-gray-900/80 text-gray-500 text-sm select-none overflow-y-auto custom-scrollbar"
              style={{ width: '50px' }}
            >
              <div className="px-2">
                {content.split('\n').map((_, i) => (
                  <div key={i} className="opacity-70">{i + 1}</div>
                ))}
              </div>
            </div>
            
            {/* Code Content */}
            <div 
              ref={contentRef}
              className="flex-1 overflow-auto bg-gray-900"
            >
              <pre className="min-h-full p-4">
                <code
                  ref={codeRef}
                  className={`language-${getLanguage()} font-mono text-sm block`}
                >
                  {content}
                </code>
              </pre>
            </div>
          </div>
        </div>

        {/* Server Preview Section */}
        <div className="w-1/2 bg-gray-900 flex flex-col">
          {/* URL Bar */}
          {serverUrl && (
            <div className="flex items-center p-3 border-b border-gray-700 bg-gray-800/90 backdrop-blur-sm shadow-lg">
              <span className="text-sm text-gray-400 mr-2 font-medium">URL:</span>
              <input
                type="text"
                value={editableUrl}
                onChange={handleUrlChange}
                onKeyPress={handleUrlSubmit}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-600 rounded-md bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono placeholder-gray-500 transition-all duration-200"
                placeholder="Enter URL path..."
              />
              <button
                onClick={resetUrl}
                className="ml-2 px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200 hover:bg-gray-700 rounded-md"
                title="Reset to original URL"
              >
                Reset
              </button>
            </div>
          )}

          {serverUrl ? (
            <iframe 
              src={editableUrl}
              title="Server Preview"
              className="flex-1 border-0 bg-white"
              sandbox="allow-scripts allow-same-origin"
              key={editableUrl}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-800/50 text-gray-400">
              <div className="text-center">
                <RiPlayLine className="text-4xl mb-2 mx-auto text-gray-600" />
                <p className="text-sm font-medium">
                  {isRunning ? 'Starting server...' : 'Run the project to see preview'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileEditor;