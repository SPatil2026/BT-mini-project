import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import AttendanceABI from "./AttendanceABI.json";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  header: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  card: {
    backgroundColor: '#fff',
    padding: '20px',
    marginBottom: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  button: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    margin: '5px'
  },
  input: {
    padding: '10px',
    margin: '5px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    width: '200px'
  },
  list: {
    backgroundColor: '#f8f9fa',
    padding: '10px',
    borderRadius: '5px',
    margin: '10px 0'
  }
};

export default function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    if (window.ethereum) {
      const p = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(p);
    }
  }, []);

  async function connect() {
    await provider.send("eth_requestAccounts", []);
    const s = provider.getSigner();
    setSigner(s);
    const a = await s.getAddress();
    setAccount(a);
    const c = new ethers.Contract(CONTRACT_ADDRESS, AttendanceABI, s);
    setContract(c);
    loadData(c);
  }

  async function loadData(contract) {
    try {
      const studentList = await contract.getAllStudents();
      setStudents(studentList);
      const count = await contract.sessionCount();
      setSessionCount(count.toNumber());
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  async function createSession() {
    if (!contract) return;
    const metadata = document.getElementById("sessionMetadata").value || "New Session";
    const tx = await contract.createSession(metadata);
    await tx.wait();
    alert("Session created");
    loadData(contract);
  }

  async function addStudent(addr) {
    if (!contract || !addr) return;
    const tx = await contract.addStudent(addr);
    await tx.wait();
    alert("Student added");
    document.getElementById("addr").value = "";
    loadData(contract);
  }

  async function markAttendance() {
    if (!contract) return;
    const sessionId = document.getElementById("sessionId").value;
    const studentAddr = document.getElementById("studentAddr").value;
    if (!sessionId || !studentAddr) {
      alert("Please fill all fields");
      return;
    }
    const tx = await contract.markAttendance(sessionId, studentAddr);
    await tx.wait();
    alert("Attendance marked");
    document.getElementById("sessionId").value = "";
    document.getElementById("studentAddr").value = "";
  }

  async function checkAttendance() {
    if (!contract) return;
    const sessionId = document.getElementById("checkSessionId").value;
    const studentAddr = document.getElementById("checkStudentAddr").value;
    if (!sessionId || !studentAddr) {
      alert("Please fill all fields");
      return;
    }
    const isPresent = await contract.isPresent(sessionId, studentAddr);
    const count = await contract.getStudentAttendanceCount(studentAddr);
    alert(`Present: ${isPresent ? 'Yes' : 'No'}\nTotal Attendance: ${count}`);
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>🎓 Student Attendance System</h1>
        <p>Blockchain-based attendance tracking</p>
      </div>
      
      {!account ? (
        <div style={styles.card}>
          <h3>Connect Your Wallet</h3>
          <button style={styles.button} onClick={connect}>Connect MetaMask</button>
        </div>
      ) : (
        <div>
          <div style={styles.card}>
            <h3>👤 Connected Account</h3>
            <p><strong>Address:</strong> {account}</p>
            <p><strong>Total Sessions:</strong> {sessionCount}</p>
            <p><strong>Total Students:</strong> {students.length}</p>
          </div>

          <div style={styles.card}>
            <h3>📅 Create Session</h3>
            <input style={styles.input} id="sessionMetadata" placeholder="Session name (e.g., Math 101)" />
            <button style={styles.button} onClick={() => createSession()}>Create Session</button>
          </div>
          
          <div style={styles.card}>
            <h3>👥 Add Student</h3>
            <input style={styles.input} id="addr" placeholder="Student address" />
            <button style={styles.button} onClick={() => addStudent(document.getElementById("addr").value)}>Add Student</button>
          </div>
          
          <div style={styles.card}>
            <h3>✅ Mark Attendance</h3>
            <input style={styles.input} id="sessionId" placeholder="Session ID" />
            <input style={styles.input} id="studentAddr" placeholder="Student address" />
            <button style={styles.button} onClick={() => markAttendance()}>Mark Present</button>
          </div>

          <div style={styles.card}>
            <h3>🔍 Check Attendance</h3>
            <input style={styles.input} id="checkSessionId" placeholder="Session ID" />
            <input style={styles.input} id="checkStudentAddr" placeholder="Student address" />
            <button style={styles.button} onClick={() => checkAttendance()}>Check Status</button>
          </div>

          <div style={styles.card}>
            <h3>📋 Registered Students</h3>
            <div style={styles.list}>
              {students.length > 0 ? (
                students.map((student, index) => (
                  <div key={index} style={{padding: '5px', borderBottom: '1px solid #eee'}}>
                    {student}
                  </div>
                ))
              ) : (
                <p>No students registered yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}