import { useEffect, useState } from "react";
import api from "../api/api";
import PageLoader from "../components/PageLoader";
import { useToast } from "../context/ToastContext";

const CourtsPage = () => {
  const toast = useToast();

  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCourts = async () => {
    try {
      setLoading(true);

      const response = await api.get("/courts");
      setCourts(response.data.courts);
    } catch (error) {
      toast.error("Could not load courts.");
      console.log("Court load error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourts();
  }, []);

  if (loading) {
    return (
      <PageLoader
        title="Loading courts..."
        text="Campus court information is being prepared."
      />
    );
  }

  return (
    <section className="page">
      <div className="section-card page-banner">
        <div>
          <p className="eyebrow">Campus facilities</p>
          <h2>Our courts</h2>
          <p>
            View each registered court area, check its status and understand how
            it can be used within the platform.
          </p>
        </div>

        <div className="banner-metric">
          <span>Total courts</span>
          <strong>{courts.length}</strong>
        </div>
      </div>

      {courts.length === 0 ? (
        <div className="section-card empty-state">
          <h3>No courts found</h3>
          <p>Courts will appear here once they are added by the admin.</p>
        </div>
      ) : (
        <div className="card-grid">
          {courts.map((court) => (
            <div key={court.id} className="section-card premium-card">
              <div className="card-top">
                <div>
                  <p className="mini-eyebrow">Court #{court.id}</p>
                  <h2>{court.name}</h2>
                </div>

                <span className={`badge ${court.status.toLowerCase()}`}>
                  {court.status}
                </span>
              </div>

              <p className="card-description">{court.description}</p>

              <div className="details-box">
                <div className="detail-row">
                  <span>Location</span>
                  <strong>{court.location || "Not specified"}</strong>
                </div>

                <div className="detail-row">
                  <span>Status</span>
                  <strong>{court.status}</strong>
                </div>

                <div className="detail-row">
                  <span>Usage</span>
                  <strong>
                    {court.status === "ACTIVE"
                      ? "Available for reservations"
                      : "Currently restricted"}
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default CourtsPage;
