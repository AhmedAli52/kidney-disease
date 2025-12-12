// client/pages/patientdashboard.js
import React, { useState } from "react";
import FileUploader from "../shared/FileUploader";
import HistoryList from "../shared/HistoryList";

export default function PatientDashboard({ user }) {
  const patientId = user?.id || 'p_anon';
  const [last, setLast] = useState(null);

  function onUploaded(record) {
    setLast(record);
    // we also dispatch the event inside uploader, so history will refresh
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <h2>Patient Dashboard</h2>
        <p className="small">Upload RF recording and get prediction</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Upload</h3>
        <div style={{ marginTop: 10 }}>
          <FileUploader patientId={patientId} onUploaded={onUploaded} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Latest Result</h3>
        {!last && <div className="small" style={{ marginTop: 8 }}>No result yet</div>}
        {last && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{last.prediction.category || last.prediction.prediction}</div>
            <div className="small">Confidence: {(last.prediction.confidence || 0).toFixed(4)}</div>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 8 }}>
        <h3>History</h3>
        <div style={{ marginTop: 12 }}>
          <HistoryList patientId={patientId} />
        </div>
      </div>
    </div>
  );
}
