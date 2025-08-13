import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {useAuth} from '../../auth';

export const Contact = () => {
  const [user_name, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e, isSignup) => {
    e.preventDefault();
    try {
      if (isSignup) {
        const newUsername = prompt("Enter your username:");
        const newPassword = prompt("Enter your password:");

        if (newUsername && newPassword) {
          
            const response = await axios.post('/signup', { newUsername, newPassword });
            console.log('Signup successful!');
            const { token, u } = response.data;
            login(token, u);
            
            navigate('/');  
          }
      } else {
        console.log(user_name);
        console.log(password);
        const response = await axios.post('/login', { user_name, password });
        console.log('Logged in successfully:');
        const { token, username } = response.data;
        login(token, username);
        navigate('/');  

  }
}      catch (error) {
        console.error('Failed:', error.response.data.message);
        alert(`${error.response.data.message}`);
}
  };

  return (
    <>
      <div className="contact_container">
        <div className="about_box">
          <h1>Log In</h1>
          <form onSubmit={(e) => handleSubmit(e, false)}>
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              placeholder="Enter your username"
              value={user_name}
              onChange={(e) => setUsername(e.target.value)}
            />
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="button_container"> 
              <button type="submit">Login</button>
              <button type="button" onClick={(e) => handleSubmit(e, true)}>Signup</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
