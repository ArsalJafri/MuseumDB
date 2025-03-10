import React, { useState } from "react";
import "../../styles/admin.css"; // Make sure your CSS handles modal styles

// this is just a tatic table for now
const ManageEmployees = () => {
    const [employees, setEmployees] = useState([
        { id: 1, name: "John Doe", position: "Manager", hireDate: "2023-01-10", salary: 50000, status: "Active" },
        { id: 2, name: "Jane Smith", position: "Giftshop", hireDate: "2022-06-15", salary: 40000, status: "Active" },
        { id: 3, name: "Alice Johnson", position: "Curator", hireDate: "2021-03-20", salary: 55000, status: "Inactive" }
    ]);

    const [newEmployee, setNewEmployee] = useState({
        name: "", position: "", hireDate: "", salary: ""
    });

    const [isModalOpen, setIsModalOpen] = useState(false); // State to handle modal visibility

    // Handle input changes
    const handleInputChange = (e) => {
        setNewEmployee({ ...newEmployee, [e.target.name]: e.target.value });
    };

    // Add a new employee
    const addEmployee = () => {
        if (newEmployee.name && newEmployee.position && newEmployee.hireDate && newEmployee.salary) {
            setEmployees([
                ...employees,
                {
                    id: employees.length + 1,
                    name: newEmployee.name,
                    position: newEmployee.position,
                    hireDate: newEmployee.hireDate,
                    salary: parseFloat(newEmployee.salary),
                    status: "Active"
                }
            ]);
            setNewEmployee({ name: "", position: "", hireDate: "", salary: "" }); // Reset form
            setIsModalOpen(false); // Close the modal after adding an employee
        }
    };

    // Toggle employee status
    const toggleStatus = (id) => {
        setEmployees(
            employees.map(emp =>
                emp.id === id ? { ...emp, status: emp.status === "Active" ? "Inactive" : "Active" } : emp
            )
        );
    };

    return (
        <main className="manage-employees-container">
            <h1 className="page-title">Manage Employees</h1>

            {/* "Add Employee" Button - Opens the modal */}
            <button className="open-modal-button" onClick={() => setIsModalOpen(true)}>Add Employee</button>

            {/* Employee Table */}
            <div className="employee-table-container">
                <table className="employee-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Position</th>
                            <th>Hire Date</th>
                            <th>Salary ($)</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => (
                            <tr key={emp.id}>
                                <td>{emp.name}</td>
                                <td>{emp.position}</td>
                                <td>{emp.hireDate}</td>
                                <td>${emp.salary.toLocaleString()}</td>
                                <td>{emp.status}</td>
                                <td>
                                    <button
                                        className={emp.status === "Active" ? "inactive-button" : "active-button"}
                                        onClick={() => toggleStatus(emp.id)}
                                    >
                                        {emp.status === "Active" ? "Deactivate" : "Activate"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal for Adding Employees */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Add New Employee</h2>
                        <input
                            type="text"
                            name="name"
                            placeholder="Employee Name"
                            value={newEmployee.name}
                            onChange={handleInputChange}
                            className="input-field"
                        />
                        <input
                            type="text"
                            name="position"
                            placeholder="Position"
                            value={newEmployee.position}
                            onChange={handleInputChange}
                            className="input-field"
                        />
                        <input
                            type="date"
                            name="hireDate"
                            value={newEmployee.hireDate}
                            onChange={handleInputChange}
                            className="input-field"
                        />
                        <input
                            type="number"
                            name="salary"
                            placeholder="Salary"
                            value={newEmployee.salary}
                            onChange={handleInputChange}
                            className="input-field"
                        />
                        <div className="modal-buttons">
                            <button className="add-employee-button" onClick={addEmployee}>Add Employee</button>
                            <button className="close-modal-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default ManageEmployees;

