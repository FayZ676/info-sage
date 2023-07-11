import { useState, useEffect } from "react";

export const Modal = ({
  setIsModalOpen,
  namespaceOperation,
  namespaceList,
  setIsNamespacesUpdated,
}) => {
  const [urls, setUrls] = useState("");
  const [isUpdatingNamespaces, setIsUpdatingNamespaces] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [namespaceEntry, setNamespaceEntry] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [isNamespaceEntryValid, setIsNamespaceEntryValid] = useState(true);

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    // Check the namespace Operation
    if (namespaceOperation === "Update") {
      setModalTitle("Update Your Namespaces");
      setModalMessage(
        "Enter a comma separated list of the URLs (Websites and Google Docs) you want to talk to and the name Namespace you want to add them to."
      );
      setApiUrl("/api/query/uploadResource");
    } else if (namespaceOperation === "Delete") {
      setModalTitle("Delete Your Namespaces");
      setModalMessage("Enter the name of the Namespace you want to delete.");
      setApiUrl("/api/query/deleteResource");
    }
  }, [namespaceOperation]);

  // Handle the form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingNamespaces(true);

    console.log("Namespace Operation: ", namespaceOperation);

    // Update Namespace Operations
    if (namespaceOperation === "Update") {
      const urlsSplit = urls.split(",").map((url) => url.trim());

      // Send the URL list to the server-side to make sure they are all valid
      const existenceCheck = await fetch("/api/checkUrlExistence", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ urls: urlsSplit }),
      });

      // If the existence check is successful, filter out the existing urls and send the list to the server-side for upload
      if (existenceCheck.ok) {
        const { urlExistenceList } = await existenceCheck.json();

        const existingUrls = urlExistenceList
          .filter((item) => item.exists)
          .map((item) => item.url);

        // Send list of existing urls to the API
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            urlsList: existingUrls,
            namespace: namespaceEntry,
          }),
        });
        const data = await response.json();
      } else {
        console.log("Error: Failed to check URL existence");
        // Handle the error case
      }
    }
    //Delete Namespace Operations
    else if (namespaceOperation === "Delete") {
      // map the namespace objects in the namespaceList array to an array of strings
      const namespaceNames = namespaceList.map(
        (namespaceItem) => namespaceItem.namespace
      );
      if (namespaceNames.includes(namespaceEntry)) {
        setIsNamespaceEntryValid(true);
        try {
          console.log("Deleting Namespace");
          console.log("namespace: ", namespaceEntry);
          console.log("apiUrl: ", apiUrl);
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({ namespace: namespaceEntry }),
          });
          console.log("response: ", response);
          const data = await response.json();
          console.log("data: ", data);
        } catch (e) {
          console.log("ERROR: ", e);
        }
      } else {
        setIsNamespaceEntryValid(false);
      }
    } else {
      // Handle the error case
      console.log("Error: Invalid Namespace Operation");
    }

    setIsUpdatingNamespaces(false);
    setIsNamespacesUpdated(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-900 opacity-50" />
      <div className="z-10 rounded-md bg-white p-2">
        <div className="text-black">
          <h2 className="text-xl">{modalTitle}</h2>
          <p>{modalMessage}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <fieldset disabled={isUpdatingNamespaces}>
            <textarea
              className="w-full resize-none rounded-md bg-gray-200 p-2 text-black"
              value={namespaceEntry}
              onChange={(e) => setNamespaceEntry(e.target.value)}
              placeholder="'My Namespace ...'"
            ></textarea>
            {namespaceOperation === "Update" && (
              <div>
                <textarea
                  value={urls}
                  className="w-full resize-none rounded-md bg-gray-200 p-2 text-black"
                  placeholder="www.example.com, www.example2.com, www.example3.com"
                  onChange={(e) => setUrls(e.target.value)}
                ></textarea>
              </div>
            )}
            {isNamespaceEntryValid === false && (
              <div className="m-2">
                <p className="text-red-600">
                  <strong>{namespaceEntry}</strong> is not a valid Namespace.
                  You probably spelled it wrong.
                </p>
              </div>
            )}
            <div className="space-x-2">
              <button
                type="submit"
                className="rounded bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600 disabled:bg-emerald-300"
              >
                {namespaceOperation}
              </button>
              <button
                className="rounded bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600 disabled:bg-emerald-300"
                onClick={handleCloseModal}
              >
                Close
              </button>
            </div>
          </fieldset>
        </form>
        {/* For example, you can add file input fields */}
      </div>
    </div>
  );
};
