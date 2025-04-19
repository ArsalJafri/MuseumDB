import "../../styles/admin.css";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const ManagerHome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    fetch("https://museumdb.onrender.com/auth/profile", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!((data.role === "staff" || data.role === "admin") && data.job_title === "Manager")) {
          alert("Access denied. Only Managers can access this page.");
          navigate("/");
        }
      })
      .catch((err) => {
        navigate("/");
      });
  }, [navigate]);

  return (
    <main className="admin-container">
      <h3 className="admin-title">Manager Dashboard</h3>

      <div className="admin-dashboard">
        {/* Reports Card */}
        <div className="admin-card">
          <h4>Reports</h4>
          <button onClick={() => navigate('/admin/view-complaints')} className="admin-button">
            View Complaints
          </button>
        </div>

        {/* Manage Card */}
        <div className="admin-card">
          <h4>Manage</h4>
          <button onClick={() => navigate('/admin/manage-employees')} className="admin-button">
            Manage Employees
          </button>
          <button onClick={() => navigate('/admin/manage-giftshop')} className="admin-button">
            Manage Gift Shop
          </button>
        </div>
      </div>

      <button onClick={() => navigate('/profile')} className="admin-profile-button">
        Go to Profile
      </button>
    </main>
  );
};

export default ManagerHome;
