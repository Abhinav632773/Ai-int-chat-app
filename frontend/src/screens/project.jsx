import React, { useState, useEffect, useContext, useRef } from "react";
import { UserContext } from "../context/user.context";
import { useParams } from "react-router-dom";
import axios from "../config/axios";
import {
  initializeSocket,
  receiveMessage,
  sendMessage,
} from "../config/socket";
import AIMessage from "../components/AIMessage";
import FileExplorer from "../components/FileExplorer";
import FileEditor from "../components/FileEditor";
import ErrorBoundary from "../components/ErrorBoundary";
import { WebContainer } from '@webcontainer/api';

const Project = () => {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState({});
  const [projectUsers, setProjectUsers] = useState([]);
  const { user } = useContext(UserContext);
  const messagesEndRef = useRef(null);
  const [fileContent, setFileContent] = useState("");
  const [fileTree, setFileTree] = useState({
    "README.md": {
      file: {
        contents: "# Welcome to the Project\n\nSelect a file to view its contents",
      },
    },
  });
  const [currentFile, setCurrentFile] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [webcontainerInstance, setWebcontainerInstance] = useState(null);
  const [project, setProject] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Initialize socket and fetch initial data
  useEffect(() => {
    initializeSocket(id);

    const handleMessage = (data) => {
      setMessages((prev) => {
        const currentMessages = prev || [];
        const messageExists = currentMessages.some(
          (msg) =>
            msg._id === data._id ||
            (msg.createdAt === data.createdAt && msg.sender === data.sender)
        );

        if (messageExists) return currentMessages;
        return [...currentMessages, data];
      });

      if (data.fileTree) {
        setFileTree(data.fileTree);
      }
    };

    receiveMessage("project-message", handleMessage);

    // Fetch users and project data
    const fetchInitialData = async () => {
      try {
        // Fetch all users
        const usersRes = await axios.get("/users/all");
        if (usersRes.data && usersRes.data.users) {
          setUsers(usersRes.data.users);
        }

        // Fetch project data
        const projectRes = await axios.get(`/projects/get-project/${id}`);
        if (projectRes.data && projectRes.data.project) {
          setProject(projectRes.data.project);
          
          // Update file tree if it exists
          if (projectRes.data.project.fileTree) {
            setFileTree(projectRes.data.project.fileTree);
          }
        }

        // Fetch project users separately
        const projectUsersRes = await axios.get(`/projects/${id}/users`);
        if (projectUsersRes.data && projectUsersRes.data.users) {
          setProjectUsers(projectUsersRes.data.users);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setIsInitialLoad(false);
      }
    };

    fetchInitialData();
  }, [id]);

  // Message scroll effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebContainer initialization
  useEffect(() => {
    const initWebContainer = async () => {
      try {
        const instance = await WebContainer.boot();
        setWebcontainerInstance(instance);
      } catch (error) {
        console.error("Error initializing WebContainer:", error);
      }
    };
    initWebContainer();
  }, []);

  // Save file tree when it changes
  useEffect(() => {
    if (fileTree && Object.keys(fileTree).length > 0) {
      const timeoutId = setTimeout(async () => {
        try {
          await saveFileTrees(fileTree);
        } catch (error) {
          console.error("Error saving file tree:", error);
        }
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [fileTree, id]);

  const saveFileTrees = async (ft) => {
    if (!id) return;
    try {
      const response = await axios.put(`/projects/update-file-tree`, {
        projectId: id,
        fileTree: ft
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to save file tree");
      }
    } catch (error) {
      console.error("Error saving file tree:", error.response?.data || error.message);
      throw error; // Re-throw to handle in the effect
    }
  };

  const send = () => {
    if (!input.trim()) return;
    const newMessage = {
      message: input,
      sender: user._id,
      senderEmail: user.email,
      createdAt: new Date().toISOString(),
    };
    sendMessage("project-message", newMessage);
    setInput("");
  };

  const toggleUserSelection = (userEmail) => {
    setSelectedUsers((prev) => ({ ...prev, [userEmail]: !prev[userEmail] }));
  };

  const addUsersToProject = async () => {
    const newUsers = Object.keys(selectedUsers).filter(
      (email) => selectedUsers[email]
    );
    if (newUsers.length === 0 || !id) return;

    try {
      const { data } = await axios.post("/users/get-ids", { emails: newUsers });
      const userIds = data.userIds;

      await axios.put("/projects/add-user", { projectId: id, users: userIds });

      const userDetailsResponse = await axios.post("/users/get-emails", {
        userIds,
      });
      const userEmails = userDetailsResponse.data.emails;

      setProjectUsers((prev) => [...new Set([...prev, ...userEmails])]);
      setShowAllUsers(false);
      setSelectedUsers({});
    } catch (error) {
      console.error(
        "Error adding users:",
        error.response?.data || error.message
      );
    }
  };

  const handleCreateFiles = (newFileTree) => {
    const updatedFileTree = {
      ...fileTree,
      ...newFileTree
    };
    setFileTree(updatedFileTree);
  };

  const renderRegularMessage = (msg) => (
    <p className="mt-1 whitespace-pre-wrap">{msg.message}</p>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Sidebar Backdrop */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-md z-40"
          onClick={() => setShowSidebar(false)}
        ></div>
      )}

      {/* Sidebar */}
      {showSidebar && (
        <div className="fixed top-0 right-0 w-64 h-full bg-white shadow-lg p-4 z-50">
          <h3 className="text-lg font-semibold mb-3">Project Users</h3>
          <ul className="space-y-2 max-h-[calc(100%-50px)] overflow-y-auto">
            {projectUsers.length > 0 ? (
              projectUsers.map((userEmail, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 p-2 bg-gray-100 rounded-lg truncate"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-lg">
                    <i className="ri-user-line"></i>
                  </div>
                  <span className="truncate max-w-[140px]" title={userEmail}>
                    {userEmail}
                  </span>
                </li>
              ))
            ) : (
              <p className="text-gray-500">No users in project</p>
            )}
          </ul>
        </div>
      )}

      {/* Add Users Modal */}
      {showAllUsers && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div className="bg-white w-96 p-4 rounded-lg shadow-lg relative">
            <h2 className="text-lg font-semibold mb-3">Add Users to Project</h2>
            <ul className="max-h-60 overflow-y-auto border p-2 rounded">
              {users
                .filter(
                  (u) =>
                    u.email !== user.email && !projectUsers.includes(u.email)
                )
                .map((u) => (
                  <li
                    key={u.email}
                    className="flex items-center justify-between p-2 border-b"
                  >
                    <p>{u.email}</p>
                    <input
                      type="checkbox"
                      checked={selectedUsers[u.email] || false}
                      onChange={() => toggleUserSelection(u.email)}
                    />
                  </li>
                ))}
            </ul>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded"
                onClick={() => setShowAllUsers(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded"
                onClick={addUsersToProject}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="w-2/5 min-w-[30vw] h-full flex flex-col items-center py-4 relative shadow-lg border-r border-gray-700 bg-gradient-to-b from-gray-900 to-gray-800">
        {/* Top Bar */}
        <div className="absolute top-0 left-0 w-full bg-gray-700 bg-opacity-60 h-14 flex justify-between items-center px-4 shadow-md rounded-t-lg">
          <i
            className="ri-user-add-line text-white cursor-pointer text-2xl hover:text-gray-300"
            onClick={() => setShowAllUsers(true)}
          ></i>
          <i
            className="ri-user-3-fill text-white cursor-pointer text-2xl hover:text-gray-300"
            onClick={() => setShowSidebar(true)}
          ></i>
        </div>

        {/* Message Container */}
        <div className="flex flex-col justify-end h-full w-full px-4 pb-4 space-y-2 mt-14">
          <div
            className="flex-1 w-full rounded-lg p-4 overflow-y-auto backdrop-blur-lg bg-white/10 border border-gray-700 shadow-inner"
            style={{ maxHeight: "79vh" }}
          >
            <div className="space-y-2">
              {messages && messages.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                messages?.map((msg) => {
                  const isSentByUser = String(msg.sender) === String(user._id);
                  const isAIResponse = String(msg.sender) === "AI";
                  return (
                    <div
                      key={msg._id || msg.createdAt}
                      className={`flex w-full ${
                        isSentByUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div className="w-full flex">
                        <div
                          className={`p-3 rounded-lg max-w-[70%] min-w-[20%] relative shadow-lg break-words border
                            ${
                              isSentByUser
                                ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-700"
                                : isAIResponse
                                ? "bg-gradient-to-r from-gray-800 to-black text-white border-gray-700"
                                : "bg-gray-300 text-black border-gray-400"
                            }
                          `}
                        >
                          <p
                            className="text-xs font-medium truncate max-w-[160px] text-gray-600"
                            title={msg.senderEmail}
                          >
                            {isAIResponse
                              ? "AI Assistant"
                              : isSentByUser
                              ? "You"
                              : msg.senderEmail}
                          </p>

                          {isAIResponse ? (
                            <ErrorBoundary>
                              <AIMessage
                                message={msg.message}
                                onCreateFile={handleCreateFiles}
                              />
                            </ErrorBoundary>
                          ) : (
                            renderRegularMessage(msg)
                          )}

                          <p className="text-xs text-right mt-1 text-gray-500">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="flex items-center w-full bg-gray-800 rounded-lg shadow-md px-3 py-2 border border-gray-700">
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-1 outline-none border-none p-2 text-sm bg-transparent text-white placeholder-gray-400"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button
              className="ml-2 text-white hover:text-gray-300 text-xl"
              onClick={send}
            >
              <i className="ri-send-plane-fill"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Project Content Area */}
      <div className="flex flex-1 min-w-0 text-white">
        <div className="flex flex-1 min-w-0">
          <FileExplorer
            fileTree={fileTree}
            onFileSelect={(file) => {
              setCurrentFile(file);
              setFileContent(file.contents);
            }}
            currentOpenFile={currentFile?.name}
            onFileDelete={(newFileTree) => {
              setFileTree(newFileTree);
              // If the deleted file was the current file, clear it
              if (currentFile && !newFileTree[currentFile.name]) {
                setCurrentFile(null);
                setFileContent("");
              }
            }}
          />
          <div className="flex-1 min-w-0">
            <FileEditor
              file={currentFile}
              content={fileContent}
              webcontainerInstance={webcontainerInstance}
              fileTree={fileTree}
              setFileTree={setFileTree}
              setIframeUrl={setIframeUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Project;
