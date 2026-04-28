const PageLoader = ({
  title = "Loading...",
  text = "Please wait while we prepare this page."
}) => {
  return (
    <section className="page">
      <div className="section-card page-loader-card">
        <div className="loader-spinner" />

        <div>
          <h3>{title}</h3>
          <p>{text}</p>
        </div>
      </div>
    </section>
  );
};

export default PageLoader;
