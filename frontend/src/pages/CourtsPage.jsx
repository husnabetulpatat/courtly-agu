import { useEffect, useState } from "react";
import api from "../api/api";

const CourtsPage = () => {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCourts = async () => {
    try {
      const response = await api.get("/courts");
      setCourts(response.data.courts);
    } catch (error) {
      console.log("Court load error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourts();
  }, []);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Campus courts</p>
          <h1>Courts</h1>
          <p>View available tennis courts on campus.</p>
        </div>
      </div>

      {loading ? (
        <div className="page-message">Loading courts...</div>
      ) : (
        <div className="card-grid">
          {courts.map((court) => (
            <div key={court.id} className="section-card">
              <div className="card-top">
                <h2>{court.name}</h2>
                <span className={`badge ${court.status.toLowerCase()}`}>
                  {court.status}
                </span>
              </div>
              <p>{court.description}</p>
              <small>{court.location}</small>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default CourtsPage;
