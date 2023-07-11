export default async function handler(req, res) {
  try {
    // Call the API and list all namespaces
    const namespaces = await fetch(
      "http://127.0.0.1:8000/list_namespaces?index=secondmuse",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );
    const json = await namespaces.json();
    res.status(200).json(json);
  } catch (e) {
    console.log("ERROR: ", e);
    res.status(500).json({ error: "Internal server error" });
  }
}
