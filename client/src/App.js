import React, { useState, useEffect } from "react";
import axios from "axios";
import { Document, Page } from "react-pdf";
import { auth } from "./firebase";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "./App.css";

const App = () => {
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => setUser(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [user, page]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await axios.get(`/files?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles(response.data.files);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      setError("Error fetching files");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    try {
      const token = await user.getIdToken();
      await axios.post("/upload", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchFiles();
    } catch (error) {
      setError("Error uploading file");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const email = prompt("Enter email");
      const password = prompt("Enter password");
      await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
      setError("Error logging in");
    }
  };

  const handleRegister = async () => {
    try {
      const email = prompt("Enter email");
      const password = prompt("Enter password");
      await auth.createUserWithEmailAndPassword(email, password);
    } catch (error) {
      setError("Error registering");
    }
  };

  const handleResetPassword = async () => {
    try {
      const email = prompt("Enter email");
      await auth.sendPasswordResetEmail(email);
    } catch (error) {
      setError("Error sending password reset email");
    }
  };

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div>
      {user ? (
        <>
          <button onClick={handleLogout}>Logout</button>
          <button onClick={handleResetPassword}>Reset Password</button>
          <input type="file" onChange={handleUpload} />
          {loading && <div>Loading...</div>}
          {error && <div>{error}</div>}
          <ul>
            {files.map((file) => (
              <li key={file._id} onClick={() => setSelectedFile(file)}>
                {file.filename}
              </li>
            ))}
          </ul>
          {selectedFile && (
            <div>
              <Document file={`/files/${selectedFile._id}`}>
                <Page pageNumber={1} />
              </Document>
              <a
                href={`/files/${selectedFile._id}`}
                download={selectedFile.filename}
              >
                Download
              </a>
            </div>
          )}
          <div>
            <button
              onClick={() => setPage((page) => Math.max(page - 1, 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((page) => Math.min(page + 1, totalPages))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <>
          <button onClick={handleLogin}>Login</button>
          <button onClick={handleRegister}>Register</button>
        </>
      )}
    </div>
  );
};

export default App;
