import Head from "next/head";

export const HomePage = () => (
  <>
    <Head>
      <title>Airline Protocol</title>
      <meta
        name="description"
        content="Jet-inspired Solana lending protocol, rebuilt with Airline Protocol."
      />
    </Head>
    <main>
      <div className="airline-page">
        <header className="airline-header">
          <div className="airline-brand">
            <div className="airline-badge" />
            <div>
              <div className="airline-subtitle">Airline Protocol</div>
              <div className="airline-title">Flight deck for on-chain credit.</div>
            </div>
          </div>
          <div className="airline-metric">
            <span>Localnet status</span>
            <strong>Idle</strong>
          </div>
        </header>

        <section className="airline-hero">
          <div className="airline-card">
            <h2>Jet V1 rhythms, Airline signature.</h2>
            <p>
              This cockpit will connect directly to localnet, load IDL metadata, and surface
              reserves, obligations, and health metrics with zero backend.
            </p>
            <div className="airline-cta">
              <button className="airline-button" type="button">
                Start localnet
              </button>
              <button className="airline-button secondary" type="button">
                View IDL bundle
              </button>
            </div>
          </div>
          <div className="airline-card">
            <h3>Ready for build-out</h3>
            <div className="airline-grid">
              <div className="airline-panel">Reserves overview</div>
              <div className="airline-panel">Utilization & APR</div>
              <div className="airline-panel">Position health</div>
              <div className="airline-panel">Liquidation queues</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </>
);

export default HomePage;
