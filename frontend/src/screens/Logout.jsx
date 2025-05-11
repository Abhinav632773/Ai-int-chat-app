import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../context/user.context.jsx";

const Navbar = () => {
  const { user, logout } = useContext(UserContext);

  return (
    <nav className="bg-gray-900 text-white p-4 flex justify-between">
      <Link to="/" className="text-xl font-bold">MyApp</Link>

      <div>
        {user ? (
          <>
            <span className="mr-4">Welcome, {user.email}!</span>
            <button
              onClick={logout}
              className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="mr-4">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
