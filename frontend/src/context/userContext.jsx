import React, { createContext, useState } from 'react';

// Create and export the context in one line
export const UserContext = createContext(null);

// Export the provider as a named export instead of default
function UserProvider({ children }) {
    // Initialize user from local storage immediately to prevent state loss on refresh
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (error) {
            console.error('Failed to parse user from local storage', error);
            return null;
        }
    });

    const setUserDetails = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const clearUserDetails = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
    };

    const logoutUser = () => {
        clearUserDetails();
        window.location.href = '/login'; // Global redirect
    };

    return (
        <UserContext.Provider value={{ user, setUserDetails, clearUserDetails, logoutUser }}>
            {children}
        </UserContext.Provider>
    );
}

export default UserProvider;