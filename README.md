# Student Attendance System (Solidity) — Complete Mini-Project

> A complete, ready-to-run mini-project for a Student Attendance System using Solidity, Hardhat, and a minimal React frontend. Includes smart contract, deployment scripts, tests, and instructions.

---

## Project Overview

**Goal:** Build a simple, auditable attendance system on Ethereum-compatible chains where an instructor (owner) can register students, create class sessions, and mark attendance. Students and auditors can query attendance history.

**Main features:**

* Instructor (owner) control: add/remove students, create sessions, mark attendance.
* Record attendance per session per student on-chain.
* Query functions to get session details and student attendance counts.
* Events emitted for all important actions.
* Hardhat test suite and deployment script.
* Minimal React + ethers.js frontend for interacting with the contract.

**Security & design notes:**

* Access control via OpenZeppelin `Ownable`.
* Solidity 0.8.x — safe from integer under/overflows.
* Gas-conscious data structures: `mapping(uint256 => mapping(address => bool))` for attendance.

---

## Repository Structure

```
student-attendance/
├─ contracts/
│  └─ Attendance.sol
├─ scripts/
│  └─ deploy.js
├─ test/
│  └─ attendance.test.js
├─ frontend/
│  ├─ src/
│  │  ├─ App.jsx
│  │  ├─ index.js
│  │  └─ AttendanceABI.json
│  ├─ public/
│  │  └─ index.html
│  └─ package.json
├─ hardhat.config.js
├─ package.json
└─ README.md
```

---

## How to run locally (step-by-step)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run Hardhat node locally:**
   ```bash
   npx hardhat node
   ```
   (Keep this terminal running)

3. **Deploy to local node (in new terminal):**
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

4. **Copy deployed contract address** and paste in `frontend/src/App.jsx` as `CONTRACT_ADDRESS`.

5. **Setup frontend:**
   ```bash
   cd frontend
   npm install
   npm start
   ```

6. **Configure MetaMask:**
   - Connect to `http://127.0.0.1:8545`
   - Import one of the Hardhat node private keys

7. **Use the UI** to add students, create sessions, and mark attendance (owner account is the deployer)

---

## Testing

Run the test suite:
```bash
npm test
```

---

## Contract Features

### Core Functions
- `addStudent(address)` - Add a student (owner only)
- `removeStudent(address)` - Remove a student (owner only)
- `createSession(string metadata)` - Create a new class session (owner only)
- `markAttendance(uint256 sessionId, address student)` - Mark student present (owner only)

### View Functions
- `isPresent(uint256 sessionId, address student)` - Check if student was present
- `getSession(uint256 sessionId)` - Get session details
- `getAllStudents()` - Get all registered students
- `getStudentAttendanceCount(address student)` - Get total attendance count

### Events
- `StudentAdded(address student)`
- `StudentRemoved(address student)`
- `SessionCreated(uint256 sessionId, uint256 timestamp, string metadata)`
- `AttendanceMarked(uint256 sessionId, address student)`

---

## Potential Extensions

* Use OpenZeppelin `AccessControl` to create `TEACHER_ROLE` and `AUDITOR_ROLE`.
* Allow students to mark themselves present using off-chain OTP or signatures.
* Add IPFS/Arweave metadata links for session materials.
* Add certificate issuance when a student has high attendance.
* Add pagination and indexer (TheGraph) for efficient queries.

---

## Security Considerations

* Only contract owner can manage students and mark attendance
* Students cannot mark their own attendance
* Duplicate attendance marking is prevented
* Zero address validation for student registration
* Session ID validation for attendance marking