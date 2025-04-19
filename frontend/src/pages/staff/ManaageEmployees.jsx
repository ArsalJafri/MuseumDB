import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/admin.css";
import "../../styles/manage.css";

const ManageEmployees = () => {
    const navigate = useNavigate();

    const [filterStatus, setFilterStatus] = useState("all");
    const [employees, setEmployees] = useState([]);
    const [newEmployee, setNewEmployee] = useState({
        firstName: "", lastName: "", phoneNumber: "", email: "",
        department: "", position: "", hireDate: "", salary: "", status: true
    });
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetch("http://localhost:5000/auth/profile", {
            method: "GET",
            credentials: "include"
        })
            .then(res => {
                if (!res.ok) throw new Error("Not authenticated");
                return res.json();
            })
            .then(data => {
                const allowedJobTitles = ["Administration", "Manager"];
                if (
                    !["admin", "staff"].includes(data.role) ||
                    (data.role === "staff" && !allowedJobTitles.includes(data.jobTitle))
                ) {
                    alert("Access denied");
                    navigate("/");
                }
            })
            .catch(err => {
                console.error("Access error:", err);
                navigate("/");
            });
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [filterStatus]);

    const fetchEmployees = async () => {
        try {
            const response = await fetch("https://museumdb.onrender.com/employees", {
                credentials: "include"
            });
            const data = await response.json();
            console.log("Fetched Employees Data:", data);

            const filtered = data.filter(emp => {
                if (filterStatus === "active") return emp.Active_Status === 1;
                if (filterStatus === "inactive") return emp.Active_Status === 0;
                return true; // "all"
            });

            setEmployees(filtered);
        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    };

    const handleInputChange = (e) => {
        setNewEmployee({ ...newEmployee, [e.target.name]: e.target.value });
    };

    const addEmployee = async () => {
        if (
            !newEmployee.firstName || !newEmployee.lastName || !newEmployee.phoneNumber ||
            !newEmployee.email || !newEmployee.department || !newEmployee.position ||
            !newEmployee.hireDate || !newEmployee.salary
        ) {
            alert("Please fill out all fields.");
            return;
        }
        console.log("Sending New Employee Data:", JSON.stringify(newEmployee));

        try {
            const response = await fetch("http://localhost:5000/employees", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newEmployee),
            });

            const result = await response.json();
            console.log("Server Response:", result);
            if (response.ok) {
                alert(result.message);
                await fetchEmployees();
                setNewEmployee({
                    firstName: "", lastName: "", phoneNumber: "", email: "",
                    department: "", position: "", hireDate: "", salary: ""
                });
                setIsModalOpen(false);
            } else {
                alert("Error adding employee.");
            }
        } catch (error) {
            console.error("Failed to add employee:", error);
        }
    };

    const toggleStatus = async (staffId) => {
        try {
            const response = await fetch(`http://localhost:5000/employees/toggle?id=${staffId}`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            });
            const result = await response.json();

            if (response.ok) {
                setEmployees(prev =>
                    prev.map(emp =>
                        emp.Staff_ID === staffId
                            ? { ...emp, Active_Status: !Boolean(emp.Active_Status) }
                            : emp
                    )
                );
            } else {
                alert("Error toggling status");
            }
        } catch (error) {
            console.error("Error toggling status:", error);
        }
    };

    return (
        <main className="manage-wrapper">
            <div className="manage-header">
                <h1>Manage Employees</h1>
                <div className="filter-buttons">
                    <button
                        className={filterStatus === "all" ? "active" : ""}
                        onClick={() => setFilterStatus("all")}
                    >
                        All
                    </button>
                    <button
                        className={filterStatus === "active" ? "active" : ""}
                        onClick={() => setFilterStatus("active")}
                    >
                        Active
                    </button>
                    <button
                        className={filterStatus === "inactive" ? "active" : ""}
                        onClick={() => setFilterStatus("inactive")}
                    >
                        Inactive
                    </button>
                </div>
                <button className="open-modal-button" onClick={() => setIsModalOpen(true)}>
                    Add Employee
                </button>
            </div>

            <div className="employee-table-container">
                <table className="manage-table">
                    <thead>
                        <tr>
                            <th>Staff ID</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Phone Number</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>Job Title</th>
                            <th>Hire Date</th>
                            <th>Salary ($)</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => (
                            <tr key={emp.Staff_ID}>
                                <td>{emp.Staff_ID}</td>
                                <td>{emp.First_Name}</td>
                                <td>{emp.Last_Name}</td>
                                <td>{emp.Phone_Number}</td>
                                <td>{emp.Email}</td>
                                <td>{emp.Department}</td>
                                <td>{emp.Job_title}</td>
                                <td>{new Date(emp.Hire_Date).toLocaleDateString()}</td>
                                <td>
                                    {emp.Salary !== null
                                        ? `$${emp.Salary.toLocaleString()}`
                                        : "N/A"}
                                </td>
                                <td>
                                    <button
                                        className={emp.Active_Status ? "deactivate-button" : "activate-button"}
                                        onClick={() => toggleStatus(emp.Staff_ID)}
                                    >
                                        {emp.Active_Status ? "Deactivate" : "Activate"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Add New Employee</h2>
                        <input
                            type="text" name="firstName" placeholder="First Name"
                            value={newEmployee.firstName} onChange={handleInputChange}
                            className="input-field"
                        />
                        <input
                            type="text" name="lastName" placeholder="Last Name"
                            value={newEmployee.lastName} onChange={handleInputChange}
                            className="input-field"
                        />
                        <input
                            type="text" name="phoneNumber" placeholder="Phone Number"
                            value={newEmployee.phoneNumber} onChange={handleInputChange}
                            className="input-field"
                        />
                        <input
                            type="email" name="email" placeholder="Email"
                            value={newEmployee.email} onChange={handleInputChange}
                            className="input-field"
                        />
                        <select
                            name="department" value={newEmployee.department}
                            onChange={handleInputChange} className="input-field"
                        >
                            <option value="">Select Department</option>
                            <option value="Exhibitions">Exhibitions</option>
                            <option value="Events">Events</option>
                            <option value="Security">Security</option>
                            <option value="Administration">Administration</option>
                            <option value="Special Exhibitions">Special Exhibitions</option>
                        </select>
                        <input
                            type="text" name="position" placeholder="Position"
                            value={newEmployee.position} onChange={handleInputChange}
                            className="input-field"
                        />
                        <input
                            type="date" name="hireDate" value={newEmployee.hireDate}
                            onChange={handleInputChange} className="input-field"
                        />
                        <input
                            type="number" name="salary" placeholder="Salary"
                            value={newEmployee.salary} onChange={handleInputChange}
                            className="input-field"
                        />

                        <div className="modal-buttons">
                            <button className="add-employee-button" onClick={addEmployee}>
                                Add Employee
                            </button>
                            <button className="close-modal-button" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default ManageEmployees;
