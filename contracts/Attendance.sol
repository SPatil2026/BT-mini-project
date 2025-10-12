// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Attendance is Ownable {
    struct Session {
        uint256 id;
        uint256 timestamp; // unix timestamp when session created
        string metadata; // optional (e.g., "Math 101 - 2025-10-12")
        uint256 presentCount;
    }

    // list of student status
    mapping(address => bool) public isStudent;
    address[] public studentList;

    // sessions mapping
    mapping(uint256 => Session) public sessions;
    uint256 public sessionCount;

    // attendance[sessionId][student] => bool
    mapping(uint256 => mapping(address => bool)) private attendance;

    // student -> total present count
    mapping(address => uint256) public attendanceCount;

    // events
    event StudentAdded(address indexed student);
    event StudentRemoved(address indexed student);
    event SessionCreated(uint256 indexed sessionId, uint256 timestamp, string metadata);
    event AttendanceMarked(uint256 indexed sessionId, address indexed student);

    modifier onlyStudent(address _student) {
        require(isStudent[_student], "Not a registered student");
        _;
    }

    constructor() {
        sessionCount = 0;
    }

    // Instructor/owner functions
    function addStudent(address _student) external onlyOwner {
        require(_student != address(0), "Zero address");
        require(!isStudent[_student], "Already student");
        isStudent[_student] = true;
        studentList.push(_student);
        emit StudentAdded(_student);
    }

    function removeStudent(address _student) external onlyOwner onlyStudent(_student) {
        isStudent[_student] = false;
        // Note: studentList is not compacted for gas reasons; off-chain indexers should handle pruning.
        emit StudentRemoved(_student);
    }

    function createSession(string calldata _metadata) external onlyOwner returns (uint256) {
        sessionCount += 1;
        sessions[sessionCount] = Session({
            id: sessionCount,
            timestamp: block.timestamp,
            metadata: _metadata,
            presentCount: 0
        });
        emit SessionCreated(sessionCount, block.timestamp, _metadata);
        return sessionCount;
    }

    // Mark attendance for a student in a session. Only owner (instructor) marks.
    function markAttendance(uint256 _sessionId, address _student) external onlyOwner onlyStudent(_student) {
        require(_sessionId > 0 && _sessionId <= sessionCount, "Invalid session");
        require(!attendance[_sessionId][_student], "Already marked");
        attendance[_sessionId][_student] = true;
        sessions[_sessionId].presentCount += 1;
        attendanceCount[_student] += 1;
        emit AttendanceMarked(_sessionId, _student);
    }

    // View helpers
    function isPresent(uint256 _sessionId, address _student) external view returns (bool) {
        return attendance[_sessionId][_student];
    }

    function getSession(uint256 _sessionId) external view returns (Session memory) {
        require(_sessionId > 0 && _sessionId <= sessionCount, "Invalid session");
        return sessions[_sessionId];
    }

    function getAllStudents() external view returns (address[] memory) {
        return studentList;
    }

    function getStudentAttendanceCount(address _student) external view returns (uint256) {
        return attendanceCount[_student];
    }
}