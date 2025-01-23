import { useNavigate, useLocation } from 'react-router-dom';
import React, { useState } from 'react';
import { database } from '../firebase.config';
import { ref, get, child, push } from 'firebase/database';

function LogAdmin2() {
  const navigate = useNavigate();
  const location = useLocation(); // Retrieve location state
  const selectedWindow = location.state?.selectedWindow; // Access selectedWindow from location state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, 'admin'));

      if (snapshot.exists()) {
        const admins = snapshot.val();

        let isValid = false;
        let matchedAdmin = null;

        for (const key in admins) {
          if (
            admins[key].Username === username &&
            admins[key].Password === password
          ) {
            isValid = true;
            matchedAdmin = admins[key];
            break;
          }
        }

        if (isValid) {
          const loginHistoryRef = ref(database, 'Login_History');
          const now = new Date();

          await push(loginHistoryRef, {
            name: matchedAdmin.Name,
            date: now.toLocaleDateString(),
            time: now.toLocaleTimeString(),
            window: selectedWindow || 'Unknown', // Use the selected window or default to "Unknown"
          });

          navigate('/dashboard2');
        } else {
          alert('Invalid credentials. Please try again.');
        }
      } else {
        alert('No admin data found in the database.');
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="log-cont">
      <h2 className="logo">SmartQueues-Admin</h2>
      <div className="log-card">
        <div className="log-creds">
          <h2 className="credz">Username:</h2>
          <input
            className="inpz"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <h2 className="credz">Password:</h2>
          <input
            className="inpz"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="log-submit" onClick={handleLogin}>
            Submit
          </button>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </div>
  );
}

export default LogAdmin2;
