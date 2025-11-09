// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract Attendance {
    struct Student {
        string name;
        bool isRegistered;
        uint256 attendanceCount;
    }

    struct Teacher {
        string name;
        bool isRegistered;
    }

    struct Session {
        uint256 id;
        string name;
        string teacherName;
    }

    mapping(string => Student) public students;
    string[] public studentNames;
    
    mapping(string => Teacher) public teachers;
    string[] public teacherNames;
    
    uint256 public sessionCount;
    mapping(uint256 => Session) public sessions;
    mapping(uint256 => mapping(string => bool)) public attendance;

    event StudentRegistered(string name);
    event TeacherRegistered(string name);
    event SessionCreated(uint256 sessionId, string sessionName, string teacherName);
    event AttendanceMarked(uint256 sessionId, string studentName);

    function registerStudent(string memory _name) public {
        require(!students[_name].isRegistered, "Student already registered");
        students[_name] = Student(_name, true, 0);
        studentNames.push(_name);
        emit StudentRegistered(_name);
    }

    function registerTeacher(string memory _name) public {
        require(!teachers[_name].isRegistered, "Teacher already registered");
        teachers[_name] = Teacher(_name, true);
        teacherNames.push(_name);
        emit TeacherRegistered(_name);
    }

    function createSession(string memory _sessionName, string memory _teacherName) public {
        require(teachers[_teacherName].isRegistered, "Teacher not registered");
        sessionCount++;
        sessions[sessionCount] = Session(sessionCount, _sessionName, _teacherName);
        emit SessionCreated(sessionCount, _sessionName, _teacherName);
    }

    function markAttendance(uint256 _sessionId, string memory _studentName) public {
        require(_sessionId > 0 && _sessionId <= sessionCount, "Invalid session");
        require(students[_studentName].isRegistered, "Student not registered");
        require(!attendance[_sessionId][_studentName], "Already marked");
        
        attendance[_sessionId][_studentName] = true;
        students[_studentName].attendanceCount++;
        emit AttendanceMarked(_sessionId, _studentName);
    }

    function getStudentCount() public view returns (uint256) {
        return studentNames.length;
    }

    function getTeacherCount() public view returns (uint256) {
        return teacherNames.length;
    }

    function getStudent(string memory _name) public view returns (Student memory) {
        return students[_name];
    }

    function getTeacher(string memory _name) public view returns (Teacher memory) {
        return teachers[_name];
    }

    function getSession(uint256 _sessionId) public view returns (Session memory) {
        return sessions[_sessionId];
    }

    function isPresent(uint256 _sessionId, string memory _studentName) public view returns (bool) {
        return attendance[_sessionId][_studentName];
    }
}