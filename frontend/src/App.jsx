import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wallet, 
  Users, 
  Calendar, 
  CheckCircle, 
  UserPlus, 
  BookOpen,
  Activity,
  Zap,
  Shield
} from 'lucide-react'
import AttendanceABI from './AttendanceABI.json'
import './App.css'

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

function App() {
  const [contract, setContract] = useState(null)
  const [account, setAccount] = useState(null)
  const [students, setStudents] = useState([])
  const [sessions, setSessions] = useState([])
  const [sessionCount, setSessionCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  const connect = async () => {
    if (window.ethereum) {
      try {
        setLoading(true)
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        await provider.send("eth_requestAccounts", [])
        const signer = provider.getSigner()
        const address = await signer.getAddress()
        setAccount(address)
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, AttendanceABI, signer)
        setContract(contractInstance)
        await loadData(contractInstance)
      } catch (error) {
        console.error("Connection failed:", error)
      } finally {
        setLoading(false)
      }
    }
  }

  const loadData = async (contract) => {
    try {
      // Load session count
      const count = await contract.sessionCount()
      const sessionCountNum = count.toNumber()
      setSessionCount(sessionCountNum)
      
      // Load students
      try {
        const studentCount = await contract.getStudentCount()
        const studentList = []
        for (let i = 0; i < studentCount.toNumber(); i++) {
          const name = await contract.studentNames(i)
          studentList.push(name)
        }
        setStudents(studentList)
      } catch (err) {
        console.log("No students yet")
        setStudents([])
      }
      
      // Load sessions
      try {
        const sessionList = []
        for (let i = 1; i <= sessionCountNum; i++) {
          const sessionName = await contract.sessions(i)
          sessionList.push({ id: i, name: sessionName })
        }
        setSessions(sessionList)
      } catch (err) {
        console.log("No sessions yet")
        setSessions([])
      }
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const registerStudent = async (e) => {
    e.preventDefault()
    if (!contract) return
    const formData = new FormData(e.target)
    const name = formData.get('studentName')
    if (!name) return
    
    try {
      setLoading(true)
      const tx = await contract.registerStudent(name)
      await tx.wait()
      e.target.reset()
      await loadData(contract)
    } catch (error) {
      console.error("Error:", error)
      alert("Error: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const createSession = async (e) => {
    e.preventDefault()
    if (!contract) return
    const formData = new FormData(e.target)
    const sessionName = formData.get('sessionName') || "New Session"
    
    try {
      setLoading(true)
      const tx = await contract.createSession(sessionName)
      await tx.wait()
      e.target.reset()
      await loadData(contract)
    } catch (error) {
      console.error("Error:", error)
      alert("Error: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const markAttendance = async (e) => {
    e.preventDefault()
    if (!contract) return
    const formData = new FormData(e.target)
    const sessionId = formData.get('sessionId')
    const studentName = formData.get('studentName')
    
    if (!sessionId || !studentName) {
      alert("Please fill all fields")
      return
    }
    
    try {
      setLoading(true)
      const tx = await contract.markAttendance(sessionId, studentName)
      await tx.wait()
      e.target.reset()
      alert("Attendance marked successfully!")
    } catch (error) {
      console.error("Error:", error)
      alert("Error: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'sessions', label: 'Sessions', icon: Calendar },
    { id: 'attendance', label: 'Attendance', icon: CheckCircle }
  ]

  return (
    <div className="app">
      <div className="background-gradient"></div>
      
      <motion.header 
        className="header"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-content">
          <div className="logo">
            <BookOpen className="logo-icon" />
            <h1>AttendanceChain</h1>
          </div>
          
          {!account ? (
            <motion.button 
              className="connect-btn"
              onClick={connect}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Wallet size={20} />
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </motion.button>
          ) : (
            <div className="account-info">
              <Shield className="shield-icon" />
              <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
            </div>
          )}
        </div>
      </motion.header>

      {account && (
        <motion.nav 
          className="nav-tabs"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <motion.button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon size={20} />
                {tab.label}
              </motion.button>
            )
          })}
        </motion.nav>
      )}

      <main className="main">
        <AnimatePresence mode="wait">
          {!account ? (
            <motion.div 
              key="welcome"
              className="welcome-screen"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.6 }}
            >
              <div className="welcome-content">
                <Zap className="welcome-icon" />
                <h2>Welcome to AttendanceChain</h2>
                <p>Secure, transparent, and decentralized attendance tracking on the blockchain</p>
                <motion.button 
                  className="cta-button"
                  onClick={connect}
                  disabled={loading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Wallet size={24} />
                  Get Started
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              className="tab-content"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
            >
              {activeTab === 'dashboard' && (
                <div className="dashboard">
                  <div className="stats-grid">
                    <motion.div 
                      className="stat-card"
                      whileHover={{ scale: 1.02 }}
                    >
                      <Calendar className="stat-icon" />
                      <div className="stat-info">
                        <h3>{sessionCount}</h3>
                        <p>Total Sessions</p>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      className="stat-card"
                      whileHover={{ scale: 1.02 }}
                    >
                      <Users className="stat-icon" />
                      <div className="stat-info">
                        <h3>{students.length}</h3>
                        <p>Registered Students</p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}

              {activeTab === 'students' && (
                <div className="students-tab">
                  <motion.div 
                    className="form-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h3><UserPlus size={24} /> Register New Student</h3>
                    <form onSubmit={registerStudent}>
                      <input 
                        name="studentName"
                        placeholder="Enter student name"
                        required
                      />
                      <motion.button 
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {loading ? 'Registering...' : 'Register Student'}
                      </motion.button>
                    </form>
                  </motion.div>

                  <motion.div 
                    className="list-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h3><Users size={24} /> Registered Students</h3>
                    <div className="student-list">
                      {students.map((name, index) => (
                        <motion.div 
                          key={index}
                          className="student-item"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="student-avatar">{name.charAt(0).toUpperCase()}</div>
                          <span>{name}</span>
                        </motion.div>
                      ))}
                      {students.length === 0 && (
                        <p className="empty-state">No students registered yet</p>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}

              {activeTab === 'sessions' && (
                <div className="sessions-tab">
                  <motion.div 
                    className="form-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h3><Calendar size={24} /> Create New Session</h3>
                    <form onSubmit={createSession}>
                      <input 
                        name="sessionName"
                        placeholder="Enter session name"
                        required
                      />
                      <motion.button 
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {loading ? 'Creating...' : 'Create Session'}
                      </motion.button>
                    </form>
                  </motion.div>

                  <motion.div 
                    className="list-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h3><Calendar size={24} /> All Sessions</h3>
                    <div className="student-list">
                      {sessions.map((session, index) => (
                        <motion.div 
                          key={index}
                          className="student-item"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="student-avatar">{session.id}</div>
                          <span>{session.name}</span>
                        </motion.div>
                      ))}
                      {sessions.length === 0 && (
                        <p className="empty-state">No sessions created yet</p>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}

              {activeTab === 'attendance' && (
                <div className="attendance-tab">
                  <motion.div 
                    className="form-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h3><CheckCircle size={24} /> Mark Attendance</h3>
                    <form onSubmit={markAttendance}>
                      <input 
                        name="sessionId"
                        type="number"
                        placeholder="Session ID"
                        min="1"
                        required
                      />
                      <input 
                        name="studentName"
                        placeholder="Student name"
                        required
                      />
                      <motion.button 
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {loading ? 'Marking...' : 'Mark Present'}
                      </motion.button>
                    </form>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App