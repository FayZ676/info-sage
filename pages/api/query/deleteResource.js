// export default async function handler(req, res) {
//   try {
//     const { namespace } = req.body;
//     console.log("namespace: ", namespace);
//     const response = await fetch(
//       `http://127.0.0.1:8000/delete_namespace?namespace=${namespace}&index=secondmuse`,
//       {
//         method: "POST",
//         headers: {
//           accept: "application/json",
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     const json = await response.json();
//     console.log("json: ", json);
//     res.status(200).json(json);
//   } catch (e) {
//     console.log("ERROR: ", e);
//     res.status(500).json({ error: "Internal server error" });
//   }
// }

// deleteResource.js
export default async function handler(req, res) {
  try {
    const { namespace } = req.body;
    console.log("namespace: ", namespace);
    const response = await fetch(
      `http://127.0.0.1:8000/delete_namespace?namespace=${namespace}&index=secondmuse`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const json = await response.json();
      console.log("json: ", json);
      res.status(200).json(json);
    } else {
      const errorResponse = await response.text();
      console.error("Error deleting namespace:", errorResponse);
      res.status(500).json({ error: "Internal server error" });
    }
  } catch (e) {
    console.log("ERROR: ", e);
    res.status(500).json({ error: "Internal server error" });
  }
}
