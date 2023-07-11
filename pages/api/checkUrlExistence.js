export default async function handler(req, res) {
  const { urls } = req.body;
  try {
    // Validate the urls and check their existence
    const urlExistenceList = await Promise.all(
      urls.map(async (url) => {
        try {
          const response = await fetch(url, { method: "HEAD" });
          return {
            url,
            exists: response.ok,
          };
        } catch (error) {
          console.error(`Error checking URL existence for ${url}:`, error);
          return {
            url,
            exists: false,
          };
        }
      })
    );
    res.status(200).json({ urlExistenceList });
  } catch (e) {
    console.log("ERROR: ", e);
    res.status(500).json({ error: "Internal server error" });
  }
}
