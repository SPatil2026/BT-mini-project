// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract Attendance {
    struct Student {
        string name;
        bool isRegistered;
        uint256 attendanceCount;
    }

    mapping(string => Student) public students;
    string[] public studentNames;
    
    uint256 public sessionCount;
    mapping(uint256 => string) public sessions;
    mapping(uint256 => mapping(string => bool)) public attendance;

    event StudentRegistered(string name);
    event SessionCreated(uint256 sessionId, string sessionName);
    event AttendanceMarked(uint256 sessionId, string studentName);

    function registerStudent(string memory _name) public {
        require(!students[_name].isRegistered, "Student already registered");
        students[_name] = Student(_name, true, 0);
        studentNames.push(_name);
        emit StudentRegistered(_name);
    }

    function createSession(string memory _sessionName) public {
        sessionCount++;
        sessions[sessionCount] = _sessionName;
        emit SessionCreated(sessionCount, _sessionName);
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

    function getStudent(string memory _name) public view returns (Student memory) {
        return students[_name];
    }

    function isPresent(uint256 _sessionId, string memory _studentName) public view returns (bool) {
        return attendance[_sessionId][_studentName];
    }
}