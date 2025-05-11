import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../context/user.context";
import axios from "../config/axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify"; // ✅ Import Toastify
import "react-toastify/dist/ReactToastify.css"; // ✅ Import Styles

const Home = () => {
  const { user } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  // Fetch projects from backend
  useEffect(() => {
    axios
      .get("/projects/all")
      .then((res) => {
        console.log("Fetched projects:", res.data.projects);
        setProjects(res.data.projects || []);
      })
      .catch((err) => {console.error("Error fetching projects:", err);
        res.status(500).json({ error: "Internal Server Error" });
      toast.error("⚠️ Failed to fetch projects. Please try again.", { autoClose: 3000 }); // ✅ Show error toast
      });
  }, []);

  // Create new project
  function createProject(e) {
    e.preventDefault();
  
    if (!user || !user._id) {
      console.error("❌ User ID is missing. Cannot create project.");
      return;
    }
  
    const token = localStorage.getItem("token"); // 🔥 Retrieve token from local storage
    if (!token) {
      console.error("🚨 No token found. User must log in.");
      return;
    }
  
    console.log("✅ Sending request with:", { name: projectName, userId: user._id });
  
    axios
    .post(
      "/projects/create",
      JSON.stringify({ name: projectName, userId: user._id }),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((res) => {
        console.log("🎉 Project created:", res.data);
        setProjects((prevProjects) => [...prevProjects, { ...res.data, isNew: true }]);
        setProjectName("");
        setIsModalOpen(false);

        toast.success(" 🎉 Project created successfully!", { autoClose: 3000 }); // ✅ Success Toast
      })
      .catch((error) => {
        console.error("🚨 Project Creation Error:", error.response?.data || error);
        
        if (error.response?.data?.message === "Project name already exists") {
          toast.error(" Project name already exists!", { autoClose: 3000 }); // ✅ Show error toast
        } else {
          toast.error("⚠️ Something went wrong or project name already exists. Try again.", { autoClose: 3000 });
        }
      });
  }

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center p-6 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* ✅ Toast Container */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      {/* Animated Background */}
      <motion.div
        className="absolute inset-0 z-0"
        animate={{
          background: [
            "linear-gradient(135deg, #1e3a8a, #2563eb)",
            "linear-gradient(135deg, #2563eb, #0f172a)",
            "linear-gradient(135deg, #0f172a, #1e3a8a)",
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
      />

      {/* Welcome Message */}
      <h1 className="text-3xl font-bold text-white relative z-10 mb-6">
        Welcome, {user?.email}
      </h1>

      {/* Wide "Create Project" Button */}
      <motion.button
        onClick={() => setIsModalOpen(true)}
        whileHover={{ scale: 1.05 }}
        className="w-full max-w-lg p-4 rounded-lg bg-slate-800 hover:bg-slate-700 transition text-white text-center mb-8 relative z-10"
      >
        <p className="text-lg font-semibold">+ Create New Project</p>
      </motion.button>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl relative z-10">
        {projects.length > 0 ? (
          projects.map((project) => (
            <motion.div
              key={project._id}
              whileHover={{ scale: 1.05 }}
              className={`p-4 rounded-lg transition cursor-pointer relative z-10 ${
                project.isNew ? "bg-green-600 hover:bg-green-500" : "bg-gray-800 hover:bg-gray-700"
              }`}
              onClick={() => navigate(`/project/${project._id}`, { state: { project } })}
            >
              <h2 className="text-xl font-semibold text-white">{project.name}</h2>
              <p className="text-gray-400"><i className="ri-user-line"></i> Collaborators: {project.users?.length || 0}</p>
            </motion.div>
          ))
        ) : (
          <p className="text-gray-400 text-center col-span-full">
            No projects found.
          </p>
        )}
      </div>

      {/* Modal for Creating New Project */}
      {isModalOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md relative z-30"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            <h2 className="text-2xl font-bold mb-4 text-center text-white">
              Create New Project
            </h2>
            <form onSubmit={createProject}>
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">Project Name</label>
                <motion.input
                  whileFocus={{ scale: 1.05 }}
                  onChange={(e) => setProjectName(e.target.value)}
                  value={projectName}
                  type="text"
                  className="w-full p-3 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex text-white justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Home;
