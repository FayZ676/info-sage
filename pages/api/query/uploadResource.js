export default async function handler(req, res) {
  try {
    const { urlsList, namespace } = req.body;
    console.log("urlsList: ", urlsList);
    console.log("namespace: ", namespace);
    const response = await fetch(
      `http://127.0.0.1:8000/upload_webpage_webbase?namespace=${namespace}&index=secondmuse&crawl=false`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(urlsList), // Pass urls directly instead of wrapping in an object
      }
    );
    const json = await response.json();
    res.status(200).json(json);
  } catch (e) {
    console.log("ERROR: ", e);
    res.status(500).json({ error: "Internal server error" });
  }
}
