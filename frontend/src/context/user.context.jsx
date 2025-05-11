import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the UserContext
export const UserContext = createContext();

// Create a provider component
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
  
    // ✅ Load user from localStorage when the app starts
    useEffect(() => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (storedUser) {
        setUser(storedUser);
      }
    }, []);
  
    // ✅ Update user in localStorage when it changes
    const updateUser = (userData) => {
      setUser(userData);
      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        localStorage.removeItem("user");
      }
    };
  
    // ✅ Logout function to clear user data
    const logout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    };
    return (
        <UserContext.Provider value={{ user, setUser : updateUser,logout }}>
            {children}
        </UserContext.Provider>
    );
};

