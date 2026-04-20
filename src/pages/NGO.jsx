import { useState } from "react";

function NGO() {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = () => {
    console.log({ title, location });
  };

  return (
    <div>
      <h2>Post a Need</h2>

      <input
        placeholder="Title"
        onChange={(e) => setTitle(e.target.value)}
      />

      <br />

      <input
        placeholder="Location"
        onChange={(e) => setLocation(e.target.value)}
      />

      <br />

      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}

export default NGO;