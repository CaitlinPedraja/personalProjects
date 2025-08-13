import React from "react";
import { useNavigate } from "react-router-dom";
import {useAuth} from '../../auth';


export const About = () => {
  const { user, logout  } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    if (user){
      logout();
      alert("You successfully logged out");
      navigate('/');  
    }else{
      alert("You are not Logged in");
    }
  };

  return (
    <div className="contact_container">
    <div className="about_box">
      <h1>Logout Page</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
    </div>

  );
};
