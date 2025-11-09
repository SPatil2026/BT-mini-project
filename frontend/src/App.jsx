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
  Shield,
  GraduationCap
} from 'lucide-react'
import AttendanceABI from './AttendanceABI.json'
import './App.css'

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

function App() {
  const [contract, setContract] = useState(null)
  const [account, setAccount] = useState(null)
  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [sessions, setSessions] = useState([])
  const [sessionCount, setSessionCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [txStatus, setTxStatus] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedSession, setSelectedSession] = useState(null)
  const [sessionAttendance, setSessionAttendance] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [sessionSearch, setSessionSearch] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [teacherSearch, setTeacherSearch] = useState('')
  const [showSessionDropdown, setShowSessionDropdown] = useState(false)
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false)

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
      
      // Load teachers
      try {
        const teacherCount = await contract.getTeacherCount()
        const teacherList = []
        for (let i = 0; i < teacherCount.toNumber(); i++) {
          const name = await contract.teacherNames(i)
          teacherList.push(name)
        }
        setTeachers(teacherList)
      } catch (err) {
        console.log("No teachers yet")
        setTeachers([])
      }
      
      // Load sessions
      try {
        const sessionList = []
        for (let i = 1; i <= sessionCountNum; i++) {
          const session = await contract.getSession(i)
          sessionList.push({ id: session.id.toNumber(), name: session.name, teacherName: session.teacherName })
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
      setTxStatus('Please confirm transaction in MetaMask...')
      const tx = await contract.registerStudent(name)
      setTxStatus('Transaction submitted. Waiting for confirmation...')
      await tx.wait()
      setTxStatus('Student registered successfully!')
      e.target.reset()
      await loadData(contract)
      setTimeout(() => setTxStatus(''), 3000)
    } catch (error) {
      console.error("Error:", error)
      if (error.message.includes('user rejected')) {
        setTxStatus('Transaction cancelled by user')
      } else {
        setTxStatus('Error: ' + (error.reason || error.message))
      }
      setTimeout(() => setTxStatus(''), 5000)
    } finally {
      setLoading(false)
    }
  }

  const registerTeacher = async (e) => {
    e.preventDefault()
    if (!contract) return
    const formData = new FormData(e.target)
    const name = formData.get('teacherName')
    if (!name) return
    
    try {
      setLoading(true)
      setTxStatus('Please confirm transaction in MetaMask...')
      const tx = await contract.registerTeacher(name)
      setTxStatus('Transaction submitted. Waiting for confirmation...')
      await tx.wait()
      setTxStatus('Teacher registered successfully!')
      e.target.reset()
      await loadData(contract)
      setTimeout(() => setTxStatus(''), 3000)
    } catch (error) {
      console.error("Error:", error)
      if (error.message.includes('user rejected')) {
        setTxStatus('Transaction cancelled by user')
      } else {
        setTxStatus('Error: ' + (error.reason || error.message))
      }
      setTimeout(() => setTxStatus(''), 5000)
    } finally {
      setLoading(false)
    }
  }

  const createSession = async (e) => {
    e.preventDefault()
    if (!contract) return
    const formData = new FormData(e.target)
    const sessionName = formData.get('sessionName') || "New Session"
    const teacherName = formData.get('teacherName')
    
    if (!teacherName) {
      alert("Please select a teacher")
      return
    }
    
    try {
      setLoading(true)
      setTxStatus('Please confirm transaction in MetaMask...')
      const tx = await contract.createSession(sessionName, teacherName)
      setTxStatus('Transaction submitted. Waiting for confirmation...')
      await tx.wait()
      setTxStatus('Session created successfully!')
      e.target.reset()
      await loadData(contract)
      setTimeout(() => setTxStatus(''), 3000)
    } catch (error) {
      console.error("Error:", error)
      if (error.message.includes('user rejected')) {
        setTxStatus('Transaction cancelled by user')
      } else {
        setTxStatus('Error: ' + (error.reason || error.message))
      }
      setTimeout(() => setTxStatus(''), 5000)
    } finally {
      setLoading(false)
    }
  }

  const markAttendance = async (e) => {
    e.preventDefault()
    if (!contract) return
    
    const teacherName = teacherSearch
    const sessionId = sessionSearch.match(/ID: (\d+)/)?.[1]
    const studentName = studentSearch
    
    if (!teacherName || !sessionId || !studentName) {
      alert("Please select teacher, session, and student")
      return
    }
    
    try {
      setLoading(true)
      setTxStatus('Checking attendance status...')
      
      // Check if student is already marked present
      const isAlreadyPresent = await contract.isPresent(sessionId, studentName)
      if (isAlreadyPresent) {
        setTxStatus(`${studentName} is already marked present for this session!`)
        setTimeout(() => setTxStatus(''), 5000)
        return
      }
      
      setTxStatus('Please confirm transaction in MetaMask...')
      const tx = await contract.markAttendance(sessionId, studentName)
      setTxStatus('Transaction submitted. Waiting for confirmation...')
      await tx.wait()
      setTeacherSearch('')
      setSessionSearch('')
      setStudentSearch('')
      setTxStatus(`Attendance marked successfully for ${studentName}!`)
      await loadData(contract)
      setTimeout(() => setTxStatus(''), 3000)
    } catch (error) {
      console.error("Error:", error)
      
      // Handle specific error messages
      let errorMessage = "Failed to mark attendance. "
      
      if (error.message.includes("Already marked")) {
        errorMessage = `${studentName} is already marked present for this session!`
      } else if (error.message.includes("Student not registered")) {
        errorMessage = `${studentName} is not registered in the system!`
      } else if (error.message.includes("Invalid session")) {
        errorMessage = "Invalid session selected!";
      } else if (error.message.includes("user rejected")) {
        errorMessage = "Transaction was cancelled by user.";
      } else {
        errorMessage += error.reason || error.message || "Unknown error occurred.";
      }
      
      setTxStatus(errorMessage)
      setTimeout(() => setTxStatus(''), 5000)
    } finally {
      setLoading(false)
    }
  }

  const getSessionAttendance = async (sessionId) => {
    if (!contract) return []
    const attendanceList = []
    for (const student of students) {
      try {
        const isPresent = await contract.isPresent(sessionId, student)
        if (isPresent) {
          attendanceList.push(student)
        }
      } catch (error) {
        console.error("Error checking attendance:", error)
      }
    }
    return attendanceList
  }

  const openSessionModal = async (session) => {
    setSelectedSession(session)
    setLoading(true)
    const attendance = await getSessionAttendance(session.id)
    setSessionAttendance(attendance)
    setShowModal(true)
    setLoading(false)
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'students', label: 'Student Management', icon: Users },
    { id: 'teachers', label: 'Teachers', icon: GraduationCap },
    { id: 'sessions', label: 'Sessions', icon: Calendar }
  ]

  const filteredTeachers = teachers.filter(teacher => 
    teacher.toLowerCase().includes(teacherSearch.toLowerCase())
  )
  
  const filteredSessions = sessions.filter(session => 
    session.name.toLowerCase().includes(sessionSearch.toLowerCase()) &&
    (!teacherSearch || session.teacherName === teacherSearch)
  )
  
  const filteredStudents = students.filter(student => 
    student.toLowerCase().includes(studentSearch.toLowerCase())
  )

  const handleTeacherSelect = (teacher) => {
    setTeacherSearch(teacher)
    setShowTeacherDropdown(false)
    setSessionSearch('') // Reset session when teacher changes
  }

  const handleSessionSelect = (session) => {
    setSessionSearch(`${session.name} (ID: ${session.id})`)
    setShowSessionDropdown(false)
  }

  const handleStudentSelect = (student) => {
    setStudentSearch(student)
    setShowStudentDropdown(false)
  }

  return (
    <div className="app">
      <main className="main">
        {!account ? (
          <div className="welcome-screen">
            <div className="welcome-content">
              <div className="welcome-hero">
                <BookOpen className="welcome-icon" />
                <h1>AttendanceChain</h1>
                <p>Blockchain-powered attendance management system</p>
                <button 
                  className="cta-button"
                  onClick={connect}
                  disabled={loading}
                >
                  <Wallet size={20} />
                  {loading ? 'Connecting...' : 'Connect Wallet'}
                </button>
              </div>
              <div className="features">
                <div className="feature">
                  <Shield size={24} />
                  <h3>Secure</h3>
                  <p>Blockchain security</p>
                </div>
                <div className="feature">
                  <Users size={24} />
                  <h3>Transparent</h3>
                  <p>Immutable records</p>
                </div>
                <div className="feature">
                  <Activity size={24} />
                  <h3>Real-time</h3>
                  <p>Instant updates</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <nav className="nav-tabs">
              <div className="nav-left">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <Icon size={18} />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
              <div className="wallet-info">
                <Shield className="shield-icon" />
                <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
              </div>
            </nav>
          <div className="tab-content">
            {activeTab === 'dashboard' && (
              <div className="dashboard">
                <div className="page-header">
                  <h2>Dashboard</h2>
                  <p>Overview of your attendance system</p>
                </div>
                
                <div className="dashboard-content">
                  <div className="dashboard-left">
                    <div className="stats-section">
                      <h3 className="section-title">System Overview</h3>
                      <div className="stats-grid">
                        <div className="stat-card">
                          <div className="stat-content">
                            <Calendar className="stat-icon" />
                            <div className="stat-info">
                              <h3>{sessionCount}</h3>
                              <p>Total Sessions</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="stat-card">
                          <div className="stat-content">
                            <Users className="stat-icon" />
                            <div className="stat-info">
                              <h3>{students.length}</h3>
                              <p>Registered Students</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="stat-card">
                          <div className="stat-content">
                            <GraduationCap className="stat-icon" />
                            <div className="stat-info">
                              <h3>{teachers.length}</h3>
                              <p>Registered Teachers</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-right">
                    <div className="attendance-card">
                      <div className="card-header">
                        <div className="header-icon">
                          <CheckCircle size={24} />
                        </div>
                        <div className="header-text">
                          <h3>Mark Attendance</h3>
                          <p>Select session and student to mark attendance</p>
                        </div>
                      </div>
                      
                      <form onSubmit={markAttendance} className="attendance-form">
                        <div className="input-grid">
                          <div className="input-group">
                            <label className="input-label">
                              <GraduationCap size={16} />
                              Select Teacher
                            </label>
                            <div className="searchable-dropdown">
                              <input 
                                type="text"
                                className="search-input"
                                placeholder="Type to search teachers..."
                                value={teacherSearch}
                                onChange={(e) => setTeacherSearch(e.target.value)}
                                onFocus={() => setShowTeacherDropdown(true)}
                                onBlur={() => setTimeout(() => setShowTeacherDropdown(false), 200)}
                                required
                              />
                              {showTeacherDropdown && filteredTeachers.length > 0 && (
                                <div className="dropdown-menu">
                                  {filteredTeachers.map((teacher, index) => (
                                    <div 
                                      key={index} 
                                      className="dropdown-item"
                                      onClick={() => handleTeacherSelect(teacher)}
                                    >
                                      <div className="dropdown-item-content">
                                        <div className="student-avatar-small">{teacher.charAt(0).toUpperCase()}</div>
                                        <span className="student-name-dropdown">{teacher}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="input-group">
                            <label className="input-label">
                              <Calendar size={16} />
                              Select Session
                            </label>
                            <div className="searchable-dropdown">
                              <input 
                                type="text"
                                className="search-input"
                                placeholder="Type to search sessions..."
                                value={sessionSearch}
                                onChange={(e) => setSessionSearch(e.target.value)}
                                onFocus={() => setShowSessionDropdown(true)}
                                onBlur={() => setTimeout(() => setShowSessionDropdown(false), 200)}
                                required
                              />
                              {showSessionDropdown && filteredSessions.length > 0 && (
                                <div className="dropdown-menu">
                                  {filteredSessions.map(session => (
                                    <div 
                                      key={session.id} 
                                      className="dropdown-item"
                                      onClick={() => handleSessionSelect(session)}
                                    >
                                      <div className="dropdown-item-content">
                                        <span className="session-name">{session.name}</span>
                                        <span className="session-badge">ID: {session.id}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="input-group">
                            <label className="input-label">
                              <Users size={16} />
                              Select Student
                            </label>
                            <div className="searchable-dropdown">
                              <input 
                                type="text"
                                className="search-input"
                                placeholder="Type to search students..."
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                onFocus={() => setShowStudentDropdown(true)}
                                onBlur={() => setTimeout(() => setShowStudentDropdown(false), 200)}
                                required
                              />
                              {showStudentDropdown && filteredStudents.length > 0 && (
                                <div className="dropdown-menu">
                                  {filteredStudents.map((student, index) => (
                                    <div 
                                      key={index} 
                                      className="dropdown-item"
                                      onClick={() => handleStudentSelect(student)}
                                    >
                                      <div className="dropdown-item-content">
                                        <div className="student-avatar-small">{student.charAt(0).toUpperCase()}</div>
                                        <span className="student-name-dropdown">{student}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="form-actions">
                          <button 
                            type="submit"
                            disabled={loading || sessions.length === 0 || students.length === 0 || teachers.length === 0}
                            className="mark-attendance-btn"
                          >
                            {loading ? (
                              <>
                                <div className="spinner"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                <CheckCircle size={18} />
                                Mark Present
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                      
                      {txStatus && (
                        <div className={`tx-status ${txStatus.includes('Error') || txStatus.includes('cancelled') || txStatus.includes('already marked') ? 'error' : txStatus.includes('successfully') ? 'success' : 'info'}`}>
                          {txStatus}
                        </div>
                      )}
                      
                      {(sessions.length === 0 || students.length === 0 || teachers.length === 0) && (
                        <div className="info-banner">
                          <div className="info-icon">ℹ️</div>
                          <div className="info-text">
                            <strong>Getting Started:</strong> Please register teachers, create sessions, and register students first to mark attendance.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'students' && (
              <div className="students-tab">
                <div className="page-header">
                  <h2>Student Management</h2>
                  <p>Manage student registrations</p>
                </div>
                
                <div className="content-grid">
                  <div className="form-card">
                    <h3><UserPlus size={20} /> Register New Student</h3>
                    <form onSubmit={registerStudent}>
                      <div className="form-group">
                        <label>Student Name</label>
                        <input 
                          name="studentName"
                          placeholder="Enter student name"
                          required
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={loading}
                        className="submit-btn"
                      >
                        {loading ? 'Processing...' : 'Register Student'}
                      </button>
                    </form>
                    {txStatus && (
                      <div className={`tx-status ${txStatus.includes('Error') || txStatus.includes('cancelled') || txStatus.includes('already marked') ? 'error' : txStatus.includes('successfully') ? 'success' : 'info'}`}>
                        {txStatus}
                      </div>
                    )}
                  </div>

                  <div className="list-card">
                    <h3><Users size={20} /> Registered Students ({students.length})</h3>
                    <div className="student-list">
                      {students.map((name, index) => (
                        <div key={index} className="student-item">
                          <div className="student-avatar">{name.charAt(0).toUpperCase()}</div>
                          <span className="student-name">{name}</span>
                        </div>
                      ))}
                      {students.length === 0 && (
                        <div className="empty-state">No students registered yet</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'teachers' && (
              <div className="teachers-tab">
                <div className="page-header">
                  <h2>Teachers</h2>
                  <p>Manage teacher registrations</p>
                </div>
                
                <div className="content-grid">
                  <div className="form-card">
                    <h3><GraduationCap size={20} /> Register New Teacher</h3>
                    <form onSubmit={registerTeacher}>
                      <div className="form-group">
                        <label>Teacher Name</label>
                        <input 
                          name="teacherName"
                          placeholder="Enter teacher name"
                          required
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={loading}
                        className="submit-btn"
                      >
                        {loading ? 'Processing...' : 'Register Teacher'}
                      </button>
                    </form>
                    {txStatus && (
                      <div className={`tx-status ${txStatus.includes('Error') || txStatus.includes('cancelled') || txStatus.includes('already marked') ? 'error' : txStatus.includes('successfully') ? 'success' : 'info'}`}>
                        {txStatus}
                      </div>
                    )}
                  </div>

                  <div className="list-card">
                    <h3><GraduationCap size={20} /> Registered Teachers ({teachers.length})</h3>
                    <div className="student-list">
                      {teachers.map((name, index) => (
                        <div key={index} className="student-item">
                          <div className="student-avatar">{name.charAt(0).toUpperCase()}</div>
                          <span className="student-name">{name}</span>
                        </div>
                      ))}
                      {teachers.length === 0 && (
                        <div className="empty-state">No teachers registered yet</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="sessions-tab">
                <div className="page-header">
                  <h2>Sessions</h2>
                  <p>Manage class sessions</p>
                </div>
                
                <div className="content-grid">
                  <div className="form-card">
                    <h3><Calendar size={20} /> Create New Session</h3>
                    <form onSubmit={createSession}>
                      <div className="form-group">
                        <label>Teacher</label>
                        <select name="teacherName" required>
                          <option value="">Select a teacher</option>
                          {teachers.map((teacher, index) => (
                            <option key={index} value={teacher}>{teacher}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Session Name</label>
                        <input 
                          name="sessionName"
                          placeholder="Enter session name"
                          required
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={loading || teachers.length === 0}
                        className="submit-btn"
                      >
                        {loading ? 'Processing...' : 'Create Session'}
                      </button>
                    </form>
                    {txStatus && (
                      <div className={`tx-status ${txStatus.includes('Error') || txStatus.includes('cancelled') || txStatus.includes('already marked') ? 'error' : txStatus.includes('successfully') ? 'success' : 'info'}`}>
                        {txStatus}
                      </div>
                    )}
                  </div>

                  <div className="list-card full-width">
                    <h3><Calendar size={20} /> All Sessions ({sessions.length})</h3>
                    <div className="session-grid">
                      {sessions.map((session, index) => (
                        <div 
                          key={index}
                          className="session-card"
                          onClick={() => openSessionModal(session)}
                        >
                          <div className="session-header">
                            <h4>{session.name}</h4>
                            <span className="session-id">#{session.id}</span>
                          </div>
                          <div className="session-teacher">
                            <GraduationCap size={14} />
                            <span>{session.teacherName}</span>
                          </div>
                          <div className="attendance-count">
                            <CheckCircle size={16} />
                            <span>Click to view attendance</span>
                          </div>
                        </div>
                      ))}
                      {sessions.length === 0 && (
                        <div className="empty-state">No sessions created yet</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        )}
      </main>

      {showModal && selectedSession && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{selectedSession.name}</h3>
                <p className="session-teacher-modal">
                  <GraduationCap size={16} />
                  Teacher: {selectedSession.teacherName}
                </p>
              </div>
              <button 
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <h4>Present Students ({sessionAttendance.length})</h4>
              {loading ? (
                <div className="loading">Loading attendance...</div>
              ) : sessionAttendance.length > 0 ? (
                <div className="attendance-list">
                  {sessionAttendance.map((student, index) => (
                    <div key={index} className="attendance-item">
                      <CheckCircle size={16} className="present-icon" />
                      <span>{student}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No students marked present yet</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App