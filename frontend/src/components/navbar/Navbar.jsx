import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, User, LogOut, Settings, ChevronDown } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      console.log("Searching for:", searchTerm);
    }
  };

  const handleLogout = () => {
    console.log("Logging out...");
    navigate("/login");
  };

  const userName = "Admin User";
  const userInitials = userName.split(' ').map(n => n[0]).join('');

  return (
    <header className="navbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      
      {/* LEFT SIDE */}
      <div className="navbar-left" style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
        
        {/* ✅ FIXED SEARCH BAR */}
        <form 
          onSubmit={handleSearch} 
          className="search-form"
        >
          <div className="input-wrap" style={{ position: "relative", width: "100%" }}>
            <Search size={16} className="input-icon" style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search students, parents, staff..."
              className="form-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", paddingLeft: "30px" }}
            />
          </div>
        </form>

        <select className="form-select campus-select">
          <option value="bangalore">Bangalore Campus</option>
          <option value="pune">Pune Campus</option>
          <option value="mumbai">Mumbai Campus</option>
        </select>
      </div>

      {/* RIGHT SIDE */}
      <div className="navbar-right" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        
        <Link to="/refund-management">
          <button className="btn btn-primary btn-sm">
            Refund Management
          </button>
        </Link>

        <Link to="/bulk-upload">
          <button className="btn btn-outline btn-sm">
            Bulk Upload
          </button>
        </Link>

        <Link to="/export-report">
          <button className="btn btn-outline btn-sm">
            Export Report
          </button>
        </Link>

        <div className="notification-icon">
          <Bell size={18} />
          <span className="notification-badge">3</span>
        </div>

        {/* PROFILE */}
        <div className="profile-dropdown">
          <button 
            className="profile-trigger"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="user-avatar-nav">
              {userInitials}
            </div>
            <ChevronDown size={14} className={`dropdown-arrow ${showProfileMenu ? 'rotate' : ''}`} />
          </button>

          {showProfileMenu && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <div className="user-avatar-dropdown">
                  {userInitials}
                </div>
                <div>
                  <div className="dropdown-user-name">{userName}</div>
                  <div className="dropdown-user-role">School Administrator</div>
                </div>
              </div>

              <div className="dropdown-divider"></div>

              <Link to="/profile" className="dropdown-item" onClick={() => setShowProfileMenu(false)}>
                <User size={14} />
                My Profile
              </Link>

              <Link to="/settings" className="dropdown-item" onClick={() => setShowProfileMenu(false)}>
                <Settings size={14} />
                Settings
              </Link>

              <div className="dropdown-divider"></div>

              <button className="dropdown-item logout" onClick={handleLogout}>
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
