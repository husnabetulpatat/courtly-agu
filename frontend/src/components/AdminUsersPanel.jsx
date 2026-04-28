import { useEffect, useMemo, useState } from "react";
import api from "../api/api";

const AdminUsersPanel = () => {
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchText, setSearchText] = useState("");
  const [message, setMessage] = useState({
    type: "",
    text: ""
  });

  const loadUsers = async () => {
    try {
      const response = await api.get("/users/admin/all");
      setUsers(response.data.users);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Could not load users."
      });
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase());

      const matchesRole = selectedRole === "ALL" || user.role === selectedRole;

      const matchesStatus =
        selectedStatus === "ALL" ||
        (selectedStatus === "ACTIVE" && user.isActive) ||
        (selectedStatus === "INACTIVE" && !user.isActive) ||
        (selectedStatus === "NO_SHOW" && user.stats.noShowCount > 0);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchText, selectedRole, selectedStatus]);

  const updateUser = async (userId, payload) => {
    try {
      setMessage({
        type: "",
        text: ""
      });

      await api.patch(`/users/admin/${userId}`, payload);

      setMessage({
        type: "success",
        text: "User updated successfully."
      });

      await loadUsers();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "User update failed."
      });
    }
  };

  const getUserRiskLabel = (user) => {
    if (user.stats.noShowCount >= 2) {
      return "High no-show risk";
    }

    if (user.stats.noShowCount === 1) {
      return "Has no-show";
    }

    return "Clear";
  };

  return (
    <div className="section-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Users</p>
          <h2>User management</h2>
        </div>

        <button className="secondary-button" onClick={loadUsers}>
          Refresh
        </button>
      </div>

      {message.text && (
        <div className={`alert ${message.type === "error" ? "error" : ""}`}>
          {message.text}
        </div>
      )}

      <div className="admin-user-toolbar">
        <input
          placeholder="Search by name or email..."
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />

        <select
          value={selectedRole}
          onChange={(event) => setSelectedRole(event.target.value)}
        >
          <option value="ALL">All roles</option>
          <option value="STUDENT">Students</option>
          <option value="COACH">Coaches</option>
          <option value="ADMIN">Admins</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active users</option>
          <option value="INACTIVE">Inactive users</option>
          <option value="NO_SHOW">Has no-show</option>
        </select>
      </div>

      <div className="admin-user-summary">
        <div>
          <span>Total users</span>
          <strong>{users.length}</strong>
        </div>

        <div>
          <span>Visible</span>
          <strong>{filteredUsers.length}</strong>
        </div>

        <div>
          <span>No-show users</span>
          <strong>
            {users.filter((user) => user.stats.noShowCount > 0).length}
          </strong>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="empty-state compact-empty">
          <h3>No users found</h3>
          <p>Try changing filters or search text.</p>
        </div>
      ) : (
        <div className="admin-user-grid">
          {filteredUsers.map((user) => (
            <div key={user.id} className="admin-user-card">
              <div className="card-top">
                <div className="admin-user-title">
                  <div className="user-avatar compact-avatar">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3>{user.fullName}</h3>
                    <p>{user.email}</p>
                  </div>
                </div>

                <span className={`badge ${user.isActive ? "confirmed" : "cancelled"}`}>
                  {user.isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>

              <div className="details-box">
                <div className="detail-row">
                  <span>Role</span>
                  <strong>{user.role}</strong>
                </div>

                <div className="detail-row">
                  <span>Tennis level</span>
                  <strong>{user.tennisLevel}</strong>
                </div>

                <div className="detail-row">
                  <span>Racket</span>
                  <strong>{user.hasRacket ? "Has racket" : "May need racket"}</strong>
                </div>

                <div className="detail-row">
                  <span>No-show status</span>
                  <strong>{getUserRiskLabel(user)}</strong>
                </div>
              </div>

              <div className="admin-user-stats">
                <div>
                  <span>Reservations</span>
                  <strong>{user.stats.reservationCount}</strong>
                </div>

                <div>
                  <span>Active</span>
                  <strong>{user.stats.activeReservationCount}</strong>
                </div>

                <div>
                  <span>No-show</span>
                  <strong>{user.stats.noShowCount}</strong>
                </div>

                <div>
                  <span>Lessons</span>
                  <strong>{user.stats.lessonApplicationCount}</strong>
                </div>

                <div>
                  <span>Matches</span>
                  <strong>{user.stats.matchPostCount}</strong>
                </div>
              </div>

              <div className="admin-user-controls">
                <label>Role</label>
                <select
                  value={user.role}
                  onChange={(event) =>
                    updateUser(user.id, {
                      role: event.target.value
                    })
                  }
                >
                  <option value="STUDENT">STUDENT</option>
                  <option value="COACH">COACH</option>
                  <option value="ADMIN">ADMIN</option>
                </select>

                <label>Tennis level</label>
                <select
                  value={user.tennisLevel}
                  onChange={(event) =>
                    updateUser(user.id, {
                      tennisLevel: event.target.value
                    })
                  }
                >
                  <option value="BEGINNER">BEGINNER</option>
                  <option value="BEGINNER_PLUS">BEGINNER_PLUS</option>
                  <option value="INTERMEDIATE">INTERMEDIATE</option>
                  <option value="ADVANCED">ADVANCED</option>
                </select>

                <label>Racket status</label>
                <select
                  value={user.hasRacket ? "YES" : "NO"}
                  onChange={(event) =>
                    updateUser(user.id, {
                      hasRacket: event.target.value === "YES"
                    })
                  }
                >
                  <option value="YES">Has racket</option>
                  <option value="NO">May need racket</option>
                </select>

                <div className="button-row wrap">
                  {user.isActive ? (
                    <button
                      className="danger-button"
                      onClick={() =>
                        updateUser(user.id, {
                          isActive: false
                        })
                      }
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        updateUser(user.id, {
                          isActive: true
                        })
                      }
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUsersPanel;
