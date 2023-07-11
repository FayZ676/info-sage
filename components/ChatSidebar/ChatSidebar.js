import {
  faMinus,
  faPaperclip,
  faPlus,
  faRightFromBracket,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Modal } from "components/Modal";
import Link from "next/link";
import { useEffect, useState } from "react";

export const ChatSidebar = ({
  chatId,
  selectedNamespace,
  setSelectedNamespace,
}) => {
  const [chatList, setChatList] = useState([]);
  const [namespaceList, setNamespaceList] = useState([]);
  const [isNamespacesFetched, setIsNamespacesFetched] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNamespacesLoading, setIsNamespacesLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [namespaceOperation, setNamespaceOperation] = useState("");
  const [isNamespacesUpdated, setIsNamespacesUpdated] = useState(true);

  // USE EFFECTS
  // ---------------------------------------------------------------------------
  // Fetch the list of chats from the API
  useEffect(() => {
    const loadChatList = async () => {
      const res = await fetch("/api/chat/getChatList", {
        method: "POST",
      });
      const json = await res.json();
      setChatList(json?.chats || []);
    };
    loadChatList();
  }, [chatId, chatList]);

  // Fetch the list of namespaces from the API when the dropdown is open
  useEffect(() => {
    const loadNamespaceList = async () => {
      if (!!isDropdownOpen && !isNamespacesFetched) {
        setIsNamespacesLoading(true);
        const res = await fetch("/api/query/list/namespaces", {
          method: "POST",
        });
        const json = await res.json();
        setNamespaceList(json?.message || []);
        setIsNamespacesFetched(true);
        setIsNamespacesLoading(false);
      }
      if (!!isNamespacesUpdated) {
        const res = await fetch("/api/query/list/namespaces", {
          method: "POST",
        });
        const json = await res.json();
        setNamespaceList(json?.message || []);
        setIsNamespacesUpdated(false);
      }
    };
    loadNamespaceList();
  }, [isDropdownOpen, isNamespacesFetched, isNamespacesUpdated]);

  // Reset the namespace value when the dropdown is closed
  useEffect(() => {
    if (!isDropdownOpen && selectedNamespace !== "") {
      setSelectedNamespace("");
      console.log("Namespace value reset");
    }
  }, [isDropdownOpen, selectedNamespace, setSelectedNamespace]);
  // ---------------------------------------------------------------------------

  // Set the namespace value when a namespace is clicked
  const handleNamespaceClick = (e) => {
    setSelectedNamespace(e.target.innerText);
    console.log("Namespace value set");
  };

  // Open the modal when the edit namespaces button is clicked
  const handleOpenModal = ({ operation }) => {
    if (isModalOpen) {
      setIsModalOpen(false);
      setNamespaceOperation("");
    }
    setIsModalOpen(true);
    setNamespaceOperation(operation);
  };

  // Delete a chat from the database and refresh the chat list
  const handleDeleteChat = async (chatId) => {
    try {
      const response = await fetch(`/api/chat/deleteChat`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          chatId,
        }),
      });

      if (response.ok) {
        setChatList((prevChatList) =>
          prevChatList.filter((chat) => chat._id !== chatId)
        );
      } else {
        console.error("Error deleting chat");
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      // Handle the error case
    }
  };

  return (
    <div className="flex flex-col overflow-hidden bg-gray-900 text-white">
      {/* Namespace Dropdown */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="side-menu-item bg-emerald-500 hover:bg-emerald-600"
      >
        <FontAwesomeIcon icon={faPaperclip} />
        Namespaces
      </button>
      {isDropdownOpen && !isNamespacesLoading && (
        <div>
          <div className="flex max-h-40 flex-col overflow-auto text-center">
            {namespaceList.map((namespace) => (
              <button
                key={namespace.id}
                onClick={handleNamespaceClick}
                className={`side-menu-namespace-item ${
                  namespace.namespace === selectedNamespace
                    ? "bg-gray-700 hover:bg-gray-700"
                    : ""
                }`}
              >
                {namespace.namespace}
              </button>
            ))}
          </div>

          {/* Edit Namespace Buttons */}
          <div className="mx-2 flex flex-row gap-2">
            {/* Update Namespaces */}
            <button
              className="w-full rounded-md bg-emerald-500 p-2 text-left hover:bg-emerald-600"
              onClick={() => handleOpenModal({ operation: "Update" })}
            >
              <FontAwesomeIcon icon={faPlus} className="pr-2" />
            </button>
            {/* Remove Namespaces */}
            <button
              className="w-full rounded-md bg-emerald-500 p-2 text-left hover:bg-emerald-600"
              onClick={() => handleOpenModal({ operation: "Delete" })}
            >
              <FontAwesomeIcon icon={faMinus} className="pr-2" />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen === true && (
        <Modal
          setIsModalOpen={setIsModalOpen}
          namespaceOperation={namespaceOperation}
          namespaceList={namespaceList}
          setIsNamespacesUpdated={setIsNamespacesUpdated}
        />
      )}

      {/* New Chat */}
      <Link
        href="/chat"
        className="side-menu-item mb-2 bg-emerald-500 hover:bg-emerald-600"
      >
        <FontAwesomeIcon icon={faPlus} />
        New Chat
      </Link>

      {/* Chat List */}
      <div className="flex-1 overflow-auto bg-gray-950">
        {chatList.map((chat) => (
          <div
            key={chat._id}
            className={`side-menu-chat-item ${
              chatId === chat._id ? "bg-gray-700 hover:bg-gray-700" : ""
            }`}
          >
            <button
              onClick={() => handleDeleteChat(chat._id)}
              className="m-1 rounded-md p-1 hover:bg-gray-600"
            >
              <FontAwesomeIcon icon={faTrash} className="text-white/50" />
            </button>

            <Link
              href={`/chat/${chat._id}`}
              className="overflow-hidden text-ellipsis whitespace-nowrap"
            >
              <span className="">{chat.title}</span>
            </Link>
          </div>
        ))}
      </div>

      {/* Logout */}
      <Link href="/api/auth/logout" className="side-menu-item">
        <FontAwesomeIcon icon={faRightFromBracket} />
        Logout
      </Link>
    </div>
  );
};
